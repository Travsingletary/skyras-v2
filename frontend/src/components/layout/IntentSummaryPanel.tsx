'use client';

import type { Project, Intent } from '@/types/database';

interface IntentSummaryPanelProps {
  project: Project | null;
  currentIntent: Intent;
}

export function IntentSummaryPanel({ project, currentIntent }: IntentSummaryPanelProps) {
  if (!project) {
    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Intent Summary</h3>
        <div className="text-sm text-gray-500">No project data available</div>
      </div>
    );
  }

  const intentDescriptions: Record<Intent, string> = {
    create: 'Create and refine creative assets for your project',
    plan: 'Plan and organize your project strategy',
    release: 'Prepare and distribute your content',
    finish: 'Finalize and complete your project deliverables',
  };

  const getIntentProgress = (): { label: string; value: number } | null => {
    // Derived from project_bible if available
    if (!project.project_bible) return null;

    try {
      const bible = typeof project.project_bible === 'string' 
        ? JSON.parse(project.project_bible) 
        : project.project_bible;

      if (currentIntent === 'create') {
        // Check for references, style card, storyboard
        const hasReferences = bible.references?.length > 0;
        const hasStyleCard = bible.style_card?.current;
        const hasStoryboard = bible.storyboard?.frames?.length > 0;
        const steps = [hasReferences, hasStyleCard, hasStoryboard].filter(Boolean).length;
        return { label: `${steps}/3 steps complete`, value: (steps / 3) * 100 };
      }

      if (currentIntent === 'plan') {
        const hasBrief = bible.project_brief?.current;
        const hasPlan = bible.release_plan?.current;
        const steps = [hasBrief, hasPlan].filter(Boolean).length;
        return { label: `${steps}/2 steps complete`, value: (steps / 2) * 100 };
      }

      if (currentIntent === 'release') {
        const hasAssets = bible.release_plan?.currentDraft?.assets?.length > 0;
        const hasChannels = bible.release_plan?.currentDraft?.channels?.length > 0;
        const hasCampaignPack = bible.release_plan?.campaignPack?.currentDraft;
        const steps = [hasAssets, hasChannels, hasCampaignPack].filter(Boolean).length;
        return { label: `${steps}/3 steps complete`, value: (steps / 3) * 100 };
      }

      if (currentIntent === 'finish') {
        const hasTakes = bible.finish_plan?.takes?.length > 0;
        return hasTakes ? { label: '1/1 steps complete', value: 100 } : { label: '0/1 steps complete', value: 0 };
      }
    } catch (error) {
      console.warn('Failed to parse project_bible for intent summary:', error);
    }

    return null;
  };

  const progress = getIntentProgress();

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Intent Summary</h3>
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-700 capitalize">{currentIntent}</span>
            {progress && (
              <span className="text-xs text-gray-600">{progress.label}</span>
            )}
          </div>
          {progress && (
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress.value}%` }}
              />
            </div>
          )}
        </div>
        <p className="text-xs text-gray-600 mt-2">{intentDescriptions[currentIntent]}</p>
      </div>

      <div className="mt-3 space-y-1 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Project:</span>
          <span className="font-medium truncate ml-2">{project.name}</span>
        </div>
        {project.type && (
          <div className="flex justify-between">
            <span>Type:</span>
            <span className="font-medium capitalize">{project.type.replace('_', ' ')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
