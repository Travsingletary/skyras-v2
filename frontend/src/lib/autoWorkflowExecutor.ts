/**
 * Auto Workflow Executor
 *
 * Automatically creates workflows and triggers parallel agent execution.
 * No approval step, no planning-only mode - just execute.
 */

import type { AgentDelegation } from '@/agents/core/BaseAgent';

interface AutoWorkflowConfig {
  userId: string;
  workflowName: string;
  workflowType: 'licensing' | 'creative' | 'distribution' | 'cataloging' | 'custom';
  delegations: AgentDelegation[];
  prompt: string;
}

interface AutoWorkflowResult {
  workflowId: string;
  tasksCreated: number;
  agentsTriggered: string[];
  executionStarted: boolean;
}

/**
 * HARD RULE: Marcus must call this whenever he agrees to do work
 *
 * This function:
 * 1. Creates workflow record
 * 2. Creates workflow_tasks for each delegation
 * 3. Triggers PARALLEL execution for all agents
 * 4. Returns execution status
 */
export async function autoCreateAndExecuteWorkflow(
  config: AutoWorkflowConfig
): Promise<AutoWorkflowResult> {
  console.log('[AutoWorkflow] Creating and executing workflow:', config.workflowName);

  // 1. Create workflow
  const workflowResponse = await fetch('/api/workflows', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: config.userId,
      name: config.workflowName,
      type: config.workflowType,
      planMarkdown: config.prompt,
      summary: `Auto-created workflow for: ${config.prompt.slice(0, 100)}...`,
      tasks: config.delegations.map((delegation, index) => ({
        title: `${delegation.agent} - ${delegation.task}`,
        description: `Delegated task: ${delegation.task}`,
        agentName: delegation.agent,
        position: index,
        status: 'pending',
        metadata: {
          agent_name: delegation.agent,
          action: extractAction(delegation.task),
          isDelegation: true,
          autoCreated: true,
        },
      })),
    }),
  });

  if (!workflowResponse.ok) {
    const error = await workflowResponse.json();
    throw new Error(`Failed to create workflow: ${error.error || 'Unknown error'}`);
  }

  const workflowData = await workflowResponse.json();
  const workflowId = workflowData.data.workflow.id;
  const tasksCreated = workflowData.data.tasks?.length || 0;

  console.log('[AutoWorkflow] Created workflow:', workflowId, 'with', tasksCreated, 'tasks');

  // 2. Get unique agents involved
  const uniqueAgents = [...new Set(config.delegations.map(d => d.agent))];

  // 3. Trigger PARALLEL execution for all agents
  const executionPromises = uniqueAgents.map(async (agentName) => {
    try {
      console.log('[AutoWorkflow] Triggering execution for agent:', agentName);

      const pollResponse = await fetch('/api/agents/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName,
          maxTasks: 5,
          autoExecute: true,
        }),
      });

      if (!pollResponse.ok) {
        console.error(`[AutoWorkflow] Failed to trigger ${agentName}:`, await pollResponse.text());
        return false;
      }

      const pollData = await pollResponse.json();
      console.log(`[AutoWorkflow] ${agentName} triggered:`, pollData);
      return true;
    } catch (error) {
      console.error(`[AutoWorkflow] Error triggering ${agentName}:`, error);
      return false;
    }
  });

  // Wait for all agent triggers (but don't wait for execution to complete)
  const executionResults = await Promise.all(executionPromises);
  const executionStarted = executionResults.some(r => r === true);

  console.log('[AutoWorkflow] Execution triggered for agents:', uniqueAgents);

  return {
    workflowId,
    tasksCreated,
    agentsTriggered: uniqueAgents,
    executionStarted,
  };
}

/**
 * Extract action from task description
 */
function extractAction(taskDescription: string): string {
  // Try to extract action from patterns like "generateScriptOutline:Project"
  const match = taskDescription.match(/^([a-zA-Z]+):/);
  if (match) {
    return match[1];
  }

  // Default actions based on keywords
  if (taskDescription.includes('video')) return 'generateRunwayVideo';
  if (taskDescription.includes('script')) return 'generateScriptOutline';
  if (taskDescription.includes('cover') || taskDescription.includes('art')) return 'generateAlbumCover';
  if (taskDescription.includes('distribution')) return 'planDistribution';
  if (taskDescription.includes('catalog')) return 'saveToCatalog';
  if (taskDescription.includes('licensing') || taskDescription.includes('audit')) return 'auditLicensing';

  return 'general';
}

/**
 * Check if Marcus should auto-execute based on his response
 */
export function shouldAutoExecute(marcusResponse: string, delegations: AgentDelegation[]): boolean {
  // HARD RULE: If Marcus has delegations AND agrees to do work, auto-execute
  if (delegations.length === 0) {
    return false;
  }

  // Check for agreement/commitment language
  const agreementPhrases = [
    /i'?ll/i,
    /let me/i,
    /i can/i,
    /i will/i,
    /giorgio will/i,
    /jamal will/i,
    /letitia will/i,
    /cassidy will/i,
    /we'?ll/i,
    /working on/i,
    /creating/i,
    /generating/i,
    /making/i,
  ];

  const hasAgreement = agreementPhrases.some(pattern => pattern.test(marcusResponse));

  // Don't auto-execute if Marcus is just asking questions or clarifying
  const isQuestion = marcusResponse.includes('?');
  const isClarifying = /what|which|how|need to know|can you tell me/i.test(marcusResponse);

  return hasAgreement && !isQuestion && !isClarifying;
}
