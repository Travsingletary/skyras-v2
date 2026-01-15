/**
 * finishPlan.ts
 * 
 * Helper functions for managing Finish intent data in project_bible.finish
 * Provides safe merge, default seeding, and type definitions
 */

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  notes?: string;
}

export interface FinishStepData {
  checklists: ChecklistItem[];
  notes?: string;
  lastUpdated?: string;
}

export interface FinishDraft {
  takes?: FinishStepData;
  assembly?: FinishStepData;
  'look-and-feel'?: FinishStepData;
  'final-cut'?: FinishStepData;
}

export interface FinishBibleSection {
  currentDraft: FinishDraft;
  [key: string]: any; // Preserve unknown keys
}

/**
 * Get default checklists for each finish step
 */
export function getDefaultChecklists(step: string): ChecklistItem[] {
  const defaults: Record<string, ChecklistItem[]> = {
    takes: [
      { id: 'take-1', text: 'Review all raw footage', completed: false },
      { id: 'take-2', text: 'Select best takes for each scene', completed: false },
      { id: 'take-3', text: 'Organize takes by scene/sequence', completed: false },
      { id: 'take-4', text: 'Flag any technical issues', completed: false },
    ],
    assembly: [
      { id: 'assembly-1', text: 'Create rough cut timeline', completed: false },
      { id: 'assembly-2', text: 'Assemble selected takes in sequence', completed: false },
      { id: 'assembly-3', text: 'Add placeholder transitions', completed: false },
      { id: 'assembly-4', text: 'Review pacing and flow', completed: false },
    ],
    'look-and-feel': [
      { id: 'look-1', text: 'Apply color grading', completed: false },
      { id: 'look-2', text: 'Add visual effects', completed: false },
      { id: 'look-3', text: 'Refine transitions', completed: false },
      { id: 'look-4', text: 'Add motion graphics/titles', completed: false },
    ],
    'final-cut': [
      { id: 'final-1', text: 'Final audio mix', completed: false },
      { id: 'final-2', text: 'Final color correction', completed: false },
      { id: 'final-3', text: 'Export master file', completed: false },
      { id: 'final-4', text: 'Quality check on target devices', completed: false },
    ],
  };

  return defaults[step] || [];
}

/**
 * Safely merge finish data into project_bible, preserving unknown keys
 */
export function mergeFinishData(
  existingBible: Record<string, any> | undefined,
  finishDraft: FinishDraft
): Record<string, any> {
  const bible = existingBible || {};
  const existingFinish = (bible.finish as FinishBibleSection) || { currentDraft: {} };

  return {
    ...bible,
    finish: {
      ...existingFinish,
      currentDraft: {
        ...existingFinish.currentDraft,
        ...finishDraft,
      },
    },
  };
}

/**
 * Extract finish data from project_bible
 */
export function extractFinishData(
  projectBible: Record<string, any> | undefined
): FinishDraft {
  if (!projectBible?.finish?.currentDraft) {
    return {};
  }
  return projectBible.finish.currentDraft as FinishDraft;
}

/**
 * Initialize step data with defaults if empty
 */
export function initializeStepData(
  step: string,
  existingData?: FinishStepData
): FinishStepData {
  if (existingData && existingData.checklists && existingData.checklists.length > 0) {
    return existingData;
  }

  return {
    checklists: getDefaultChecklists(step),
    notes: existingData?.notes || '',
    lastUpdated: new Date().toISOString(),
  };
}
