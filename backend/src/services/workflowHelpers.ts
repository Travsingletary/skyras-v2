/**
 * Workflow Helper Functions
 * Utilities for creating and managing workflows
 */

const { supabase } = require('./supabaseClient');

export interface WorkflowPlan {
  name: string;
  description?: string;
  steps: Array<{
    stepIndex: number;
    description: string;
    agent: string;
    instruction: string;
    dependencies?: number[];
  }>;
  metadata?: Record<string, unknown>;
}

/**
 * Create workflow from plan
 */
export async function createWorkflowFromPlan(plan: WorkflowPlan): Promise<{ workflowId: string; stepIds: string[] }> {
  // Note: user_id should be passed in plan.metadata or as separate param
  // For now, workflows created via actionDispatcher will have user_id set there
  const { data: workflow, error: workflowError } = await supabase
    .from('workflows')
    .insert({
      name: plan.name,
      description: plan.description || null,
      status: 'in_progress',
      user_id: (plan.metadata as any)?.userId || null, // Extract from metadata if present
      metadata: plan.metadata ? JSON.stringify(plan.metadata) : null
    })
    .select('id')
    .single();

  if (workflowError) {
    throw new Error(`Failed to create workflow: ${workflowError.message}`);
  }

  // Create workflow steps
  const stepIds: string[] = [];
  for (const step of plan.steps) {
    const { data: workflowStep, error: stepError } = await supabase
      .from('workflow_steps')
      .insert({
        workflow_id: workflow.id,
        step_index: step.stepIndex,
        description: step.description,
        agent: step.agent,
        instruction: step.instruction,
        status: 'pending',
        dependencies: step.dependencies ? JSON.stringify(step.dependencies) : null
      })
      .select('id')
      .single();

    if (stepError) {
      console.error(`Failed to create workflow step ${step.stepIndex}:`, stepError);
      continue;
    }

    stepIds.push(workflowStep.id);
  }

  return {
    workflowId: workflow.id,
    stepIds
  };
}

/**
 * Create tasks for workflow
 */
export async function createTasksForWorkflow(workflowId: string, stepIds: string[]): Promise<string[]> {
  const taskIds: string[] = [];

  // Get workflow steps
  const { data: steps } = await supabase
    .from('workflow_steps')
    .select('*')
    .eq('workflow_id', workflowId)
    .order('step_index', { ascending: true });

  if (!steps) {
    return taskIds;
  }

  // Get user_id from workflow
  const { data: workflowData } = await supabase
    .from('workflows')
    .select('user_id')
    .eq('id', workflowId)
    .single();

  const userId = workflowData?.user_id || null;

  for (const step of steps) {
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        workflow_step_id: step.id,
        agent: step.agent,
        title: step.description,
        description: step.instruction,
        status: 'pending',
        priority: 'normal',
        user_id: userId
      })
      .select('id')
      .single();

    if (taskError) {
      console.error(`Failed to create task for step ${step.step_index}:`, taskError);
      continue;
    }

    taskIds.push(task.id);
  }

  return taskIds;
}

/**
 * Update task status
 */
export async function updateTaskStatus(
  taskId: string,
  status: string,
  result?: string,
  error?: string
): Promise<void> {
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString()
  };

  if (result) {
    updateData.result = result;
  }

  if (error) {
    updateData.error = error;
  }

  const { error: updateError } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', taskId);

  if (updateError) {
    throw new Error(`Failed to update task status: ${updateError.message}`);
  }
}

/**
 * Get workflow with steps and tasks
 */
export async function getWorkflowWithDetails(workflowId: string) {
  const { data: workflow } = await supabase
    .from('workflows')
    .select('*')
    .eq('id', workflowId)
    .single();

  if (!workflow) {
    return null;
  }

  const { data: steps } = await supabase
    .from('workflow_steps')
    .select('*')
    .eq('workflow_id', workflowId)
    .order('step_index', { ascending: true });

  const stepIds = steps?.map((s: any) => s.id) || [];
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .in('workflow_step_id', stepIds)
    .order('created_at', { ascending: true });

  return {
    workflow,
    steps: steps || [],
    tasks: tasks || []
  };
}

module.exports = {
  createWorkflowFromPlan,
  createTasksForWorkflow,
  updateTaskStatus,
  getWorkflowWithDetails
};

