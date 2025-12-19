/**
 * Delegation Handler
 *
 * Creates workflow tasks in the database when one agent delegates to another.
 * This ensures delegations are visible in the workflow dashboard with real-time updates.
 */

import { workflowTasksDb } from '@/lib/database';
import type { WorkflowTaskInsert, AgentName } from '@/types/database';

export interface DelegationContext {
  parentTaskId: string;
  workflowId: string;
  fromAgent: string;
  toAgent: AgentName;
  taskDescription: string;
  action?: string;
  payload?: Record<string, unknown>;
}

/**
 * Create a child task when one agent delegates to another
 *
 * Example: Marcus delegates "generate script outline" to Giorgio
 * - Creates a new task in the workflow
 * - Assigns it to Giorgio (agent_name = 'giorgio')
 * - Links it to Marcus's parent task via metadata
 * - Returns the created task ID
 */
export async function createDelegationTask(
  context: DelegationContext
): Promise<string> {
  const {
    parentTaskId,
    workflowId,
    fromAgent,
    toAgent,
    taskDescription,
    action,
    payload
  } = context;

  // Get parent task to determine position
  const parentTask = await workflowTasksDb.getById(parentTaskId);
  if (!parentTask) {
    throw new Error(`Parent task ${parentTaskId} not found`);
  }

  // Create descriptive title based on delegation
  const title = `${capitalizeAgent(toAgent)} - ${taskDescription}`;
  const description = `Delegated from ${capitalizeAgent(fromAgent)}`;

  // Create child task positioned after parent
  const childTask: WorkflowTaskInsert = {
    workflow_id: workflowId,
    title,
    description,
    status: 'pending',
    position: parentTask.position + 0.5, // Insert after parent
    agent_name: toAgent,
    metadata: {
      delegatedFrom: fromAgent,
      parentTaskId: parentTaskId,
      action: action,
      payload: payload,
      isDelegation: true,
    },
  };

  const created = await workflowTasksDb.create(childTask);

  // Update parent task to track delegation
  await workflowTasksDb.update(parentTaskId, {
    metadata: {
      ...parentTask.metadata,
      delegatedTo: toAgent,
      childTaskId: created.id,
      delegationCreated: new Date().toISOString(),
    },
  });

  console.log('[delegationHandler] Created delegation task:', {
    taskId: created.id,
    from: fromAgent,
    to: toAgent,
    workflow: workflowId,
  });

  return created.id;
}

/**
 * Helper to capitalize agent names for display
 */
function capitalizeAgent(agent: string): string {
  return agent.charAt(0).toUpperCase() + agent.slice(1);
}

/**
 * Check if a task is a delegation (created by another agent)
 */
export function isDelegationTask(task: { metadata: Record<string, any> }): boolean {
  return task.metadata?.isDelegation === true;
}

/**
 * Get the parent task ID if this is a delegation
 */
export function getParentTaskId(task: { metadata: Record<string, any> }): string | null {
  return task.metadata?.parentTaskId || null;
}

/**
 * Get delegation chain (parent → child → grandchild...)
 */
export async function getDelegationChain(taskId: string): Promise<string[]> {
  const chain: string[] = [taskId];
  let currentTask = await workflowTasksDb.getById(taskId);

  // Walk up to find root parent
  while (currentTask && isDelegationTask(currentTask)) {
    const parentId = getParentTaskId(currentTask);
    if (!parentId) break;
    chain.unshift(parentId);
    currentTask = await workflowTasksDb.getById(parentId);
  }

  return chain;
}
