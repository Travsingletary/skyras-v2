import { NextRequest, NextResponse } from 'next/server';
import { workflowTasksDb, workflowsDb } from '@/lib/database';
import type { AgentName } from '@/lib/agentProcessor';

/**
 * GET /api/agents/tasks - Get pending tasks for a specific agent
 * 
 * Query params:
 * - agentName: 'cassidy' | 'letitia' | 'giorgio' | 'jamal'
 * - status: 'pending' | 'in_progress' (default: 'pending')
 * - limit: number (default: 10)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentName = searchParams.get('agentName') as AgentName | null;
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (!agentName) {
      return NextResponse.json(
        {
          success: false,
          error: 'agentName query parameter is required (cassidy, letitia, giorgio, or jamal)',
        },
        { status: 400 }
      );
    }

    const validAgents: AgentName[] = ['cassidy', 'letitia', 'giorgio', 'jamal'];
    if (!validAgents.includes(agentName)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid agentName. Must be one of: ${validAgents.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Get all active workflows
    // Note: This is a simplified approach. In production, you'd want a more efficient query
    // that filters tasks by agent_name directly
    const allWorkflows = await workflowsDb.getByUserId('public'); // Get all workflows for now
    
    // Collect tasks from all active workflows
    const allTasks: any[] = [];
    for (const workflow of allWorkflows) {
      if (workflow.status === 'active') {
        const tasks = await workflowTasksDb.getByWorkflowId(workflow.id);
        allTasks.push(...tasks);
      }
    }

    // Filter by agent_name and status
    const filteredTasks = allTasks
      .filter(task => {
        // Check if agent_name is in metadata or as a direct property
        const taskAgentName = (task as any).agent_name || (task.metadata as any)?.agent_name;
        return taskAgentName === agentName && task.status === status;
      })
      .slice(0, limit)
      .sort((a, b) => (a.position || 0) - (b.position || 0)); // Sort by position

    return NextResponse.json({
      success: true,
      data: {
        tasks: filteredTasks,
        count: filteredTasks.length,
        agentName,
        status,
      },
    });
  } catch (error) {
    console.error('[/api/agents/tasks GET] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch tasks: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agents/tasks/[taskId]/complete - Mark a task as completed
 * 
 * Body:
 * - results: Record<string, any> (optional) - Results from agent execution
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, results, error: taskError } = body;

    if (!taskId) {
      return NextResponse.json(
        {
          success: false,
          error: 'taskId is required',
        },
        { status: 400 }
      );
    }

    const task = await workflowTasksDb.getById(taskId);
    if (!task) {
      return NextResponse.json(
        {
          success: false,
          error: 'Task not found',
        },
        { status: 404 }
      );
    }

    if (taskError) {
      // Mark as failed
      await workflowTasksDb.update(taskId, {
        status: 'failed',
        metadata: {
          ...(task.metadata as Record<string, unknown> || {}),
          error: taskError,
        },
      });
    } else {
      // Mark as completed
      await workflowTasksDb.update(taskId, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        metadata: {
          ...(task.metadata as Record<string, unknown> || {}),
          results: results || {},
        },
      });

      // Update workflow completed_tasks count
      const workflow = await workflowsDb.getById(task.workflow_id);
      if (workflow) {
        await workflowsDb.update(task.workflow_id, {
          completed_tasks: workflow.completed_tasks + 1,
        });

        // Check if all tasks are completed
        const allTasks = await workflowTasksDb.getByWorkflowId(task.workflow_id);
        const allCompleted = allTasks.every(t =>
          t.status === 'completed' || t.status === 'skipped' || t.status === 'failed'
        );

        if (allCompleted) {
          await workflowsDb.update(task.workflow_id, { status: 'completed' });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        taskId,
        status: taskError ? 'failed' : 'completed',
      },
    });
  } catch (error) {
    console.error('[/api/agents/tasks POST] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to update task: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}


