import React from 'react';
import Link from 'next/link';
import { ControlPanel } from './ControlPanel';
import type { DashboardData } from '@/hooks/useDashboardData';

interface WorkflowProgressPanelProps {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
}

export function WorkflowProgressPanel({ data, loading, error }: WorkflowProgressPanelProps) {
  const workflows = data?.normalized.workflows.filter(w => w.status === 'active') || [];
  const empty = !loading && workflows.length === 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <ControlPanel
      title="Active Workflows"
      loading={loading}
      error={error}
      empty={empty}
      emptyMessage="No active workflows"
    >
      <div className="space-y-3">
        {workflows.map((workflow) => (
          <div key={workflow.id} className="rounded-lg border border-zinc-200 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-zinc-900">
                  {workflow.name || `Workflow ${workflow.id.slice(0, 8)}`}
                </h4>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded border ${getStatusBadge(workflow.status)}`}
              >
                {workflow.status}
              </span>
            </div>

            <div className="mb-2">
              <div className="flex items-center justify-between text-xs text-zinc-600 mb-1">
                <span>Progress</span>
                <span>{workflow.progress}%</span>
              </div>
              <div className="w-full bg-zinc-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${workflow.progress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <Link
                href={`/workflows`}
                className="text-xs text-blue-600 hover:text-blue-800"
                title={`View workflow ${workflow.id}`}
              >
                View Details
              </Link>
              <button
                disabled
                className="text-xs text-zinc-400 cursor-not-allowed"
                title="Not implemented"
              >
                Pause
              </button>
              <button
                disabled
                className="text-xs text-zinc-400 cursor-not-allowed"
                title="Not implemented"
              >
                Cancel
              </button>
            </div>
          </div>
        ))}
      </div>
    </ControlPanel>
  );
}
