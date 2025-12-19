/**
 * Task Dependencies - Resolve and enforce task execution order
 * 
 * Handles task dependencies in workflows to ensure tasks execute in the correct order.
 */

import { workflowTasksDb } from '@/lib/database';
import type { WorkflowTask } from '@/types/database';

interface TaskDependency {
  taskId: string;
  dependsOn: string[]; // Array of task IDs this task depends on
}

/**
 * Extract dependencies from task metadata
 */
export function extractDependencies(task: WorkflowTask): string[] {
  const metadata = task.metadata as Record<string, unknown> || {};
  const dependencies = metadata.dependencies;
  
  if (Array.isArray(dependencies)) {
    return dependencies.filter((dep): dep is string => typeof dep === 'string');
  }
  
  if (typeof dependencies === 'string') {
    return [dependencies];
  }
  
  return [];
}

/**
 * Build dependency graph for all tasks in a workflow
 */
export async function buildDependencyGraph(workflowId: string): Promise<Map<string, string[]>> {
  const tasks = await workflowTasksDb.getByWorkflowId(workflowId);
  const graph = new Map<string, string[]>();

  for (const task of tasks) {
    const deps = extractDependencies(task);
    graph.set(task.id, deps);
  }

  return graph;
}

/**
 * Check if a task's dependencies are satisfied
 */
export async function areDependenciesSatisfied(
  taskId: string,
  workflowId: string
): Promise<boolean> {
  const graph = await buildDependencyGraph(workflowId);
  const dependencies = graph.get(taskId) || [];

  if (dependencies.length === 0) {
    return true; // No dependencies
  }

  const tasks = await workflowTasksDb.getByWorkflowId(workflowId);
  const taskMap = new Map(tasks.map(t => [t.id, t]));

  // Check if all dependencies are completed
  for (const depId of dependencies) {
    const depTask = taskMap.get(depId);
    if (!depTask) {
      console.warn(`[TaskDependencies] Dependency task ${depId} not found`);
      return false;
    }

    if (depTask.status !== 'completed' && depTask.status !== 'skipped') {
      return false; // Dependency not satisfied
    }
  }

  return true;
}

/**
 * Get tasks ready to execute (dependencies satisfied)
 */
export async function getReadyTasks(
  workflowId: string,
  agentName?: string
): Promise<WorkflowTask[]> {
  const tasks = await workflowTasksDb.getByWorkflowId(workflowId);
  const readyTasks: WorkflowTask[] = [];

  for (const task of tasks) {
    // Filter by agent if specified
    if (agentName) {
      const taskAgentName = (task as any).agent_name || (task.metadata as any)?.agent_name;
      if (taskAgentName !== agentName) {
        continue;
      }
    }

    // Only consider pending tasks
    if (task.status !== 'pending') {
      continue;
    }

    // Check dependencies
    const depsSatisfied = await areDependenciesSatisfied(task.id, workflowId);
    if (depsSatisfied) {
      readyTasks.push(task);
    }
  }

  // Sort by position
  readyTasks.sort((a, b) => a.position - b.position);

  return readyTasks;
}

/**
 * Validate dependency graph for cycles
 */
export async function validateDependencyGraph(workflowId: string): Promise<{
  valid: boolean;
  cycles: string[][];
}> {
  const graph = await buildDependencyGraph(workflowId);
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const dfs = (taskId: string, path: string[]): void => {
    visited.add(taskId);
    recursionStack.add(taskId);
    path.push(taskId);

    const deps = graph.get(taskId) || [];
    for (const depId of deps) {
      if (!visited.has(depId)) {
        dfs(depId, [...path]);
      } else if (recursionStack.has(depId)) {
        // Cycle detected
        const cycleStart = path.indexOf(depId);
        cycles.push([...path.slice(cycleStart), depId]);
      }
    }

    recursionStack.delete(taskId);
  };

  for (const taskId of graph.keys()) {
    if (!visited.has(taskId)) {
      dfs(taskId, []);
    }
  }

  return {
    valid: cycles.length === 0,
    cycles,
  };
}


