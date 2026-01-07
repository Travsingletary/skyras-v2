/**
 * NanoBanana Pro + Kling AI End-to-End Workflow Template
 * 
 * Orchestrates the complete video production pipeline:
 * Story → Lyrics → Music → Character Sheet → Storyboard → Upscale → Video
 */

import type { AgentDelegation } from '@/agents/core/BaseAgent';

export interface NanoBananaKlingWorkflowConfig {
  project: string;
  story: string;
  mood?: string;
  style?: string;
  characters?: string[];
  referenceImages?: string[];
  frameCount?: number;
  klingModel?: '2.5-turbo' | '1.0' | '2.6';
  duration?: number;
  aspectRatio?: string;
}

/**
 * Generate workflow delegations for the complete NanoBanana + Kling pipeline
 */
export function createNanoBananaKlingWorkflow(
  config: NanoBananaKlingWorkflowConfig
): AgentDelegation[] {
  const delegations: AgentDelegation[] = [];

  // Phase 1: Story & Music Foundation
  // Step 1: Generate lyrics from story
  delegations.push({
    agent: 'giorgio',
    task: `Generate lyrics from story: ${config.story.substring(0, 100)}...`,
    status: 'pending',
    metadata: {
      action: 'generateLyricsFromStory',
      project: config.project,
      story: config.story,
      mood: config.mood,
    },
  });

  // Step 2: Generate music from lyrics (depends on lyrics)
  delegations.push({
    agent: 'giorgio',
    task: 'Generate music from lyrics using Suno',
    status: 'pending',
    metadata: {
      action: 'generateMusicFromLyrics',
      project: config.project,
      style: config.style || 'pop',
      mood: config.mood,
      dependsOn: 'lyrics', // Will be resolved to previous task
    },
  });

  // Phase 2: Character & Prop Lock-In
  // Step 3: Generate character sheet
  delegations.push({
    agent: 'giorgio',
    task: `Generate character pose sheet for ${config.project}`,
    status: 'pending',
    metadata: {
      action: 'generateNanoBananaCharacterSheet',
      project: config.project,
      context: config.story,
      style: config.style,
      referenceImages: config.referenceImages,
    },
  });

  // Phase 3: Storyboard Generation
  // Step 4: Generate storyboard (depends on character sheet)
  delegations.push({
    agent: 'giorgio',
    task: `Generate storyboard with ${config.frameCount || 9} frames for ${config.project}`,
    status: 'pending',
    metadata: {
      action: 'generateNanoBananaStoryboard',
      project: config.project,
      context: config.story,
      frameCount: config.frameCount || 9,
      resolution: '4k',
      style: config.style,
      dependsOn: 'characterSheet', // Will be resolved to previous task
    },
  });

  // Phase 4: Frame Selection & Upscaling
  // Step 5: Upscale selected frames (can happen in parallel after storyboard)
  // Note: This is a placeholder - actual frame selection would be manual or AI-driven
  delegations.push({
    agent: 'giorgio',
    task: 'Upscale selected storyboard frames to 4K',
    status: 'pending',
    metadata: {
      action: 'upscaleNanoBananaFrame',
      project: config.project,
      targetResolution: '4k',
      dependsOn: 'storyboard', // Will be resolved to previous task
    },
  });

  // Phase 5: Video Generation
  // Step 6: Generate videos from upscaled frames using Kling
  delegations.push({
    agent: 'giorgio',
    task: `Generate video using Kling ${config.klingModel || '2.5-turbo'} from upscaled frames`,
    status: 'pending',
    metadata: {
      action: 'generateKlingVideo',
      project: config.project,
      klingModel: config.klingModel || '2.5-turbo',
      duration: config.duration || 5,
      aspectRatio: config.aspectRatio || '16:9',
      dependsOn: 'upscale', // Will be resolved to previous task
    },
  });

  return delegations;
}

/**
 * Create a simplified workflow for testing individual phases
 */
export function createPhaseWorkflow(
  phase: 'music' | 'character' | 'storyboard' | 'video',
  config: NanoBananaKlingWorkflowConfig
): AgentDelegation[] {
  switch (phase) {
    case 'music':
      return [
        {
          agent: 'giorgio',
          task: `Generate lyrics from story: ${config.story.substring(0, 100)}...`,
          status: 'pending',
          metadata: {
            action: 'generateLyricsFromStory',
            project: config.project,
            story: config.story,
            mood: config.mood,
          },
        },
        {
          agent: 'giorgio',
          task: 'Generate music from lyrics using Suno',
          status: 'pending',
          metadata: {
            action: 'generateMusicFromLyrics',
            project: config.project,
            style: config.style || 'pop',
            mood: config.mood,
          },
        },
      ];

    case 'character':
      return [
        {
          agent: 'giorgio',
          task: `Generate character pose sheet for ${config.project}`,
          status: 'pending',
          metadata: {
            action: 'generateNanoBananaCharacterSheet',
            project: config.project,
            context: config.story,
            style: config.style,
            referenceImages: config.referenceImages,
          },
        },
      ];

    case 'storyboard':
      return [
        {
          agent: 'giorgio',
          task: `Generate storyboard with ${config.frameCount || 9} frames for ${config.project}`,
          status: 'pending',
          metadata: {
            action: 'generateNanoBananaStoryboard',
            project: config.project,
            context: config.story,
            frameCount: config.frameCount || 9,
            resolution: '4k',
            style: config.style,
          },
        },
      ];

    case 'video':
      return [
        {
          agent: 'giorgio',
          task: `Generate video using Kling ${config.klingModel || '2.5-turbo'}`,
          status: 'pending',
          metadata: {
            action: 'generateKlingVideo',
            project: config.project,
            klingModel: config.klingModel || '2.5-turbo',
            duration: config.duration || 5,
            aspectRatio: config.aspectRatio || '16:9',
          },
        },
      ];

    default:
      return [];
  }
}
