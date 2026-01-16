'use client';

import { useState, useEffect } from 'react';
import { projectsDb } from '@/lib/database';
import type { Project } from '@/types/database';

interface StructureViewProps {
  project: Project;
  userId: string;
  onContinue: () => void;
  onUpdate?: () => void;
}

interface OutlineSection {
  id: string;
  title: string;
  keyPoints: string[];
  tasks: string[];
  expanded?: boolean;
}

export function StructureView({ project, userId, onContinue, onUpdate }: StructureViewProps) {
  const [outline, setOutline] = useState<OutlineSection[]>([]);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing outline from project metadata
  useEffect(() => {
    const savedOutline = project.metadata?.outline;
    if (savedOutline && Array.isArray(savedOutline)) {
      // Migrate old "beats" to "keyPoints" if needed
      const migratedOutline = savedOutline.map((section: any) => ({
        ...section,
        keyPoints: section.keyPoints || section.beats || [],
        expanded: section.expanded || false, // Collapsed by default
      }));
      setOutline(migratedOutline);
    } else {
      // Initialize with empty structure
      setOutline([]);
    }
  }, [project]);

  const handleAddSection = () => {
    const newSection: OutlineSection = {
      id: Date.now().toString(),
      title: `Section ${outline.length + 1}`,
      keyPoints: [''],
      tasks: [''],
      expanded: false, // Collapsed by default
    };
    setOutline([...outline, newSection]);
  };

  const handleRemoveSection = (sectionId: string) => {
    if (outline.length > 1) {
      setOutline(outline.filter((s) => s.id !== sectionId));
    }
  };

  const handleToggleExpand = (sectionId: string) => {
    setOutline(
      outline.map((s) =>
        s.id === sectionId ? { ...s, expanded: !s.expanded } : s
      )
    );
  };

  const handleUpdateSection = (sectionId: string, updates: Partial<OutlineSection>) => {
    setOutline(
      outline.map((s) => (s.id === sectionId ? { ...s, ...updates } : s))
    );
  };

  const handleAddKeyPoint = (sectionId: string) => {
    setOutline(
      outline.map((s) =>
        s.id === sectionId ? { ...s, keyPoints: [...s.keyPoints, ''] } : s
      )
    );
  };

  const handleRemoveKeyPoint = (sectionId: string, keyPointIndex: number) => {
    setOutline(
      outline.map((s) =>
        s.id === sectionId
          ? { ...s, keyPoints: s.keyPoints.filter((_, i) => i !== keyPointIndex) }
          : s
      )
    );
  };

  const handleUpdateKeyPoint = (sectionId: string, keyPointIndex: number, value: string) => {
    setOutline(
      outline.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              keyPoints: s.keyPoints.map((kp, i) => (i === keyPointIndex ? value : kp)),
            }
          : s
      )
    );
  };

  const handleAddTask = (sectionId: string) => {
    setOutline(
      outline.map((s) =>
        s.id === sectionId ? { ...s, tasks: [...s.tasks, ''] } : s
      )
    );
  };

  const handleRemoveTask = (sectionId: string, taskIndex: number) => {
    setOutline(
      outline.map((s) =>
        s.id === sectionId
          ? { ...s, tasks: s.tasks.filter((_, i) => i !== taskIndex) }
          : s
      )
    );
  };

  const handleUpdateTask = (sectionId: string, taskIndex: number, value: string) => {
    setOutline(
      outline.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              tasks: s.tasks.map((task, i) => (i === taskIndex ? value : task)),
            }
          : s
      )
    );
  };

  const handleGenerateOutline = async () => {
    try {
      setGenerating(true);
      setError(null);

      // Call API to generate outline based on project intent
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Generate a project outline with sections, key points, and tasks for: ${project.metadata?.intent || project.name}. Return a structured outline.`,
          projectId: project.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate outline');
      }

      // For now, create a sample outline structure
      // In a real implementation, this would parse the AI response
      const generatedOutline: OutlineSection[] = [
        {
          id: '1',
          title: 'Opening',
          keyPoints: ['Hook', 'Introduction', 'Setup'],
          tasks: ['Create opening visuals', 'Write intro script'],
          expanded: false,
        },
        {
          id: '2',
          title: 'Development',
          keyPoints: ['Main content', 'Key points', 'Supporting details'],
          tasks: ['Develop main content', 'Create supporting assets'],
          expanded: false,
        },
        {
          id: '3',
          title: 'Conclusion',
          keyPoints: ['Summary', 'Call to action', 'Closing'],
          tasks: ['Create closing visuals', 'Write conclusion script'],
          expanded: false,
        },
      ];

      setOutline(generatedOutline);
    } catch (err) {
      console.error('Failed to generate outline:', err);
      setError('Failed to generate outline. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleContinue = async () => {
    // Validate: must have at least one section
    if (outline.length === 0) {
      setError('Add at least one section to continue');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Save outline to project metadata
      await projectsDb.update(project.id, {
        metadata: {
          ...project.metadata,
          outline,
        },
      });

      // Continue to Step 3
      onContinue();
      onUpdate?.();
    } catch (err) {
      console.error('Failed to save structure:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const canContinue = outline.length > 0;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              Step 2
            </span>
            <h1 className="text-3xl font-bold text-gray-900">Structure</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Organize your project into sections/outline before generation.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Optional Generate Button */}
        <div className="mb-6">
          <button
            onClick={handleGenerateOutline}
            disabled={generating}
            className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate a starting outline'}
          </button>
        </div>

        {/* Editable Outline */}
        <div className="space-y-4 mb-8">
          {outline.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
              <p className="text-gray-600 mb-4">No sections yet. Add your first section to get started.</p>
            </div>
          ) : (
            outline.map((section) => (
              <div
                key={section.id}
                className="border border-gray-200 rounded-lg bg-gray-50"
              >
                {/* Section Header */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-200">
                  <button
                    onClick={() => handleToggleExpand(section.id)}
                    className="flex-shrink-0 text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label={section.expanded ? 'Collapse' : 'Expand'}
                  >
                    {section.expanded ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) =>
                      handleUpdateSection(section.id, { title: e.target.value })
                    }
                    placeholder="Section title"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium bg-white"
                  />
                  {outline.length > 1 && (
                    <button
                      onClick={() => handleRemoveSection(section.id)}
                      className="px-3 py-2 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Expanded Content */}
                {section.expanded && (
                  <div className="p-4 space-y-4 bg-white">
                    {/* Key Points */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Key Points
                      </label>
                      <div className="space-y-2">
                        {section.keyPoints.map((keyPoint, keyPointIndex) => (
                          <div key={keyPointIndex} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={keyPoint}
                              onChange={(e) =>
                                handleUpdateKeyPoint(section.id, keyPointIndex, e.target.value)
                              }
                              placeholder="Key point description"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                            {section.keyPoints.length > 1 && (
                              <button
                                onClick={() => handleRemoveKeyPoint(section.id, keyPointIndex)}
                                className="text-red-600 hover:text-red-700 text-sm px-2"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => handleAddKeyPoint(section.id)}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          + Add Key Point
                        </button>
                      </div>
                    </div>

                    {/* Tasks */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tasks
                      </label>
                      <div className="space-y-2">
                        {section.tasks.map((task, taskIndex) => (
                          <div key={taskIndex} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={task}
                              onChange={(e) =>
                                handleUpdateTask(section.id, taskIndex, e.target.value)
                              }
                              placeholder="Task description"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                            {section.tasks.length > 1 && (
                              <button
                                onClick={() => handleRemoveTask(section.id, taskIndex)}
                                className="text-red-600 hover:text-red-700 text-sm px-2"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => handleAddTask(section.id)}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          + Add Task
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          <button
            onClick={handleAddSection}
            className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            + Add Section
          </button>
        </div>

        {/* CTA */}
        <div className="pt-6 border-t border-gray-200">
          <button
            onClick={handleContinue}
            disabled={saving || !canContinue}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            title={!canContinue ? 'Add at least one section to continue' : undefined}
          >
            {saving ? 'Saving...' : 'Continue to Step 3'}
          </button>
          {!canContinue && (
            <p className="mt-2 text-xs text-gray-500 text-center">
              Add at least one section to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
