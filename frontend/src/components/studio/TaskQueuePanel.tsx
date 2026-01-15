import React from 'react';
import { ControlPanel } from './ControlPanel';
import type { DashboardData } from '@/hooks/useDashboardData';

interface TaskQueuePanelProps {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
}

export function TaskQueuePanel({ data, loading, error }: TaskQueuePanelProps) {
  // Use normalized tasks directly
  const tasks = data?.normalized.tasks;
  const pendingTasks = tasks?.pending || [];
  const inProgressTasks = tasks?.inProgress || [];
  const completedTasks = tasks?.recentCompleted || [];
  const summary = tasks?.summary || { pendingCount: 0, inProgressCount: 0, completedRecentCount: 0 };

  const empty = !loading && summary.pendingCount === 0 && summary.inProgressCount === 0 && summary.completedRecentCount === 0;

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <ControlPanel
      title="Task Queue"
      loading={loading}
      error={error}
      empty={empty}
      emptyMessage="No tasks available (task details not included in workflow list)"
    >
      <div className="space-y-4">
        {pendingTasks.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-zinc-700 mb-2">Pending ({summary.pendingCount})</h4>
            <div className="space-y-1">
              {pendingTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between text-xs p-2 rounded bg-yellow-50">
                  <span className="text-zinc-900 truncate flex-1">{task.name || task.id.slice(0, 8)}</span>
                  <span className={`px-2 py-0.5 rounded border ${getStatusChip(task.status)}`}>
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {inProgressTasks.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-zinc-700 mb-2">In Progress ({summary.inProgressCount})</h4>
            <div className="space-y-1">
              {inProgressTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between text-xs p-2 rounded bg-blue-50">
                  <span className="text-zinc-900 truncate flex-1">{task.name || task.id.slice(0, 8)}</span>
                  <span className={`px-2 py-0.5 rounded border ${getStatusChip(task.status)}`}>
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {completedTasks.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-zinc-700 mb-2">Recently Completed ({summary.completedRecentCount})</h4>
            <div className="space-y-1">
              {completedTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between text-xs p-2 rounded bg-green-50">
                  <span className="text-zinc-900 truncate flex-1">{task.name || task.id.slice(0, 8)}</span>
                  <span className={`px-2 py-0.5 rounded border ${getStatusChip(task.status)}`}>
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {empty && (
          <p className="text-xs text-zinc-500 text-center py-4">
            {summary.pendingCount === 0 && summary.inProgressCount === 0
              ? 'No active tasks. Task details are only shown when workflow count is small (≤3 workflows).'
              : 'No tasks available'}
          </p>
        )}
      </div>
    </ControlPanel>
  );
}
