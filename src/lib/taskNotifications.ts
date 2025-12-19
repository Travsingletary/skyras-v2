/**
 * Task Notifications - Notify agents when tasks are assigned
 * 
 * This module handles notifying agents when new tasks are created or assigned to them.
 * Can trigger agent polling or send webhook notifications.
 */

import { workflowTasksDb, workflowsDb } from '@/lib/database';
import type { WorkflowTask } from '@/types/database';
import type { AgentName } from '@/lib/agentProcessor';

/**
 * Notify an agent that a new task has been assigned
 */
export async function notifyAgentOfTask(
  taskId: string,
  agentName: AgentName
): Promise<void> {
  try {
    const task = await workflowTasksDb.getById(taskId);
    if (!task) {
      console.warn(`[TaskNotifications] Task ${taskId} not found`);
      return;
    }

    // Option 1: Trigger agent polling via API (if running in same process)
    // In production, this could be a webhook or message queue
    try {
      // Construct absolute URL for server-side fetch
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ||
                        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                         'http://localhost:3000');
      const pollUrl = `${apiBaseUrl}/api/agents/poll`;

      // Fire and forget - don't wait for response
      fetch(pollUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName,
          maxTasks: 1,
          autoExecute: false, // Just notify, don't auto-execute
        }),
      }).catch(err => {
        console.warn(`[TaskNotifications] Failed to trigger poll for ${agentName}:`, err);
      });
    } catch (error) {
      console.warn(`[TaskNotifications] Error notifying agent ${agentName}:`, error);
    }

    console.log(`[TaskNotifications] Notified ${agentName} of new task: ${task.title}`);
  } catch (error) {
    console.error(`[TaskNotifications] Error notifying agent:`, error);
  }
}

/**
 * Notify agents when tasks are created in a workflow
 */
export async function notifyAgentsOfWorkflowTasks(
  workflowId: string
): Promise<void> {
  try {
    const tasks = await workflowTasksDb.getByWorkflowId(workflowId);
    const pendingTasks = tasks.filter(t => t.status === 'pending');

    // Group tasks by agent
    const tasksByAgent = new Map<AgentName, WorkflowTask[]>();

    for (const task of pendingTasks) {
      const agentName = (task as any).agent_name || 
                       (task.metadata as any)?.agent_name;
      
      if (agentName && ['cassidy', 'letitia', 'giorgio', 'jamal'].includes(agentName)) {
        if (!tasksByAgent.has(agentName as AgentName)) {
          tasksByAgent.set(agentName as AgentName, []);
        }
        tasksByAgent.get(agentName as AgentName)!.push(task);
      }
    }

    // Notify each agent
    for (const [agentName, agentTasks] of tasksByAgent.entries()) {
      // Notify for the first task (agent can poll for more)
      if (agentTasks.length > 0) {
        await notifyAgentOfTask(agentTasks[0].id, agentName);
      }
    }
  } catch (error) {
    console.error(`[TaskNotifications] Error notifying agents of workflow tasks:`, error);
  }
}

/**
 * Create a webhook URL for task notifications (for external systems)
 */
export function getTaskWebhookUrl(agentName: AgentName): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 
                  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '';
  
  if (baseUrl) {
    return `${baseUrl}/api/agents/poll?agentName=${agentName}`;
  }
  
  return `/api/agents/poll?agentName=${agentName}`;
}


