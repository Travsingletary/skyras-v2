'use client';

import { useState, useEffect } from 'react';
import { projectsDb } from '@/lib/database';
import type { Project } from '@/types/database';

interface BriefVersion {
  id: string;
  version: number;
  content: Record<string, any>;
  created_at: string;
  created_by: string;
  notes?: string;
}

interface PlanIntentViewProps {
  projectId: string;
  userId: string;
  step?: string;
  onUpdate?: () => void;
}

export function PlanIntentView({ projectId, userId, step = 'brief', onUpdate }: PlanIntentViewProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Brief content state
  const [briefContent, setBriefContent] = useState<Record<string, any>>({
    goals: '',
    target_audience: '',
    key_messages: '',
    tone: '',
    visual_style: '',
    constraints: '',
    success_metrics: '',
  });

  // Version history
  const [versions, setVersions] = useState<BriefVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [versionNotes, setVersionNotes] = useState('');
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const projectData = await projectsDb.getById(projectId);
      if (!projectData) {
        setError('Project not found');
        return;
      }

      setProject(projectData);

      // Load brief from project_bible
      if (projectData.project_bible) {
        const bible = projectData.project_bible as any;
        
        // Load brief content
        if (bible.brief) {
          setBriefContent(bible.brief);
        }

        // Load version history
        if (bible.versions && Array.isArray(bible.versions)) {
          setVersions(bible.versions);
          if (bible.versions.length > 0) {
            const latest = bible.versions[bible.versions.length - 1];
            setCurrentVersion(latest.version);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load project:', err);
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (createVersion = false) => {
    if (!project) return;

    try {
      setSaving(true);
      setError(null);

      const bible = (project.project_bible as any) || {};
      const existingVersions = bible.versions || [];

      // Create new version if requested
      let newVersion = currentVersion;
      if (createVersion) {
        newVersion = existingVersions.length > 0 
          ? existingVersions[existingVersions.length - 1].version + 1 
          : 1;

        const versionEntry: BriefVersion = {
          id: `v${newVersion}-${Date.now()}`,
          version: newVersion,
          content: { ...briefContent },
          created_at: new Date().toISOString(),
          created_by: userId,
          notes: versionNotes || undefined,
        };

        existingVersions.push(versionEntry);
        setVersions([...existingVersions]);
        setCurrentVersion(newVersion);
        setVersionNotes('');
      }

      // Update project_bible
      const updatedBible = {
        ...bible,
        brief: briefContent,
        versions: existingVersions,
        current_version: newVersion,
        updated_at: new Date().toISOString(),
      };

      await projectsDb.update(projectId, {
        project_bible: updatedBible,
      });

      // Reload project to get fresh data
      await loadProject();
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Failed to save brief:', err);
      setError(err instanceof Error ? err.message : 'Failed to save brief');
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreVersion = async (version: BriefVersion) => {
    if (!confirm(`Restore version ${version.version}? This will create a new version with the restored content.`)) {
      return;
    }

    setBriefContent({ ...version.content });
    setVersionNotes(`Restored from version ${version.version}`);
    await handleSave(true);
  };

  const handleFieldChange = (field: string, value: string) => {
    setBriefContent((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-gray-600">Loading brief...</div>
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
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Project Brief</h1>
              <p className="text-sm text-gray-600 mt-1">
                Define your project goals, audience, and creative direction
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowVersionHistory(!showVersionHistory)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {showVersionHistory ? 'Hide' : 'Show'} History ({versions.length})
              </button>
              <button
                data-testid="plan-save-draft"
                onClick={() => handleSave(false)}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                data-testid="plan-save-version"
                onClick={() => handleSave(true)}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save as Version'}
              </button>
            </div>
          </div>
        </div>

        {/* Version History Sidebar */}
        {showVersionHistory && (
          <div className="border-b border-gray-200 bg-gray-50 px-8 py-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Version History</h2>
              <button
                onClick={() => setShowVersionHistory(false)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Close
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {versions.length === 0 ? (
                <p className="text-sm text-gray-500">No versions saved yet</p>
              ) : (
                versions
                  .slice()
                  .reverse()
                  .map((version) => (
                    <div
                      key={version.id}
                      className={`p-3 rounded-lg border ${
                        version.version === currentVersion
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              Version {version.version}
                            </span>
                            {version.version === currentVersion && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {new Date(version.created_at).toLocaleString()}
                          </p>
                          {version.notes && (
                            <p className="text-sm text-gray-700 mt-1">{version.notes}</p>
                          )}
                        </div>
                        <button
                          data-testid="plan-restore-version"
                          onClick={() => handleRestoreVersion(version)}
                          className="ml-4 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                        >
                          Restore
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* Version Notes Input */}
        {showVersionHistory && (
          <div className="border-b border-gray-200 px-8 py-4 bg-gray-50">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Version Notes (optional)
            </label>
            <input
              type="text"
              value={versionNotes}
              onChange={(e) => setVersionNotes(e.target.value)}
              placeholder="What changed in this version?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}

        {/* Brief Editor */}
        <div className="px-8 py-6 space-y-6" data-testid="plan-brief-form">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Goals
            </label>
            <textarea
              value={briefContent.goals || ''}
              onChange={(e) => handleFieldChange('goals', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="What are the main objectives for this project?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Audience
            </label>
            <textarea
              value={briefContent.target_audience || ''}
              onChange={(e) => handleFieldChange('target_audience', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Who is this project for?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Key Messages
            </label>
            <textarea
              value={briefContent.key_messages || ''}
              onChange={(e) => handleFieldChange('key_messages', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="What are the main messages to communicate?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tone & Voice
            </label>
            <textarea
              value={briefContent.tone || ''}
              onChange={(e) => handleFieldChange('tone', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="What tone should the content convey?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visual Style
            </label>
            <textarea
              value={briefContent.visual_style || ''}
              onChange={(e) => handleFieldChange('visual_style', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe the desired visual aesthetic"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Constraints & Requirements
            </label>
            <textarea
              value={briefContent.constraints || ''}
              onChange={(e) => handleFieldChange('constraints', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Any limitations, requirements, or guidelines?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Success Metrics
            </label>
            <textarea
              value={briefContent.success_metrics || ''}
              onChange={(e) => handleFieldChange('success_metrics', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="How will you measure success?"
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="px-8 py-4 border-t border-gray-200 bg-red-50">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
