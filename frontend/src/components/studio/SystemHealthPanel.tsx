import React from 'react';
import { ControlPanel } from './ControlPanel';
import type { DashboardData } from '@/hooks/useDashboardData';

interface SystemHealthPanelProps {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function SystemHealthPanel({ data, loading, error, lastUpdated }: SystemHealthPanelProps) {
  const getHealthStatus = (ok: boolean | undefined, supported: boolean = true) => {
    if (!supported) return { status: 'not_supported', label: 'Not Supported', color: 'bg-gray-500' };
    if (ok === undefined) return { status: 'unknown', label: 'Unknown', color: 'bg-gray-400' };
    if (ok) return { status: 'ok', label: 'Healthy', color: 'bg-green-500' };
    return { status: 'error', label: 'Error', color: 'bg-red-500' };
  };

  const agentsHealth = getHealthStatus(data?.raw.agents?.ok);
  const workflowsHealth = getHealthStatus(data?.raw.workflows?.ok);
  const gatesHealth = getHealthStatus(data?.raw.gates?.ok, data?.raw.gates?.supported);
  const contentHealth = getHealthStatus(data?.raw.content?.ok, data?.raw.content?.supported);

  const errorCount = data?.errors?.length || 0;

  return (
    <ControlPanel
      title="System Health"
      loading={loading}
      error={error}
      empty={false}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-600">Agents API</span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${agentsHealth.color}`} />
            <span className="text-zinc-900">{agentsHealth.label}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-600">Workflows API</span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${workflowsHealth.color}`} />
            <span className="text-zinc-900">{workflowsHealth.label}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-600">Project Gates</span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${gatesHealth.color}`} />
            <span className="text-zinc-900">{gatesHealth.label}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-600">Content Pipeline</span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${contentHealth.color}`} />
            <span className="text-zinc-900">{contentHealth.label}</span>
          </div>
        </div>

        <div className="border-t border-zinc-200 pt-2 mt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-600">Errors (last poll)</span>
            <span className={`font-medium ${errorCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {errorCount}
            </span>
          </div>
        </div>

        {lastUpdated && (
          <div className="border-t border-zinc-200 pt-2 mt-2">
            <div className="text-xs text-zinc-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        )}

        {data?.errors && data.errors.length > 0 && (
          <div className="border-t border-zinc-200 pt-2 mt-2">
            <div className="text-xs text-red-600 space-y-1">
              {data.errors.map((err, idx) => (
                <div key={idx}>
                  <span className="font-medium">{err.source}:</span> {err.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ControlPanel>
  );
}
