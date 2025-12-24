'use client';

import { useEffect, useState } from 'react';
import type { DailyPlan, DailyPlanBlock } from '@/types/database';

export default function MorningMeetingPage() {
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [blocks, setBlocks] = useState<DailyPlanBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // TODO: Get actual user ID from auth
  const userId = 'public';

  useEffect(() => {
    fetchTodaysPlan();
  }, []);

  async function fetchTodaysPlan() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/morning-meeting/today?userId=${userId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch plan');
      }

      setPlan(data.data.plan);
      setBlocks(data.data.blocks);
    } catch (err) {
      console.error('Error fetching plan:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove() {
    if (!plan) return;

    try {
      setApproving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch('/api/morning-meeting/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve plan');
      }

      setSuccessMessage(
        `Success! ${data.data.syncedCount} block(s) added to your calendar.${
          data.data.conflictCount > 0
            ? ` ${data.data.conflictCount} block(s) skipped due to conflicts.`
            : ''
        }`
      );

      // Refresh plan to show updated sync status
      await fetchTodaysPlan();
    } catch (err) {
      console.error('Error approving plan:', err);
      setError((err as Error).message);
    } finally {
      setApproving(false);
    }
  }

  async function handleReject() {
    if (!plan) return;

    try {
      setRejecting(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch('/api/morning-meeting/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject plan');
      }

      setSuccessMessage('Plan dismissed. No calendar events created.');

      // Update plan status locally
      setPlan({ ...plan, status: 'rejected' });
    } catch (err) {
      console.error('Error rejecting plan:', err);
      setError((err as Error).message);
    } finally {
      setRejecting(false);
    }
  }

  function formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Los_Angeles',
    });
  }

  function formatDuration(start: string, end: string): string {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const durationMs = endDate.getTime() - startDate.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your morning plan...</p>
        </div>
      </div>
    );
  }

  if (error && !plan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Plan Available</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchTodaysPlan}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  const hasConflicts = blocks.some(b => b.has_conflict);
  const isPlanApproved = plan.status === 'approved';
  const isPlanRejected = plan.status === 'rejected';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Good Morning! 🌅</h1>
          <p className="text-gray-600">
            {new Date(plan.plan_date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Daily Brief */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Why This Day Matters</h2>
          <p className="text-gray-700 leading-relaxed">{plan.daily_brief}</p>
        </div>

        {/* Time Blocks */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Time Blocks</h2>

          {hasConflicts && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ Some blocks have scheduling conflicts. They won't be added to your calendar unless you adjust the times.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {blocks.map((block, index) => (
              <div
                key={block.id}
                className={`border rounded-lg p-4 ${
                  block.has_conflict
                    ? 'border-yellow-300 bg-yellow-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-blue-600">
                        {formatTime(block.start_time)} - {formatTime(block.end_time)}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({formatDuration(block.start_time, block.end_time)})
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{block.title}</h3>
                  </div>

                  {/* Status Badge */}
                  {block.sync_status === 'synced' && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      ✓ Synced
                    </span>
                  )}
                  {block.has_conflict && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      ⚠️ Conflict
                    </span>
                  )}
                </div>

                {block.description && (
                  <p className="text-sm text-gray-600 mb-2">{block.description}</p>
                )}

                {/* Show alternate time slots if there's a conflict */}
                {block.has_conflict && block.alternate_slots.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-yellow-200">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      Suggested alternate times:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {block.alternate_slots.map((slot, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-white border border-yellow-300 text-gray-700 px-2 py-1 rounded"
                        >
                          {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Minimum Day Fallback */}
        {plan.minimum_day_fallback && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">Minimum Day</h2>
            <p className="text-blue-800">
              If you can only do one thing today: <strong>{plan.minimum_day_fallback}</strong>
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {!isPlanApproved && !isPlanRejected && (
          <div className="flex gap-4">
            <button
              onClick={handleApprove}
              disabled={approving || rejecting}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {approving ? 'Adding to Calendar...' : 'Approve & Add to Calendar'}
            </button>

            <button
              onClick={handleReject}
              disabled={approving || rejecting}
              className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {rejecting ? 'Dismissing...' : 'Skip Today'}
            </button>
          </div>
        )}

        {/* Status Messages */}
        {isPlanApproved && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-800 font-medium">
              ✓ Plan approved and synced to your calendar
            </p>
          </div>
        )}

        {isPlanRejected && (
          <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 text-center">
            <p className="text-gray-700">Plan dismissed</p>
          </div>
        )}
      </div>
    </div>
  );
}
