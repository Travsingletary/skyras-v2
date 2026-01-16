'use client';

import { useEffect, useState } from 'react';
import { videoClipsDb, projectsDb } from '@/lib/database';
import { canGenerateVideo } from '@/lib/gateStatus';
import type { VideoClip } from '@/types/database';
import Link from 'next/link';

interface FinishViewProps {
  projectId: string;
  userId: string;
  onComplete?: () => void;
  onUpdate?: () => void;
}

interface VideoWithApproval {
  id: string;
  created_at: string;
  video_url?: string;
  thumbnail_url?: string;
  status: 'completed' | 'generating' | 'failed';
  approved: boolean;
  approved_by?: string;
  approved_at?: string;
  provider?: string;
  prompt?: string;
  error?: string;
}

export function FinishView({ projectId, userId, onComplete, onUpdate }: FinishViewProps) {
  const [videos, setVideos] = useState<VideoWithApproval[]>([]);
  const [canGenerate, setCanGenerate] = useState(false);
  const [blockReason, setBlockReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [projectId]);

  // Poll for video status updates
  useEffect(() => {
    if (videos.some(v => v.status === 'generating')) {
      const interval = setInterval(() => {
        loadData();
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval);
    }
  }, [videos, projectId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Check if video generation is allowed
      const gateResult = await canGenerateVideo(projectId);
      setCanGenerate(gateResult.allowed);
      setBlockReason(gateResult.reason || null);

      // Load video clips for this project
      const videoClips = await videoClipsDb.getByProjectId(projectId);

      // Also check project metadata for generated videos (from generateVideo API)
      const project = await projectsDb.getById(projectId);
      const metadataVideos = project?.metadata?.generatedVideos || [];

      // Combine video clips and metadata videos
      const allVideos: VideoWithApproval[] = [
        ...videoClips.map(clip => ({
          id: clip.id,
          created_at: clip.created_at,
          video_url: clip.video_url,
          thumbnail_url: undefined,
          status: clip.status === 'completed' ? 'completed' : clip.status === 'generating' ? 'generating' : 'failed',
          approved: clip.metadata?.approved === true,
          approved_by: clip.metadata?.approved_by,
          approved_at: clip.metadata?.approved_at,
          provider: clip.provider,
          prompt: clip.metadata?.prompt,
          error: clip.error_message,
        })),
        ...metadataVideos.map((v: any) => ({
          id: v.id || `meta-${Date.now()}`,
          created_at: v.created_at || new Date().toISOString(),
          video_url: v.videoUrl || v.video_url,
          thumbnail_url: v.thumbnailUrl || v.thumbnail_url,
          status: v.status === 'succeeded' ? 'completed' : v.status === 'running' || v.status === 'pending' ? 'generating' : 'failed',
          approved: v.approved === true,
          approved_by: v.approved_by,
          approved_at: v.approved_at,
          provider: v.provider,
          prompt: v.prompt,
          error: v.error,
        })),
      ];

      setVideos(allVideos.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (err) {
      console.error('Failed to load video data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!canGenerate) return;

    try {
      setGenerating(true);
      setError(null);

      // Get approved storyboard frames to use as reference
      const response = await fetch('/api/tools/generateVideo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Generate video from approved storyboard frames for project ${projectId}`,
          projectId,
          duration: 5,
          aspectRatio: '16:9',
          waitForCompletion: false, // Don't wait, poll for status
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate video');
      }

      const result = await response.json();

      if (result.success) {
        // Store video in project metadata for tracking
        const project = await projectsDb.getById(projectId);
        if (project) {
          const existingVideos = project.metadata?.generatedVideos || [];
          const newVideo = {
            id: result.video?.id || result.taskId || Date.now().toString(),
            created_at: new Date().toISOString(),
            videoUrl: result.video?.videoUrl,
            thumbnailUrl: result.video?.thumbnailUrl,
            status: result.status || 'pending',
            provider: result.video?.provider,
            prompt: result.video?.prompt,
            approved: false,
          };

          await projectsDb.update(projectId, {
            metadata: {
              ...project.metadata,
              generatedVideos: [...existingVideos, newVideo],
            },
          });
        }

        // Reload data to show new video
        await loadData();
      } else {
        throw new Error(result.error || 'Video generation failed to start');
      }
    } catch (err) {
      console.error('Failed to generate video:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate video. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleApproveVideo = async (videoId: string) => {
    try {
      setError(null);

      // Check if it's a video clip or metadata video
      const video = videos.find(v => v.id === videoId);
      if (!video) return;

      // Try to update video clip first
      try {
        const clip = await videoClipsDb.getById(videoId);
        if (clip) {
          await videoClipsDb.update(videoId, {
            metadata: {
              ...clip.metadata,
              approved: true,
              approved_by: userId,
              approved_at: new Date().toISOString(),
            },
          });
          await loadData();
          onUpdate?.();
          return;
        }
      } catch (clipErr) {
        // If not a video clip, update project metadata
        const project = await projectsDb.getById(projectId);
        if (project) {
          const existingVideos = project.metadata?.generatedVideos || [];
          const updatedVideos = existingVideos.map((v: any) =>
            (v.id === videoId || v.id === `meta-${videoId}`)
              ? { ...v, approved: true, approved_by: userId, approved_at: new Date().toISOString() }
              : v
          );

          await projectsDb.update(projectId, {
            metadata: {
              ...project.metadata,
              generatedVideos: updatedVideos,
            },
          });
        }
      }

      await loadData();
      onUpdate?.();
    } catch (err) {
      console.error('Failed to approve video:', err);
      setError('Failed to approve video. Please try again.');
    }
  };

  const handleRegenerate = async () => {
    // Unapprove all videos and generate new one
    try {
      setError(null);

      // Unapprove all approved videos
      const project = await projectsDb.getById(projectId);
      if (project) {
        const existingVideos = project.metadata?.generatedVideos || [];
        const updatedVideos = existingVideos.map((v: any) => ({
          ...v,
          approved: false,
          approved_by: undefined,
          approved_at: undefined,
        }));

        await projectsDb.update(projectId, {
          metadata: {
            ...project.metadata,
            generatedVideos: updatedVideos,
          },
        });
      }

      // Also unapprove video clips
      for (const video of videos.filter(v => v.approved)) {
        try {
          const clip = await videoClipsDb.getById(video.id);
          if (clip) {
            await videoClipsDb.update(video.id, {
              metadata: {
                ...clip.metadata,
                approved: false,
                approved_by: undefined,
                approved_at: undefined,
              },
            });
          }
        } catch (err) {
          // Ignore if not a video clip
        }
      }

      // Generate new video
      await handleGenerateVideo();
    } catch (err) {
      console.error('Failed to regenerate video:', err);
      setError('Failed to regenerate video. Please try again.');
    }
  };

  const handleComplete = async () => {
    // Validation
    const approvedVideo = videos.find(v => v.approved && v.status === 'completed');
    if (!approvedVideo) {
      setError('Please approve a video to complete this project');
      return;
    }

    // Mark project as completed or trigger completion callback
    onComplete?.();
  };

  const approvedVideo = videos.find(v => v.approved && v.status === 'completed');
  const canComplete = !!approvedVideo;

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              Step 5
            </span>
            <h1 className="text-3xl font-bold text-gray-900">Finish</h1>
            <span className="ml-auto text-xs text-gray-400 font-mono" title="Build version">
              v2026.01.16-policy
            </span>
          </div>
          <p className="text-gray-600 mt-2">
            Generate your final video, review it, and approve when ready to complete your project.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Video Generation Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Video Generation</h2>

          {!canGenerate && blockReason ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start">
                <svg className="w-6 h-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-red-800">Video Generation Blocked</h3>
                  <p className="mt-2 text-sm text-red-700">{blockReason}</p>
                  {blockReason.includes('Create storyboard frames first') ? (
                    <div className="mt-4">
                      <Link
                        href={`/projects/${projectId}?intent=create&step=storyboard`}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Go to Step 3 (Storyboard)
                      </Link>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-red-600 font-medium">Go back to Step 4 to complete prerequisites.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-green-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-lg font-medium text-green-800">Ready to Generate Video</h3>
                    <p className="mt-2 text-sm text-green-700">
                      All prerequisites complete. Generate your final video output.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleGenerateVideo}
                  disabled={generating}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? 'Generating...' : 'Generate Video'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Generated Videos Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Videos</h2>

          {videos.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-600">No videos generated yet. Generate your first video to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {videos.map((video) => {
                const isApproved = video.approved === true;
                const isCompleted = video.status === 'completed';
                const isGenerating = video.status === 'generating';
                const isFailed = video.status === 'failed';

                return (
                  <div
                    key={video.id}
                    className={`border rounded-lg overflow-hidden ${
                      isApproved ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Video {new Date(video.created_at).toLocaleDateString()}
                            </h3>
                            {isApproved && (
                              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                                ✓ Approved
                              </span>
                            )}
                            {isGenerating && (
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                Generating...
                              </span>
                            )}
                            {isCompleted && !isApproved && (
                              <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                                Ready
                              </span>
                            )}
                            {isFailed && (
                              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                                Failed
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Provider: {video.provider || 'Unknown'}</div>
                            <div>Status: {video.status}</div>
                            {video.error && (
                              <div className="text-red-600">Error: {video.error}</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Video Preview */}
                      {video.video_url && isCompleted && (
                        <div className="mb-4">
                          <video
                            src={video.video_url}
                            controls
                            className="w-full rounded-lg"
                            style={{ maxHeight: '400px' }}
                          >
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-3">
                        {isCompleted && !isApproved && (
                          <button
                            onClick={() => handleApproveVideo(video.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                          >
                            Approve
                          </button>
                        )}
                        {isCompleted && video.video_url && (
                          <button
                            onClick={() => window.open(video.video_url, '_blank')}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Download
                          </button>
                        )}
                        {isCompleted && (
                          <button
                            onClick={handleRegenerate}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Regenerate
                          </button>
                        )}
                        {isFailed && (
                          <button
                            onClick={handleGenerateVideo}
                            disabled={generating}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            Retry
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Completion Section */}
        <div className="pt-6 border-t border-gray-200">
          {!canComplete ? (
            <button
              disabled
              className="w-full px-6 py-3 bg-gray-300 text-gray-600 rounded-lg font-medium cursor-not-allowed"
              title="Approve a video to complete the project"
            >
              Complete Project
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Complete Project ✓
            </button>
          )}
          {!canComplete && videos.length > 0 && (
            <p className="mt-2 text-xs text-gray-500 text-center">
              Approve a video to complete the project
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
