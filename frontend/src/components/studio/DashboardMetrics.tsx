import React from 'react';
import type { DashboardData } from '@/hooks/useDashboardData';

interface DashboardMetricsProps {
  data: DashboardData | null;
  loading: boolean;
}

export function DashboardMetrics({ data, loading }: DashboardMetricsProps) {
  const activeWorkflows = data?.normalized.workflows.filter(w => w.status === 'active').length || 0;
  const activeAgents = data?.normalized.agents.filter(a => a.status === 'working' || a.status === 'available').length || 0;
  const totalPendingTasks = data?.normalized.tasks.summary.pendingCount || 0;
  
  // System health: green if all sources ok, yellow if partial, red if errors
  const hasErrors = (data?.errors?.length || 0) > 0;
  const allSourcesOk = data?.raw.agents?.ok && data?.raw.workflows?.ok && (data?.raw.gates?.ok || !data?.raw.gates?.supported);
  const healthStatus = hasErrors ? 'error' : allSourcesOk ? 'ok' : 'partial';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="text-xs text-zinc-500 mb-1">Active Workflows</div>
        <div className="text-2xl font-semibold text-zinc-900">
          {loading ? '...' : activeWorkflows}
        </div>
      </div>
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="text-xs text-zinc-500 mb-1">Active Agents</div>
        <div className="text-2xl font-semibold text-zinc-900">
          {loading ? '...' : activeAgents}
        </div>
      </div>
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="text-xs text-zinc-500 mb-1">Pending Tasks</div>
        <div className="text-2xl font-semibold text-zinc-900">
          {loading ? '...' : totalPendingTasks}
        </div>
      </div>
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="text-xs text-zinc-500 mb-1">System Health</div>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              healthStatus === 'ok' ? 'bg-green-500' :
              healthStatus === 'partial' ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
          />
          <span className="text-sm font-medium text-zinc-900 capitalize">
            {healthStatus === 'ok' ? 'Healthy' : healthStatus === 'partial' ? 'Degraded' : 'Error'}
          </span>
        </div>
      </div>
    </div>
  );
}
