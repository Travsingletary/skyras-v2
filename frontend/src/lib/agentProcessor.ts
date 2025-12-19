/**
 * Agent Processor - Executes workflow tasks using AI agents
 *
 * This service manages the execution of workflow tasks by delegating to
 * specialized agents (Cassidy, Letitia, Giorgio, Jamal)
 */

import { createComplianceAgent } from '@/agents/compliance';
import { createGiorgioAgent } from '@/agents/giorgio';
import { createJamalAgent } from '@/agents/jamal';
import { createLetitiaAgent } from '@/agents/letitia';

export type AgentName = 'cassidy' | 'letitia' | 'giorgio' | 'jamal';

interface TaskContext {
  taskId: string;
  workflowId: string;
  title: string;
  description: string;
  agentName: AgentName;
  fileMetadata?: {
    fileName: string;
    fileType: string;
    fileUrl: string;
    fileSize: number;
  };
}

interface ProcessingResult {
  success: boolean;
  results: Record<string, any>;
  error?: string;
}

/**
 * Agent factory - creates the appropriate agent instance
 */
function getAgent(agentName: AgentName) {
  switch (agentName) {
    case 'cassidy':
      return createComplianceAgent();
    case 'letitia':
      return createLetitiaAgent();
    case 'giorgio':
      return createGiorgioAgent();
    case 'jamal':
      return createJamalAgent();
    default:
      throw new Error(`Unknown agent: ${agentName}`);
  }
}

/**
 * Process a task using the appropriate AI agent
 */
export async function processTask(context: TaskContext): Promise<ProcessingResult> {
  try {
    const agent = getAgent(context.agentName);

    // Build the prompt from task context
    let prompt = `${context.title}\n\n${context.description || ''}`;

    // Add file metadata if available
    if (context.fileMetadata) {
      prompt += `\n\nFile Information:
- Name: ${context.fileMetadata.fileName}
- Type: ${context.fileMetadata.fileType}
- Size: ${(context.fileMetadata.fileSize / 1024 / 1024).toFixed(2)} MB
- URL: ${context.fileMetadata.fileUrl}`;
    }

    // Determine action and payload from task metadata
    const taskMetadata = context as any;
    const action = taskMetadata.action || taskMetadata.metadata?.action;
    const payload = taskMetadata.payload || taskMetadata.metadata?.payload || {
      project: taskMetadata.metadata?.project || 'SkySky',
      ...(context.fileMetadata && {
        fileId: taskMetadata.metadata?.fileId,
        fileName: context.fileMetadata.fileName,
        fileUrl: context.fileMetadata.fileUrl,
      }),
    };

    // Execute the agent
    const result = await agent.run({
      prompt,
      metadata: {
        action,
        payload,
        taskId: context.taskId,
        workflowId: context.workflowId,
        fileMetadata: context.fileMetadata,
      },
    });

    // Format results
    const results: Record<string, any> = {
      _agent: context.agentName,
      _taskId: context.taskId,
      _workflowId: context.workflowId,
      _completedAt: new Date().toISOString(),
      output: result.output,
      ...(result.notes && { notes: result.notes }),
      ...(result.delegations && { delegations: result.delegations }),
    };

    return {
      success: true,
      results,
    };
  } catch (error) {
    console.error(`[AgentProcessor] Error processing task with ${context.agentName}:`, error);
    return {
      success: false,
      results: {},
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Simulate task processing (for testing without API calls)
 */
export async function simulateTaskProcessing(context: TaskContext): Promise<ProcessingResult> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Agent name mapping for simulation
  const agentNames: Record<AgentName, string> = {
    cassidy: 'Cassidy',
    letitia: 'Letitia',
    giorgio: 'Giorgio',
    jamal: 'Jamal',
  };

  // Generate mock results based on agent type
  const mockResults: Record<string, any> = {
    _agent: context.agentName,
    _processedBy: agentNames[context.agentName] || 'Unknown',
    _completedAt: new Date().toISOString(),
    _simulated: true,
  };

  switch (context.agentName) {
    case 'cassidy':
      mockResults.clearanceStatus = 'clear';
      mockResults.licensingRecommendations = ['No samples detected', 'Ready for distribution'];
      mockResults.riskLevel = 'low';
      mockResults.estimatedCost = 0;
      break;
    case 'letitia':
      mockResults.suggestedTitle = context.fileMetadata?.fileName || 'Untitled';
      mockResults.tags = ['audio', 'music', 'production'];
      mockResults.metadata = { format: context.fileMetadata?.fileType };
      break;
    case 'giorgio':
      mockResults.scriptOutline = ['Introduction', 'Main Content', 'Conclusion'];
      mockResults.tone = 'professional';
      mockResults.targetAudience = 'music enthusiasts';
      break;
    case 'jamal':
      mockResults.platforms = ['Spotify', 'Apple Music', 'YouTube'];
      mockResults.releaseSchedule = { suggestedDate: '2 weeks from now' };
      mockResults.expectedReach = '1,000-5,000 listeners';
      break;
  }

  return {
    success: true,
    results: mockResults,
  };
}
