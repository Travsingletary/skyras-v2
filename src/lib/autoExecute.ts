/**
 * Auto-Execute System
 * 
 * Automatically creates workflows and tasks from Marcus delegations,
 * then triggers parallel execution for all involved agents.
 * 
 * This ensures that when Marcus agrees to do work, it actually happens.
 */

import { workflowTasksDb, workflowsDb } from '@/lib/database';
import type { WorkflowInsert, WorkflowTaskInsert, AgentName } from '@/types/database';
import type { AgentDelegation } from '@/agents/core/BaseAgent';

export interface AutoExecuteResult {
  workflowId: string;
  tasksCreated: number;
  agentsTriggered: string[];
  executionResults: Array<{
    agentName: string;
    success: boolean;
    tasksProcessed?: number;
    error?: string;
  }>;
}

/**
 * Map delegation agent names to database agent names
 */
function normalizeAgentName(delegationAgent: string): AgentName {
  const normalized = delegationAgent.toLowerCase();
  if (['giorgio', 'creative', 'script', 'concept'].includes(normalized)) {
    return 'giorgio';
  }
  if (['jamal', 'distribution', 'posting', 'schedule'].includes(normalized)) {
    return 'jamal';
  }
  if (['letitia', 'catalog', 'cataloging', 'asset'].includes(normalized)) {
    return 'letitia';
  }
  if (['cassidy', 'compliance', 'licensing', 'watermark'].includes(normalized)) {
    return 'cassidy';
  }
  // Default fallback
  return 'giorgio';
}

/**
 * Extract workflow type from delegations
 */
function determineWorkflowType(delegations: AgentDelegation[]): 'creative' | 'distribution' | 'licensing' | 'cataloging' | 'custom' {
  const agents = delegations.map(d => normalizeAgentName(d.agent));
  
  if (agents.includes('cassidy')) return 'licensing';
  if (agents.includes('giorgio')) return 'creative';
  if (agents.includes('jamal')) return 'distribution';
  if (agents.includes('letitia')) return 'cataloging';
  
  return 'custom';
}

/**
 * Auto-execute: Create workflow and tasks, then trigger execution
 * 
 * This is called whenever Marcus delegates work to ensure it actually happens.
 */
export async function autoExecuteWorkflow(
  delegations: AgentDelegation[],
  userId: string,
  projectId?: string,
  workflowName?: string,
  summary?: string
): Promise<AutoExecuteResult> {
  if (delegations.length === 0) {
    throw new Error('Cannot auto-execute: no delegations provided');
  }

  // Standardize userId to 'public' for now (until user scoping is complete)
  // This ensures tasks are visible to the poller
  const effectiveUserId = 'public';

  // Determine workflow type from delegations
  const workflowType = determineWorkflowType(delegations);

  // Create workflow
  const workflowData: WorkflowInsert = {
    user_id: effectiveUserId,
    project_id: projectId,
    name: workflowName || `Auto-executed workflow - ${new Date().toLocaleString()}`,
    type: workflowType,
    status: 'active',
    summary: summary || `Auto-executed workflow with ${delegations.length} task(s)`,
    agent_name: 'marcus',
    total_tasks: delegations.length,
    completed_tasks: 0,
    metadata: {
      autoExecuted: true,
      originalUserId: userId,
      delegations: delegations.map(d => ({
        agent: d.agent,
        task: d.task,
        status: d.status,
      })),
    },
  };

  const workflow = await workflowsDb.create(workflowData);

  // Convert delegations to workflow tasks
  const taskData: WorkflowTaskInsert[] = delegations.map((delegation, index) => {
    const agentName = normalizeAgentName(delegation.agent);
    
    return {
      workflow_id: workflow.id,
      title: delegation.task,
      description: `Auto-created from delegation to ${delegation.agent}`,
      status: 'pending',
      position: index,
      agent_name: agentName,
      metadata: {
        delegatedFrom: 'marcus',
        originalAgent: delegation.agent,
        delegationStatus: delegation.status,
        autoExecuted: true,
      },
    };
  });

  // Create all tasks
  const createdTasks = await workflowTasksDb.createMany(taskData);

  // Get unique agents involved
  const uniqueAgents = [...new Set(createdTasks.map(t => t.agent_name))] as AgentName[];

  // Trigger parallel execution for all agents
  const executionResults = await Promise.allSettled(
    uniqueAgents.map(async (agentName) => {
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
        const pollUrl = apiBaseUrl 
          ? `${apiBaseUrl}/api/agents/poll`
          : '/api/agents/poll';

        const response = await fetch(pollUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agentName,
            maxTasks: 5,
            autoExecute: true,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        return {
          agentName,
          success: result.success || false,
          tasksProcessed: result.data?.tasksProcessed || 0,
        };
      } catch (error) {
        return {
          agentName,
          success: false,
          error: (error as Error).message,
        };
      }
    })
  );

  // Format execution results
  const formattedResults = executionResults.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        agentName: uniqueAgents[index],
        success: false,
        error: result.reason?.message || 'Unknown error',
      };
    }
  });

  return {
    workflowId: workflow.id,
    tasksCreated: createdTasks.length,
    agentsTriggered: uniqueAgents,
    executionResults: formattedResults,
  };
}

