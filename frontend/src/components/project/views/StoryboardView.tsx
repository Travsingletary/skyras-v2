'use client';

import { useEffect, useState } from 'react';
import { storyboardFramesDb } from '@/lib/database';
import type { StoryboardFrame } from '@/types/database';

interface StoryboardViewProps {
  projectId: string;
  userId: string;
  onUpdate?: () => void;
}

export function StoryboardView({ projectId, userId, onUpdate }: StoryboardViewProps) {
  const [frames, setFrames] = useState<StoryboardFrame[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFrames, setSelectedFrames] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFrames();
  }, [projectId]);

  const loadFrames = async () => {
    try {
      setLoading(true);
      const framesData = await storyboardFramesDb.getByProjectId(projectId);
      setFrames(framesData);
    } catch (err) {
      console.error('Failed to load storyboard frames:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await storyboardFramesDb.approve(id, userId);
      await loadFrames();
      onUpdate?.();
    } catch (err) {
      console.error('Failed to approve frame:', err);
    }
  };

  const handleApproveSelected = async () => {
    try {
      await storyboardFramesDb.approveMany(Array.from(selectedFrames), userId);
      setSelectedFrames(new Set());
      await loadFrames();
      onUpdate?.();
    } catch (err) {
      console.error('Failed to approve selected frames:', err);
    }
  };

  const handleNeedsRevision = async (id: string) => {
    const notes = prompt('Enter revision notes (optional):');
    try {
      await storyboardFramesDb.needsRevision(id, notes || undefined);
      await loadFrames();
      onUpdate?.();
    } catch (err) {
      console.error('Failed to mark frame as needs revision:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this frame?')) return;

    try {
      await storyboardFramesDb.softDelete(id);
      await loadFrames();
      onUpdate?.();
    } catch (err) {
      console.error('Failed to delete frame:', err);
    }
  };

  const toggleSelectFrame = (id: string) => {
    const newSelected = new Set(selectedFrames);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedFrames(newSelected);
  };

  const selectAll = () => {
    const unapprovedFrames = frames.filter(f => f.approval_status !== 'approved');
    setSelectedFrames(new Set(unapprovedFrames.map(f => f.id)));
  };

  const clearSelection = () => {
    setSelectedFrames(new Set());
  };

  const approvedCount = frames.filter(f => f.approval_status === 'approved').length;
  const allApproved = frames.length > 0 && approvedCount === frames.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading storyboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Storyboard</h2>
          <p className="text-sm text-gray-600 mt-1">
            Review and approve storyboard frames
          </p>
          <div className="mt-2 inline-flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              allApproved
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {approvedCount} of {frames.length} frames approved
            </span>
            {allApproved && (
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Generate Frames
        </button>
      </div>

      {selectedFrames.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex justify-between items-center">
          <div>
            <span className="font-medium text-blue-900">{selectedFrames.size} frames selected</span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleApproveSelected}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Approve Selected
            </button>
            <button
              onClick={clearSelection}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {frames.length > 0 && !allApproved && (
        <div className="flex justify-end">
          <button
            onClick={selectAll}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Select All Unapproved
          </button>
        </div>
      )}

      {frames.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
          <p className="mt-4 text-gray-600">No storyboard frames yet. Generate frames to start building your video.</p>
          <button className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Generate Storyboard Frames
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {frames.map((frame) => (
            <div
              key={frame.id}
              className={`bg-white rounded-lg shadow hover:shadow-lg transition-shadow ${
                selectedFrames.has(frame.id) ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="aspect-video bg-gray-200 rounded-t-lg relative overflow-hidden">
                {frame.image_url ? (
                  <img
                    src={frame.image_url}
                    alt={`Frame ${frame.frame_number}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-gray-400">{frame.frame_number}</div>
                      <div className="text-sm text-gray-500 mt-2">No preview</div>
                    </div>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    frame.approval_status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : frame.approval_status === 'needs_revision'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {frame.approval_status.replace('_', ' ')}
                  </span>
                </div>
                <div className="absolute top-2 left-2 bg-gray-900/75 text-white px-2 py-1 rounded text-xs font-medium">
                  #{frame.frame_number}
                </div>
                {frame.approval_status !== 'approved' && (
                  <div className="absolute bottom-2 left-2">
                    <input
                      type="checkbox"
                      checked={selectedFrames.has(frame.id)}
                      onChange={() => toggleSelectFrame(frame.id)}
                      className="w-5 h-5 rounded border-gray-300"
                    />
                  </div>
                )}
              </div>

              <div className="p-4">
                <p className="text-sm text-gray-900 line-clamp-2">{frame.prompt}</p>

                {frame.revision_notes && (
                  <div className="mt-2 p-2 bg-orange-50 rounded text-xs text-orange-900">
                    Revision: {frame.revision_notes}
                  </div>
                )}

                <div className="mt-4 flex space-x-2">
                  {frame.approval_status !== 'approved' && (
                    <button
                      onClick={() => handleApprove(frame.id)}
                      className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      Approve
                    </button>
                  )}
                  {frame.approval_status !== 'needs_revision' && frame.approval_status !== 'approved' && (
                    <button
                      onClick={() => handleNeedsRevision(frame.id)}
                      className="flex-1 px-3 py-2 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 transition-colors"
                    >
                      Revise
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(frame.id)}
                    className="px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
