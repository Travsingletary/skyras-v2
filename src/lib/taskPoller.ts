/**
 * Task Poller - Background service for agents to automatically fetch and execute tasks
 * 
 * This service allows agents to poll for pending tasks and execute them automatically.
 * Can be run as a background process or triggered on-demand.
 */

import { workflowTasksDb, workflowsDb } from '@/lib/database';
import { processTask } from '@/lib/agentProcessor';
import type { AgentName } from '@/lib/agentProcessor';
import type { WorkflowTask } from '@/types/database';

export type { AgentName };

interface PollingConfig {
  agentName: AgentName;
  intervalMs?: number; // Polling interval in milliseconds
  maxConcurrentTasks?: number; // Max tasks to process simultaneously
  autoExecute?: boolean; // Automatically execute tasks when found
}

interface TaskExecutionResult {
  taskId: string;
  success: boolean;
  error?: string;
  results?: Record<string, any>;
}

/**
 * Get all active workflows from all users
 */
async function getAllActiveWorkflows() {
  try {
    // Query for all workflows with status 'active'
    const { getSupabaseClient } = await import('@/backend/supabaseClient');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('status', 'active');

    if (error) {
      console.error('[getAllActiveWorkflows] Error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[getAllActiveWorkflows] Error:', error);
    return [];
  }
}

/**
 * Poll for pending tasks assigned to a specific agent
 */
export async function pollForTasks(
  agentName: AgentName,
  limit = 5,
  userId?: string
): Promise<WorkflowTask[]> {
  try {
    // Get all active workflows for all users if no userId specified
    // This allows agents to work on tasks from any user
    const allWorkflows = userId
      ? await workflowsDb.getByUserId(userId)
      : await getAllActiveWorkflows();
    
    // Collect tasks from all active workflows
    const allTasks: WorkflowTask[] = [];
    for (const workflow of allWorkflows) {
      if (workflow.status === 'active') {
        const tasks = await workflowTasksDb.getByWorkflowId(workflow.id);
        allTasks.push(...tasks);
      }
    }

    // Filter by agent_name and status
    const pendingTasks = allTasks
      .filter(task => {
        const taskAgentName = (task as any).agent_name || (task.metadata as any)?.agent_name;
        return taskAgentName === agentName && task.status === 'pending';
      })
      .sort((a, b) => {
        // Sort by position, then by due_date
        if (a.position !== b.position) {
          return a.position - b.position;
        }
        if (a.due_date && b.due_date) {
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        return 0;
      })
      .slice(0, limit);

    return pendingTasks;
  } catch (error) {
    console.error(`[TaskPoller] Error polling for ${agentName} tasks:`, error);
    return [];
  }
}

/**
 * Execute a single task
 */
export async function executeTask(task: WorkflowTask): Promise<TaskExecutionResult> {
  try {
    // Mark as in_progress
    await workflowTasksDb.update(task.id, {
      status: 'in_progress',
    });

    // Get workflow for agent_name fallback
    const workflow = await workflowsDb.getById(task.workflow_id);
    const agentName = (task as any).agent_name || 
                     (task.metadata as any)?.agent_name || 
                     workflow?.agent_name as AgentName;

    // Get file metadata if task references a file
    let fileMetadata;
    if (task.metadata && typeof task.metadata === 'object' && 'fileId' in task.metadata) {
      const { filesDb } = await import('@/lib/database');
      const file = await filesDb.getById(task.metadata.fileId as string);
      if (file) {
        fileMetadata = {
          fileName: file.original_name,
          fileType: file.file_type,
          fileUrl: file.public_url,
          fileSize: file.file_size,
        };
      }
    }

    // Process task using agent processor
    const taskContext = {
      taskId: task.id,
      workflowId: task.workflow_id,
      title: task.title,
      description: task.description || '',
      agentName,
      fileMetadata,
      action: (task.metadata as any)?.action,
      payload: (task.metadata as any)?.payload,
    };

    const result = await processTask(taskContext);

    // Update task with results
    if (result.success) {
      await workflowTasksDb.update(task.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        metadata: {
          ...(task.metadata as Record<string, unknown> || {}),
          results: result.results,
          output: result.results.output,
        },
      });

      // Update workflow completed_tasks count
      if (workflow) {
        await workflowsDb.update(task.workflow_id, {
          completed_tasks: workflow.completed_tasks + 1,
        });

        // Check if all tasks are completed
        const allTasks = await workflowTasksDb.getByWorkflowId(task.workflow_id);
        const allCompleted = allTasks.every(t =>
          t.status === 'completed' || t.status === 'skipped'
        );

        if (allCompleted) {
          await workflowsDb.update(task.workflow_id, { status: 'completed' });
        }
      }
    } else {
      await workflowTasksDb.update(task.id, {
        status: 'skipped',
        metadata: {
          ...(task.metadata as Record<string, unknown> || {}),
          error: result.error,
          failed: true,
        },
      });
    }

    return {
      taskId: task.id,
      success: result.success,
      error: result.error,
      results: result.results,
    };
  } catch (error) {
    console.error(`[TaskPoller] Error executing task ${task.id}:`, error);
    
    // Mark as failed
    await workflowTasksDb.update(task.id, {
      status: 'skipped',
      metadata: {
        ...(task.metadata as Record<string, unknown> || {}),
        error: error instanceof Error ? error.message : 'Unknown error',
        failed: true,
      },
    });

    return {
      taskId: task.id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Poll and execute tasks for an agent
 */
export async function pollAndExecute(
  config: PollingConfig
): Promise<TaskExecutionResult[]> {
  const tasks = await pollForTasks(config.agentName, config.maxConcurrentTasks || 5);
  
  if (tasks.length === 0) {
    return [];
  }

  // Execute tasks (sequentially for now to avoid conflicts)
  const results: TaskExecutionResult[] = [];
  for (const task of tasks) {
    const result = await executeTask(task);
    results.push(result);
  }

  return results;
}

/**
 * Start background polling for an agent
 * Returns a function to stop polling
 */
export function startPolling(
  config: PollingConfig,
  onTaskComplete?: (result: TaskExecutionResult) => void
): () => void {
  const intervalMs = config.intervalMs || 30000; // Default 30 seconds
  let isRunning = true;

  const poll = async () => {
    if (!isRunning) return;

    try {
      const results = await pollAndExecute(config);
      results.forEach(result => {
        if (onTaskComplete) {
          onTaskComplete(result);
        }
      });
    } catch (error) {
      console.error(`[TaskPoller] Error in polling loop for ${config.agentName}:`, error);
    }

    if (isRunning) {
      setTimeout(poll, intervalMs);
    }
  };

  // Start polling
  poll();

  // Return stop function
  return () => {
    isRunning = false;
  };
}

