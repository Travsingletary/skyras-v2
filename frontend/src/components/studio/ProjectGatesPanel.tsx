import React from 'react';
import { ControlPanel } from './ControlPanel';
import type { DashboardData } from '@/hooks/useDashboardData';

interface ProjectGatesPanelProps {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
}

export function ProjectGatesPanel({ data, loading, error }: ProjectGatesPanelProps) {
  const gates = data?.normalized.gates;
  const projects = gates?.projects || [];
  const empty = !loading && projects.length === 0;
  const notSupported = gates === null;

  const getStatusBadge = (statusBadge: string) => {
    switch (statusBadge) {
      case 'Blocked':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Ready':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <ControlPanel
      title="Project Gates"
      loading={loading}
      error={error}
      empty={empty}
      emptyMessage={notSupported ? 'Gates unavailable - Connect projects source' : 'No projects with gate data'}
    >
      {notSupported && !loading && (
        <div className="text-center py-6">
          <p className="text-sm text-zinc-500 mb-2">Gates unavailable</p>
          <p className="text-xs text-zinc-400">Connect projects source to view gate status</p>
        </div>
      )}

      {projects.length > 0 && (
        <div className="space-y-3">
          {projects.map((project) => (
            <div key={project.id} className="rounded-lg border border-zinc-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-zinc-900">
                  {project.name || `Project ${project.id.slice(0, 8)}`}
                </h4>
                <span
                  className={`text-xs px-2 py-0.5 rounded border ${getStatusBadge(project.statusBadge)}`}
                >
                  {project.statusBadge}
                </span>
              </div>

              {project.blockedReason && (
                <div className="text-xs text-zinc-600 mb-1">
                  <span className="font-medium">Blocked:</span> {project.blockedReason}
                </div>
              )}

              {project.nextAction && (
                <div className="text-xs text-zinc-600 mb-1">
                  <span className="font-medium">Next:</span> {project.nextAction}
                </div>
              )}

              {(project.approvedReferenceCount !== undefined || project.storyboardFrameCounts) && (
                <div className="text-xs text-zinc-500 mt-2 pt-2 border-t border-zinc-100">
                  {project.approvedReferenceCount !== undefined && (
                    <div>References: {project.approvedReferenceCount} approved</div>
                  )}
                  {project.storyboardFrameCounts && (
                    <div>
                      Storyboard: {project.storyboardFrameCounts.approved}/{project.storyboardFrameCounts.total} approved
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </ControlPanel>
  );
}
