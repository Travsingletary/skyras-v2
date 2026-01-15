'use client';

import { useState, useEffect } from 'react';
import { projectsDb } from '@/lib/database';
import {
  generateCampaignPackDraft,
  mergeCampaignPackIntoReleasePlan,
  getActiveBrief,
  getReleasePlanDraft,
  type CampaignPackDraft,
  type PlatformCaption,
  type ChecklistItem,
} from '@/lib/campaignPack';
import type { Project } from '@/types/database';

interface ReleaseIntentViewProps {
  projectId: string;
  userId: string;
  step: string;
  onUpdate?: () => void;
}

interface Asset {
  id: string;
  type: 'video' | 'image' | 'audio' | 'document';
  name: string;
  url?: string;
  status: 'draft' | 'ready' | 'published';
  metadata?: Record<string, any>;
}

interface DistributionChannel {
  id: string;
  platform: string;
  status: 'not_started' | 'scheduled' | 'published';
  scheduled_at?: string;
  published_at?: string;
  url?: string;
}

export function ReleaseIntentView({ projectId, userId, step, onUpdate }: ReleaseIntentViewProps) {
  // Local state for all release data (v0-style)
  const [project, setProject] = useState<Project | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [channels, setChannels] = useState<DistributionChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Campaign Pack state
  const [campaignPackDraft, setCampaignPackDraft] = useState<CampaignPackDraft | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadReleaseData();
  }, [projectId]);

  const loadReleaseData = async () => {
    try {
      setLoading(true);
      setError(null);

      const projectData = await projectsDb.getById(projectId);
      if (!projectData) {
        setError('Project not found');
        return;
      }

      setProject(projectData);

      // Load release plan data from project_bible
      const bible = (projectData.project_bible as any) || {};
      const releasePlan = bible.release_plan || {};

      // Load assets and channels from release_plan.currentDraft
      if (releasePlan.currentDraft) {
        if (releasePlan.currentDraft.assets) {
          setAssets(releasePlan.currentDraft.assets);
        }
        if (releasePlan.currentDraft.channels) {
          setChannels(releasePlan.currentDraft.channels);
        }
      }

      // If no data in release_plan, initialize with defaults
      if (!releasePlan.currentDraft || !releasePlan.currentDraft.channels) {
        setChannels([
          { id: '1', platform: 'YouTube', status: 'not_started' },
          { id: '2', platform: 'Instagram', status: 'not_started' },
          { id: '3', platform: 'TikTok', status: 'not_started' },
          { id: '4', platform: 'Twitter/X', status: 'not_started' },
        ]);
      }

      // Load campaign pack draft
      if (releasePlan.campaignPack?.currentDraft) {
        setCampaignPackDraft(releasePlan.campaignPack.currentDraft);
      }
    } catch (err) {
      console.error('Failed to load release data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load release data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAsset = () => {
    const newAsset: Asset = {
      id: `asset-${Date.now()}`,
      type: 'video',
      name: 'New Asset',
      status: 'draft',
    };
    setAssets([...assets, newAsset]);
  };

  const handleUpdateAsset = (id: string, updates: Partial<Asset>) => {
    setAssets(assets.map((asset) => (asset.id === id ? { ...asset, ...updates } : asset)));
  };

  const handleDeleteAsset = (id: string) => {
    setAssets(assets.filter((asset) => asset.id !== id));
  };

  const handleUpdateChannel = (id: string, updates: Partial<DistributionChannel>) => {
    setChannels(channels.map((channel) => (channel.id === id ? { ...channel, ...updates } : channel)));
  };

  const renderAssetsView = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Release Assets</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage all assets for this release
            </p>
          </div>
          <button
            data-testid="release-assets-add"
            onClick={handleAddAsset}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Asset
          </button>
        </div>

        {assets.length === 0 ? (
          <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-600 mb-4">No assets yet</p>
            <button
              onClick={handleAddAsset}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Create First Asset
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={asset.name}
                      onChange={(e) => handleUpdateAsset(asset.id, { name: e.target.value })}
                      className="w-full font-medium text-gray-900 border-none focus:ring-0 p-0"
                      placeholder="Asset name"
                    />
                    <p className="text-xs text-gray-500 mt-1 capitalize">{asset.type}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteAsset(asset.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-2">
                  <select
                    value={asset.type}
                    onChange={(e) => handleUpdateAsset(asset.id, { type: e.target.value as Asset['type'] })}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="video">Video</option>
                    <option value="image">Image</option>
                    <option value="audio">Audio</option>
                    <option value="document">Document</option>
                  </select>

                  <select
                    value={asset.status}
                    onChange={(e) => handleUpdateAsset(asset.id, { status: e.target.value as Asset['status'] })}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="draft">Draft</option>
                    <option value="ready">Ready</option>
                    <option value="published">Published</option>
                  </select>

                  {asset.url && (
                    <input
                      type="url"
                      value={asset.url}
                      onChange={(e) => handleUpdateAsset(asset.id, { url: e.target.value })}
                      placeholder="Asset URL"
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderDistributionView = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Distribution Channels</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure where and when to publish your content
          </p>
        </div>

        <div className="space-y-4">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className="bg-white border border-gray-200 rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{channel.platform}</h3>
                <select
                  value={channel.status}
                  onChange={(e) =>
                    handleUpdateChannel(channel.id, {
                      status: e.target.value as DistributionChannel['status'],
                    })
                  }
                  className="text-sm border border-gray-300 rounded px-3 py-1"
                >
                  <option value="not_started">Not Started</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div className="space-y-3">
                {channel.status === 'scheduled' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Scheduled Date
                    </label>
                    <input
                      type="datetime-local"
                      value={channel.scheduled_at ? new Date(channel.scheduled_at).toISOString().slice(0, 16) : ''}
                      onChange={(e) =>
                        handleUpdateChannel(channel.id, {
                          scheduled_at: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                        })
                      }
                      className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                )}

                {channel.status === 'published' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Published URL
                    </label>
                    <input
                      type="url"
                      value={channel.url || ''}
                      onChange={(e) => handleUpdateChannel(channel.id, { url: e.target.value })}
                      placeholder="https://..."
                      className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                    />
                    {channel.published_at && (
                      <p className="text-xs text-gray-500 mt-1">
                        Published: {new Date(channel.published_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAnalyticsView = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Release Analytics</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track performance across all distribution channels
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Analytics will appear here once content is published</p>
            <p className="text-sm text-gray-500">
              Track views, engagement, and performance metrics
            </p>
          </div>
        </div>
      </div>
    );
  };

  const saveCampaignPackDraft = async (draft: CampaignPackDraft) => {
    if (!project) return;

    try {
      setSaving(true);
      const bible = (project.project_bible as any) || {};
      const updatedBible = mergeCampaignPackIntoReleasePlan(bible, draft);

      await projectsDb.update(projectId, {
        project_bible: updatedBible,
      });

      // Update local project state
      const updatedProject = await projectsDb.getById(projectId);
      if (updatedProject) {
        setProject(updatedProject);
      }

      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Failed to save campaign pack draft:', err);
      setError(err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateDrafts = async () => {
    if (!project) return;

    try {
      setGenerating(true);
      setError(null);

      const bible = (project.project_bible as any) || {};
      const brief = getActiveBrief(bible);
      const releasePlanDraft = getReleasePlanDraft(bible);

      // Generate campaign pack draft
      const newDraft = generateCampaignPackDraft(
        brief,
        releasePlanDraft || { assets, channels },
        userId
      );

      setCampaignPackDraft(newDraft);

      // Save to project_bible
      await saveCampaignPackDraft(newDraft);

      // Reload to get fresh data
      await loadReleaseData();
    } catch (err) {
      console.error('Failed to generate drafts:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate drafts');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
      alert('Copied to clipboard!');
    });
  };

  const handleDownloadJSON = () => {
    if (!campaignPackDraft) return;

    const dataStr = JSON.stringify(campaignPackDraft, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `campaign-pack-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleToggleChecklistItem = async (itemId: string) => {
    if (!campaignPackDraft) return;

    const updatedChecklist = campaignPackDraft.checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    const updatedDraft = {
      ...campaignPackDraft,
      checklist: updatedChecklist,
    };

    setCampaignPackDraft(updatedDraft);
    await saveCampaignPackDraft(updatedDraft);
  };

  const handleUpdateCaption = async (platform: string, newCaption: string) => {
    if (!campaignPackDraft) return;

    const updatedCaptions = campaignPackDraft.captions.map((cap) =>
      cap.platform === platform
        ? { ...cap, caption: newCaption, characterCount: newCaption.length }
        : cap
    );

    const updatedDraft = {
      ...campaignPackDraft,
      captions: updatedCaptions,
    };

    setCampaignPackDraft(updatedDraft);
    // Debounce save to avoid too many API calls
    clearTimeout((handleUpdateCaption as any).saveTimeout);
    (handleUpdateCaption as any).saveTimeout = setTimeout(() => {
      saveCampaignPackDraft(updatedDraft);
    }, 1000);
  };

  const renderCampaignPackView = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Campaign Pack</h2>
            <p className="text-sm text-gray-600 mt-1">
              Generate and manage social media campaign drafts
            </p>
          </div>
          <div className="flex gap-2">
            {campaignPackDraft && (
              <>
                <button
                  onClick={handleDownloadJSON}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Download JSON
                </button>
              </>
            )}
            <button
              onClick={handleGenerateDrafts}
              disabled={generating}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? 'Generating...' : campaignPackDraft ? 'Regenerate Drafts' : 'Generate Drafts'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {!campaignPackDraft ? (
          <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-600 mb-4">No campaign pack drafts yet</p>
            <p className="text-sm text-gray-500 mb-6">
              Generate drafts from your brief and release plan to get started
            </p>
            <button
              onClick={handleGenerateDrafts}
              disabled={generating}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate Drafts'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Captions Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Caption Drafts</h3>
              <div className="space-y-4">
                {campaignPackDraft.captions.map((caption) => (
                  <div
                    key={caption.platform}
                    className="bg-white border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{caption.platform}</h4>
                      <div className="flex items-center gap-2">
                        {caption.maxCharacters && (
                          <span
                            className={`text-xs ${
                              (caption.characterCount || 0) > caption.maxCharacters
                                ? 'text-red-600'
                                : 'text-gray-500'
                            }`}
                          >
                            {caption.characterCount || 0} / {caption.maxCharacters}
                          </span>
                        )}
                        <button
                          onClick={() => handleCopyToClipboard(caption.caption)}
                          className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <textarea
                      value={caption.caption}
                      onChange={(e) => handleUpdateCaption(caption.platform, e.target.value)}
                      className="w-full text-sm border border-gray-300 rounded px-3 py-2 min-h-[100px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter caption..."
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Hashtags Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Hashtag Suggestions</h3>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex flex-wrap gap-2 mb-3">
                  {campaignPackDraft.hashtags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => handleCopyToClipboard(campaignPackDraft.hashtags.join(' '))}
                  className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                >
                  Copy All Hashtags
                </button>
              </div>
            </div>

            {/* Posting Checklist */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Posting Checklist</h3>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="space-y-2">
                  {campaignPackDraft.checklist.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleChecklistItem(item.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <span
                          className={`text-sm ${
                            item.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                          }`}
                        >
                          {item.task}
                        </span>
                        {item.platform && (
                          <span className="ml-2 text-xs text-gray-500">({item.platform})</span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-gray-600">Loading release data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="bg-white rounded-lg shadow p-8">
        {step === 'assets' && renderAssetsView()}
        {step === 'distribution' && renderDistributionView()}
        {step === 'analytics' && renderAnalyticsView()}
        {step === 'campaign-pack' && renderCampaignPackView()}
        {step !== 'assets' && step !== 'distribution' && step !== 'analytics' && step !== 'campaign-pack' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 capitalize">
              {step.replace('-', ' ')}
            </h2>
            <p className="text-gray-600 mt-2">Release step: {step}</p>
          </div>
        )}
      </div>
    </div>
  );
}
