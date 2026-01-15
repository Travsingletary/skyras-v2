'use client';

import { useEffect, useState } from 'react';
import { storyboardFramesDb } from '@/lib/database';
import type { StoryboardFrame } from '@/types/database';

interface StoryboardFramesReviewProps {
  projectId: string;
  userId: string;
  onUpdate?: () => void;
}

export function StoryboardFramesReview({ projectId, userId, onUpdate }: StoryboardFramesReviewProps) {
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
      alert('Failed to approve frame. Please try again.');
    }
  };

  const handleNeedsRevision = async (id: string, notes?: string) => {
    try {
      await storyboardFramesDb.needsRevision(id, notes);
      await loadFrames();
      onUpdate?.();
    } catch (err) {
      console.error('Failed to mark frame as needs revision:', err);
      alert('Failed to mark frame as needs revision. Please try again.');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedFrames.size === 0) {
      alert('Please select at least one frame to approve.');
      return;
    }

    try {
      await storyboardFramesDb.approveMany(Array.from(selectedFrames), userId);
      setSelectedFrames(new Set());
      await loadFrames();
      onUpdate?.();
    } catch (err) {
      console.error('Failed to bulk approve frames:', err);
      alert('Failed to approve selected frames. Please try again.');
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

  const selectAllUnapproved = () => {
    const unapprovedFrames = frames.filter(
      f => f.approval_status !== 'approved' && f.approval_status !== 'needs_revision'
    );
    setSelectedFrames(new Set(unapprovedFrames.map(f => f.id)));
  };

  const clearSelection = () => {
    setSelectedFrames(new Set());
  };

  // Calculate frame counts
  const approvedCount = frames.filter(f => f.approval_status === 'approved').length;
  const needsRevisionCount = frames.filter(f => f.approval_status === 'needs_revision').length;
  const totalCount = frames.length;
  const allApproved = totalCount > 0 && approvedCount === totalCount;

  if (loading) {
    return (
      <div className="p-8">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-gray-600">Loading frames...</div>
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
            <h2 className="text-2xl font-bold text-gray-900">Storyboard Frames Review</h2>
            <p className="text-sm text-gray-600 mt-1">
              Review and approve storyboard frames before generating video
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-6">

      {/* Frame counts display */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
            <div className="text-sm text-gray-600 mt-1">Approved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{needsRevisionCount}</div>
            <div className="text-sm text-gray-600 mt-1">Needs Revision</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
            <div className="text-sm text-gray-600 mt-1">Total</div>
          </div>
        </div>
        {allApproved && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
            <div className="flex items-center justify-center space-x-2 text-green-800">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">All frames approved! You can now generate video.</span>
            </div>
          </div>
        )}
      </div>

      {/* Bulk actions bar */}
      {selectedFrames.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex justify-between items-center">
          <div>
            <span className="font-medium text-blue-900">{selectedFrames.size} frame{selectedFrames.size !== 1 ? 's' : ''} selected</span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleBulkApprove}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Bulk Approve
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

      {/* Select all unapproved button */}
      {frames.length > 0 && !allApproved && selectedFrames.size === 0 && (
        <div className="flex justify-end">
          <button
            onClick={selectAllUnapproved}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Select All Unapproved
          </button>
        </div>
      )}

      {/* Frames grid */}
      {frames.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
          <p className="mt-4 text-gray-600">No storyboard frames yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {frames.map((frame) => {
            const isSelected = selectedFrames.has(frame.id);
            const isApproved = frame.approval_status === 'approved';
            const needsRevision = frame.approval_status === 'needs_revision';

            return (
              <div
                key={frame.id}
                className={`bg-white rounded-lg shadow hover:shadow-lg transition-shadow border-2 ${
                  isSelected ? 'border-blue-500' : isApproved ? 'border-green-200' : needsRevision ? 'border-orange-200' : 'border-gray-200'
                }`}
              >
                {/* Frame image */}
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
                  
                  {/* Status badge */}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      isApproved
                        ? 'bg-green-100 text-green-800'
                        : needsRevision
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {frame.approval_status === 'approved' ? 'Approved' : 
                       frame.approval_status === 'needs_revision' ? 'Needs Revision' : 
                       'Pending'}
                    </span>
                  </div>

                  {/* Frame number */}
                  <div className="absolute top-2 left-2 bg-gray-900/75 text-white px-2 py-1 rounded text-xs font-medium">
                    #{frame.frame_number}
                  </div>

                  {/* Selection checkbox */}
                  {!isApproved && (
                    <div className="absolute bottom-2 left-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectFrame(frame.id)}
                        className="w-5 h-5 rounded border-gray-300 cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* Frame details */}
                <div className="p-4">
                  <p className="text-sm text-gray-900 line-clamp-2 mb-2">{frame.prompt}</p>

                  {frame.revision_notes && (
                    <div className="mt-2 p-2 bg-orange-50 rounded text-xs text-orange-900 mb-2">
                      <strong>Revision notes:</strong> {frame.revision_notes}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="mt-4 flex space-x-2">
                    {!isApproved && (
                      <button
                        onClick={() => handleApprove(frame.id)}
                        className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors font-medium"
                      >
                        Approve
                      </button>
                    )}
                    {!needsRevision && !isApproved && (
                      <button
                        onClick={() => {
                          const notes = prompt('Enter revision notes (optional):');
                          handleNeedsRevision(frame.id, notes || undefined);
                        }}
                        className="flex-1 px-3 py-2 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 transition-colors font-medium"
                      >
                        Needs Revision
                      </button>
                    )}
                    {needsRevision && !isApproved && (
                      <button
                        onClick={() => {
                          const notes = prompt('Enter revision notes (optional):');
                          handleNeedsRevision(frame.id, notes || undefined);
                        }}
                        className="flex-1 px-3 py-2 bg-orange-600 text-white text-sm rounded hover:bg-orange-700 transition-colors font-medium"
                      >
                        Update Notes
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
      </div>
    </div>
  );
}
