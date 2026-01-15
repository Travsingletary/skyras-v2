'use client';

import { useEffect, useState } from 'react';
import { canGenerateVideo } from '@/lib/gateStatus';

interface VideoViewProps {
  projectId: string;
  userId: string;
}

export function VideoView({ projectId, userId }: VideoViewProps) {
  const [canGenerate, setCanGenerate] = useState(false);
  const [blockReason, setBlockReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkGate();
  }, [projectId]);

  const checkGate = async () => {
    try {
      setLoading(true);
      const result = await canGenerateVideo(projectId);
      setCanGenerate(result.allowed);
      setBlockReason(result.reason || null);
    } catch (err) {
      console.error('Failed to check video generation gate:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!canGenerate) return;

    console.log('Generate video for project:', projectId);
    // TODO: Implement video generation API call
    alert('Video generation will be implemented here');
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-gray-600">Checking video generation status...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="border-b border-gray-200 px-8 py-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Video Generation</h2>
            <p className="text-sm text-gray-600 mt-1">
              Generate video from your approved storyboard frames
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-6">

      {!canGenerate && blockReason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-red-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-lg font-medium text-red-800">Video Generation Blocked</h3>
              <p className="mt-2 text-sm text-red-700">{blockReason}</p>
            </div>
          </div>
        </div>
      )}

      {canGenerate && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-green-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-green-800">Ready to Generate Video</h3>
              <p className="mt-2 text-sm text-green-700">
                All storyboard frames are approved. You can now generate your video.
              </p>
              <button
                onClick={handleGenerateVideo}
                className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Generate Video
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated Videos</h3>
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="mt-4">No videos generated yet.</p>
        </div>
        </div>
        </div>
      </div>
    </div>
  );
}
