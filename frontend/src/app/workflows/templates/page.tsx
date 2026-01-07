'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Play, Edit2, Copy, Trash2, Save, X } from 'lucide-react';

type Agent = 'giorgio' | 'jamal' | 'letitia' | 'cassidy' | 'marcus';
type WorkflowType = 'licensing' | 'creative' | 'distribution' | 'cataloging' | 'custom' | 'nanobanana-kling';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  agent: Agent;
  action: string;
  dependsOn?: string;
  metadata?: Record<string, any>;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  type: WorkflowType;
  description: string;
  steps: WorkflowStep[];
  isBuiltIn: boolean;
}

const BUILT_IN_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'nanobanana-kling-full',
    name: 'NanoBanana + Kling Full Pipeline',
    type: 'nanobanana-kling',
    description: 'Complete video production: Story → Lyrics → Music → Character Sheet → Storyboard → Upscale → Video',
    isBuiltIn: true,
    steps: [
      {
        id: 'lyrics',
        title: 'Generate Lyrics from Story',
        description: 'Transform story into song lyrics',
        agent: 'giorgio',
        action: 'generateLyricsFromStory',
      },
      {
        id: 'music',
        title: 'Generate Music from Lyrics',
        description: 'Create music track using Suno',
        agent: 'giorgio',
        action: 'generateMusicFromLyrics',
        dependsOn: 'lyrics',
      },
      {
        id: 'character',
        title: 'Generate Character Sheet',
        description: 'Create character pose sheet with NanoBanana',
        agent: 'giorgio',
        action: 'generateNanoBananaCharacterSheet',
      },
      {
        id: 'storyboard',
        title: 'Generate Storyboard',
        description: 'Create 9-12 frame storyboard',
        agent: 'giorgio',
        action: 'generateNanoBananaStoryboard',
        dependsOn: 'character',
      },
      {
        id: 'upscale',
        title: 'Upscale Frames',
        description: 'Upscale selected frames to 4K',
        agent: 'giorgio',
        action: 'upscaleNanoBananaFrame',
        dependsOn: 'storyboard',
      },
      {
        id: 'video',
        title: 'Generate Video with Kling',
        description: 'Generate final video from upscaled frames',
        agent: 'giorgio',
        action: 'generateKlingVideo',
        dependsOn: 'upscale',
      },
    ],
  },
  {
    id: 'simple-image-gen',
    name: 'Simple Image Generation',
    type: 'creative',
    description: 'Generate an image from a text prompt',
    isBuiltIn: true,
    steps: [
      {
        id: 'generate',
        title: 'Generate Image',
        description: 'Create image using AI',
        agent: 'giorgio',
        action: 'generateImage',
      },
    ],
  },
  {
    id: 'social-post',
    name: 'Social Media Post Creation',
    type: 'distribution',
    description: 'Create and schedule social media posts',
    isBuiltIn: true,
    steps: [
      {
        id: 'draft',
        title: 'Draft Post Content',
        description: 'Create engaging post copy',
        agent: 'jamal',
        action: 'draftPost',
      },
      {
        id: 'generate-visual',
        title: 'Generate Visual',
        description: 'Create accompanying image/video',
        agent: 'giorgio',
        action: 'generateImage',
        dependsOn: 'draft',
      },
      {
        id: 'schedule',
        title: 'Schedule Post',
        description: 'Schedule for optimal time',
        agent: 'jamal',
        action: 'schedulePost',
        dependsOn: 'generate-visual',
      },
    ],
  },
];

export default function WorkflowTemplatesPage() {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>(BUILT_IN_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkflowTemplate | null>(null);

  const handleCreateNew = () => {
    const newTemplate: WorkflowTemplate = {
      id: `custom-${Date.now()}`,
      name: 'New Workflow',
      type: 'custom',
      description: 'Custom workflow template',
      isBuiltIn: false,
      steps: [],
    };
    setEditingTemplate(newTemplate);
    setIsEditing(true);
  };

  const handleEdit = (template: WorkflowTemplate) => {
    if (template.isBuiltIn) {
      // Clone built-in template for editing
      const clonedTemplate: WorkflowTemplate = {
        ...template,
        id: `custom-${Date.now()}`,
        name: `${template.name} (Copy)`,
        isBuiltIn: false,
      };
      setEditingTemplate(clonedTemplate);
    } else {
      setEditingTemplate({ ...template });
    }
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!editingTemplate) return;

    const existingIndex = templates.findIndex((t) => t.id === editingTemplate.id);
    if (existingIndex >= 0) {
      // Update existing
      const updated = [...templates];
      updated[existingIndex] = editingTemplate;
      setTemplates(updated);
    } else {
      // Add new
      setTemplates([...templates, editingTemplate]);
    }

    setIsEditing(false);
    setEditingTemplate(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      setTemplates(templates.filter((t) => t.id !== id));
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(null);
      }
    }
  };

  const handleAddStep = () => {
    if (!editingTemplate) return;

    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      title: 'New Step',
      description: '',
      agent: 'giorgio',
      action: 'custom',
    };

    setEditingTemplate({
      ...editingTemplate,
      steps: [...editingTemplate.steps, newStep],
    });
  };

  const handleUpdateStep = (stepId: string, updates: Partial<WorkflowStep>) => {
    if (!editingTemplate) return;

    setEditingTemplate({
      ...editingTemplate,
      steps: editingTemplate.steps.map((step) =>
        step.id === stepId ? { ...step, ...updates } : step
      ),
    });
  };

  const handleRemoveStep = (stepId: string) => {
    if (!editingTemplate) return;

    setEditingTemplate({
      ...editingTemplate,
      steps: editingTemplate.steps.filter((step) => step.id !== stepId),
    });
  };

  const renderTemplateList = () => (
    <div className="space-y-3">
      {templates.map((template) => (
        <div
          key={template.id}
          className={`rounded-lg border-2 p-4 cursor-pointer transition-colors ${
            selectedTemplate?.id === template.id
              ? 'border-blue-600 bg-blue-50'
              : 'border-zinc-200 bg-white hover:border-zinc-300'
          }`}
          onClick={() => setSelectedTemplate(template)}
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-zinc-900">{template.name}</h3>
              <p className="text-xs text-zinc-500 mt-1">
                {template.steps.length} steps • {template.type}
                {template.isBuiltIn && ' • Built-in'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(template);
                }}
                className="p-1.5 rounded hover:bg-zinc-100"
              >
                {template.isBuiltIn ? (
                  <Copy className="h-4 w-4 text-zinc-600" />
                ) : (
                  <Edit2 className="h-4 w-4 text-zinc-600" />
                )}
              </button>
              {!template.isBuiltIn && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(template.id);
                  }}
                  className="p-1.5 rounded hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </button>
              )}
            </div>
          </div>
          <p className="text-sm text-zinc-600">{template.description}</p>
        </div>
      ))}
    </div>
  );

  const renderTemplateDetail = () => {
    if (!selectedTemplate) {
      return (
        <div className="flex items-center justify-center h-64 text-zinc-500">
          Select a template to view details
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 mb-2">
            {selectedTemplate.name}
          </h2>
          <p className="text-zinc-600">{selectedTemplate.description}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-700 mb-3">Workflow Steps</h3>
          <div className="space-y-3">
            {selectedTemplate.steps.map((step, index) => (
              <div
                key={step.id}
                className="rounded-lg border border-zinc-200 bg-white p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-zinc-900">{step.title}</h4>
                    <p className="text-sm text-zinc-600 mt-1">{step.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                        {step.agent}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        {step.action}
                      </span>
                      {step.dependsOn && (
                        <span className="text-xs text-zinc-500">
                          Depends on: {step.dependsOn}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Play className="h-4 w-4" />
          Execute Workflow
        </button>
      </div>
    );
  };

  const renderEditor = () => {
    if (!editingTemplate) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-bold text-zinc-900">
              {editingTemplate.isBuiltIn ? 'Clone' : 'Edit'} Workflow Template
            </h2>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditingTemplate(null);
              }}
              className="p-1 rounded hover:bg-zinc-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Template Name
              </label>
              <input
                type="text"
                value={editingTemplate.name}
                onChange={(e) =>
                  setEditingTemplate({ ...editingTemplate, name: e.target.value })
                }
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Description
              </label>
              <textarea
                value={editingTemplate.description}
                onChange={(e) =>
                  setEditingTemplate({ ...editingTemplate, description: e.target.value })
                }
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                Workflow Type
              </label>
              <select
                value={editingTemplate.type}
                onChange={(e) =>
                  setEditingTemplate({
                    ...editingTemplate,
                    type: e.target.value as WorkflowType,
                  })
                }
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              >
                <option value="creative">Creative</option>
                <option value="distribution">Distribution</option>
                <option value="licensing">Licensing</option>
                <option value="cataloging">Cataloging</option>
                <option value="nanobanana-kling">NanoBanana + Kling</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-zinc-700">Steps</label>
                <button
                  onClick={handleAddStep}
                  className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Step
                </button>
              </div>

              <div className="space-y-3">
                {editingTemplate.steps.map((step, index) => (
                  <div
                    key={step.id}
                    className="rounded-lg border border-zinc-200 p-4 bg-zinc-50"
                  >
                    <div className="flex items-start gap-2 mb-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-600 text-white flex items-center justify-center text-xs font-semibold">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) =>
                          handleUpdateStep(step.id, { title: e.target.value })
                        }
                        placeholder="Step title"
                        className="flex-1 rounded border border-zinc-300 px-2 py-1 text-sm"
                      />
                      <button
                        onClick={() => handleRemoveStep(step.id)}
                        className="p-1 rounded hover:bg-red-100"
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <div>
                        <label className="block text-xs text-zinc-600 mb-1">Agent</label>
                        <select
                          value={step.agent}
                          onChange={(e) =>
                            handleUpdateStep(step.id, {
                              agent: e.target.value as Agent,
                            })
                          }
                          className="w-full rounded border border-zinc-300 px-2 py-1 text-sm"
                        >
                          <option value="giorgio">Giorgio</option>
                          <option value="jamal">Jamal</option>
                          <option value="letitia">Letitia</option>
                          <option value="cassidy">Cassidy</option>
                          <option value="marcus">Marcus</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-zinc-600 mb-1">
                          Depends On (Step ID)
                        </label>
                        <input
                          type="text"
                          value={step.dependsOn || ''}
                          onChange={(e) =>
                            handleUpdateStep(step.id, { dependsOn: e.target.value || undefined })
                          }
                          placeholder="Optional"
                          className="w-full rounded border border-zinc-300 px-2 py-1 text-sm"
                        />
                      </div>
                    </div>

                    <textarea
                      value={step.description}
                      onChange={(e) =>
                        handleUpdateStep(step.id, { description: e.target.value })
                      }
                      placeholder="Step description"
                      className="w-full rounded border border-zinc-300 px-2 py-1 text-sm"
                      rows={2}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 p-6 border-t">
            <button
              onClick={() => {
                setIsEditing(false);
                setEditingTemplate(null);
              }}
              className="px-4 py-2 rounded border border-zinc-300 text-sm font-medium hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              Save Template
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/studio"
            className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Studio
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 mb-2">
                Workflow Templates
              </h1>
              <p className="text-zinc-600">
                Create reusable workflows for common tasks
              </p>
            </div>
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
            >
              <Plus className="h-5 w-5" />
              New Template
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">Templates</h2>
            {renderTemplateList()}
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-lg border border-zinc-200 bg-white p-6">
              {renderTemplateDetail()}
            </div>
          </div>
        </div>
      </div>

      {isEditing && renderEditor()}
    </div>
  );
}
