'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { projectsDb } from '@/lib/database';
import type { Project } from '@/types/database';
import {
  extractFinishData,
  mergeFinishData,
  initializeStepData,
  type FinishDraft,
  type FinishStepData,
  type ChecklistItem,
} from '@/lib/finishPlan';

interface FinishIntentViewProps {
  projectId: string;
  userId: string;
  step: string;
  onUpdate?: () => void;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function FinishIntentView({ projectId, userId, step, onUpdate }: FinishIntentViewProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [error, setError] = useState<string | null>(null);

  // Step-specific data
  const [stepData, setStepData] = useState<FinishStepData>({
    checklists: [],
    notes: '',
  });

  // Hydration guard - prevents save on initial load
  const hasHydratedRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load project data
  useEffect(() => {
    loadProject();
  }, [projectId]);

  // Initialize step data when step changes
  useEffect(() => {
    if (!project) return;

    const finishDraft = extractFinishData(project.project_bible);
    const existingStepData = finishDraft[step as keyof FinishDraft];
    const initialized = initializeStepData(step, existingStepData);

    setStepData(initialized);
    hasHydratedRef.current = true;
  }, [project, step]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const projectData = await projectsDb.getById(projectId);
      if (!projectData) {
        setError('Project not found');
        return;
      }
      setProject(projectData);
    } catch (err) {
      console.error('Failed to load project:', err);
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  // Debounced save function
  const debouncedSave = useCallback(
    (data: FinishStepData) => {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Don't save if we haven't hydrated yet (prevents load→save overwrite)
      if (!hasHydratedRef.current) {
        return;
      }

      setSaveState('saving');

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          if (!project) return;

          // Build the updated draft for this step
          const updatedDraft: FinishDraft = {
            [step]: {
              ...data,
              lastUpdated: new Date().toISOString(),
            },
          };

          // Merge safely into project_bible
          const updatedBible = mergeFinishData(project.project_bible, updatedDraft);

          // Persist to database
          await projectsDb.update(projectId, {
            project_bible: updatedBible,
          });

          setSaveState('saved');
          
          // Reset to idle after showing "Saved" for 2 seconds
          setTimeout(() => {
            setSaveState('idle');
          }, 2000);

          if (onUpdate) {
            onUpdate();
          }
        } catch (err) {
          console.error('Failed to save finish data:', err);
          setSaveState('error');
          setError(err instanceof Error ? err.message : 'Failed to save');
          
          // Reset error state after 3 seconds
          setTimeout(() => {
            setSaveState('idle');
            setError(null);
          }, 3000);
        }
      }, 800); // 800ms debounce
    },
    [project, projectId, step, onUpdate]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Handle checklist item toggle
  const handleToggleChecklistItem = (itemId: string) => {
    const updatedChecklists = stepData.checklists.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    const updatedData = {
      ...stepData,
      checklists: updatedChecklists,
    };

    setStepData(updatedData);
    debouncedSave(updatedData);
  };

  // Handle checklist item notes
  const handleUpdateChecklistNotes = (itemId: string, notes: string) => {
    const updatedChecklists = stepData.checklists.map((item) =>
      item.id === itemId ? { ...item, notes } : item
    );

    const updatedData = {
      ...stepData,
      checklists: updatedChecklists,
    };

    setStepData(updatedData);
    debouncedSave(updatedData);
  };

  // Handle notes update
  const handleNotesChange = (notes: string) => {
    const updatedData = {
      ...stepData,
      notes,
    };

    setStepData(updatedData);
    debouncedSave(updatedData);
  };

  // Add custom checklist item
  const handleAddChecklistItem = () => {
    const newItem: ChecklistItem = {
      id: `custom-${Date.now()}`,
      text: 'New checklist item',
      completed: false,
    };

    const updatedData = {
      ...stepData,
      checklists: [...stepData.checklists, newItem],
    };

    setStepData(updatedData);
    debouncedSave(updatedData);
  };

  // Update checklist item text
  const handleUpdateChecklistText = (itemId: string, text: string) => {
    const updatedChecklists = stepData.checklists.map((item) =>
      item.id === itemId ? { ...item, text } : item
    );

    const updatedData = {
      ...stepData,
      checklists: updatedChecklists,
    };

    setStepData(updatedData);
    debouncedSave(updatedData);
  };

  // Delete checklist item
  const handleDeleteChecklistItem = (itemId: string) => {
    const updatedChecklists = stepData.checklists.filter((item) => item.id !== itemId);

    const updatedData = {
      ...stepData,
      checklists: updatedChecklists,
    };

    setStepData(updatedData);
    debouncedSave(updatedData);
  };

  // Calculate progress
  const completedCount = stepData.checklists.filter((item) => item.completed).length;
  const totalCount = stepData.checklists.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-gray-600">Loading finish data...</div>
        </div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-red-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="bg-white rounded-lg shadow" data-testid={`finish-step-${step}`}>
        {/* Header */}
        <div className="border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 capitalize">
                {step.replace('-', ' ')}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Track progress for this finishing stage
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Progress indicator */}
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {completedCount}/{totalCount}
                </div>
                <div className="text-xs text-gray-500">completed</div>
              </div>

              {/* Save state indicator */}
              <div className="flex items-center gap-2 min-w-[100px]">
                {saveState === 'saving' && (
                  <div className="flex items-center gap-2 text-sm text-blue-600" data-testid="finish-saving-indicator">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </div>
                )}
                {saveState === 'saved' && (
                  <div className="flex items-center gap-2 text-sm text-green-600" data-testid="finish-saved-indicator">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Saved</span>
                  </div>
                )}
                {saveState === 'error' && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Error</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="px-8 py-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Checklist</h2>
            <button
              onClick={handleAddChecklistItem}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              + Add Item
            </button>
          </div>

          <div className="space-y-3">
            {stepData.checklists.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => handleToggleChecklistItem(item.id)}
                    className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => handleUpdateChecklistText(item.id, e.target.value)}
                      className={`w-full text-gray-900 border-none focus:ring-0 p-0 font-medium ${
                        item.completed ? 'line-through text-gray-500' : ''
                      }`}
                      placeholder="Checklist item text"
                    />
                    <textarea
                      value={item.notes || ''}
                      onChange={(e) => handleUpdateChecklistNotes(item.id, e.target.value)}
                      placeholder="Add notes (optional)"
                      rows={2}
                      className="w-full mt-2 text-sm text-gray-600 border border-gray-200 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => handleDeleteChecklistItem(item.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete item"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {stepData.checklists.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-2">No checklist items yet</p>
              <button
                onClick={handleAddChecklistItem}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Add your first item
              </button>
            </div>
          )}
        </div>

        {/* Notes section */}
        <div className="border-t border-gray-200 px-8 py-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Notes</h2>
          <textarea
            value={stepData.notes || ''}
            onChange={(e) => handleNotesChange(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add any additional notes for this stage..."
          />
        </div>

        {/* Non-blocking error display */}
        {error && saveState === 'error' && (
          <div className="border-t border-gray-200 px-8 py-4 bg-red-50">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
