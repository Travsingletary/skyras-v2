'use client';

import { useEffect, useState } from 'react';
import { checkProjectGateStatus } from '@/lib/gateStatus';
import type { ProjectGateStatus } from '@/lib/gateStatus';

interface GateStatusPanelProps {
  projectId: string;
  initialGateStatus?: ProjectGateStatus | null;
}

export function GateStatusPanel({ projectId, initialGateStatus }: GateStatusPanelProps) {
  const [gateStatus, setGateStatus] = useState<ProjectGateStatus | null>(initialGateStatus || null);
  const [loading, setLoading] = useState(!initialGateStatus);

  useEffect(() => {
    if (initialGateStatus) {
      setGateStatus(initialGateStatus);
      setLoading(false);
    } else if (projectId) {
      // Only fetch if no initial status provided
      const loadGateStatus = async () => {
        try {
          setLoading(true);
          const status = await checkProjectGateStatus(projectId);
          setGateStatus(status);
        } catch (error) {
          console.error('Failed to load gate status:', error);
        } finally {
          setLoading(false);
        }
      };
      loadGateStatus();
    }
  }, [projectId, initialGateStatus]);

  if (loading || !gateStatus) {
    return (
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Gate Status</h3>
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  const statusColors = {
    ready: 'bg-green-100 text-green-800 border-green-200',
    blocked: 'bg-red-100 text-red-800 border-red-200',
    in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  };

  const badgeColors = {
    Ready: 'bg-green-500',
    Blocked: 'bg-red-500',
    'In Progress': 'bg-yellow-500',
  };

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Gate Status</h3>
      <div className={`rounded-lg border p-3 ${statusColors[gateStatus.status]}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{gateStatus.statusBadge}</span>
          <span className={`w-2 h-2 rounded-full ${badgeColors[gateStatus.statusBadge]}`} />
        </div>
        {gateStatus.blockedReason && (
          <p className="text-xs mt-2 opacity-90">{gateStatus.blockedReason}</p>
        )}
        {gateStatus.nextAction && (
          <p className="text-xs mt-1 font-medium">{gateStatus.nextAction}</p>
        )}
      </div>

      <div className="mt-3 space-y-2 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Approved References:</span>
          <span className="font-medium">{gateStatus.approvedReferenceCount}</span>
        </div>
        <div className="flex justify-between">
          <span>Style Card:</span>
          <span className="font-medium">{gateStatus.hasApprovedStyleCard ? 'Approved' : 'Pending'}</span>
        </div>
        {gateStatus.storyboardFrameCounts.total > 0 && (
          <div className="flex justify-between">
            <span>Storyboard Frames:</span>
            <span className="font-medium">
              {gateStatus.storyboardFrameCounts.approved} / {gateStatus.storyboardFrameCounts.total} approved
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
