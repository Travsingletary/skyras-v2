/**
 * Story-to-Timeline Workflow Template
 * 
 * Orchestrates the complete automated workflow:
 * Story → Storyboard → Approval → Shot List → Clips → Timeline
 */

import type { AgentDelegation } from '@/agents/core/BaseAgent';

export interface StoryToTimelineWorkflowConfig {
  project: string;
  userId: string;
  context?: string;
  mood?: string;
  style?: string;
  characters?: string[];
  referenceImages?: string[];
  frameCount?: number;
  klingModel?: '2.5-turbo' | '1.0' | '2.6';
  aspectRatio?: string;
  provider?: 'kling' | 'runway';
}

/**
 * Generate workflow delegations for the complete story-to-timeline pipeline
 * 
 * Note: This workflow includes agent tasks. Manual gates (storyboard approval)
 * and batch operations (clip generation, timeline sequencing) are handled
 * separately through API endpoints or workflow steps.
 */
export function createStoryToTimelineWorkflow(
  config: StoryToTimelineWorkflowConfig
): AgentDelegation[] {
  const delegations: AgentDelegation[] = [];

  // Phase 1: Storyboard Generation (Automatic)
  // Step 1: Generate storyboard using NanoBanana Pro
  delegations.push({
    agent: 'giorgio',
    task: `Generate storyboard with ${config.frameCount || 9} frames for ${config.project}`,
    status: 'pending',
    metadata: {
      action: 'generateNanoBananaStoryboard',
      project: config.project,
      context: config.context || config.project,
      frameCount: config.frameCount || 9,
      resolution: '4k',
      style: config.style,
      referenceImages: config.referenceImages,
      // Note: Storyboard approval is a manual gate (handled via UI)
    },
  });

  // Phase 2: Storyboard Approval Gate (Manual)
  // Note: This is handled via UI/workflow gates, not an agent task
  // The workflow execution system will check if all storyboard frames are approved
  // before proceeding to shot list generation

  // Phase 3: Shot List Generation (Automatic after approval)
  // Step 2: Generate detailed shot list from approved storyboard
  delegations.push({
    agent: 'giorgio',
    task: `Generate detailed shot list from approved storyboard for ${config.project}`,
    status: 'pending',
    metadata: {
      action: 'generateShotListFromStoryboard',
      project: config.project,
      userId: config.userId,
      context: config.context || config.project,
      style: config.style,
      mood: config.mood,
      // Note: This depends on storyboard approval gate
      // The workflow system will check approval status before executing
    },
  });

  // Phase 4: Clip Generation (Automatic - parallel)
  // Note: This is handled as a batch operation via API endpoint
  // Not an agent task - clips are generated in parallel from shot list
  // The workflow system can trigger this via API call after shot list generation

  // Phase 5: Timeline Sequencing (Automatic after clips complete)
  // Note: This is handled as a batch operation via API/utility function
  // Not an agent task - timeline sequencing orders clips by shot list order
  // The workflow system can trigger this via API call after all clips are generated

  return delegations;
}

/**
 * Workflow execution notes:
 * 
 * After storyboard generation:
 * - Wait for manual approval of all storyboard frames
 * - Check approval status via storyboardFramesDb.areAllApproved(projectId)
 * 
 * After shot list generation:
 * - Trigger clip generation via API endpoint or utility function
 * - Use generateClipsFromShotList() from @/lib/video/clipGenerator
 * 
 * After clip generation:
 * - Wait for all clips to reach 'completed' status
 * - Trigger timeline sequencing via API endpoint or utility function
 * - Use sequenceClipsOnTimeline() from @/lib/timeline/sequencer
 */
