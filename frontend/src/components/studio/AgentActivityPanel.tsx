import React from 'react';
import { ControlPanel } from './ControlPanel';
import type { DashboardData } from '@/hooks/useDashboardData';

interface AgentActivityPanelProps {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
}

const agentIcons: Record<string, string> = {
  marcus: '🧠',
  cassidy: '🛡️',
  letitia: '📚',
  giorgio: '🎨',
  jamal: '📢',
};

const agentDisplayNames: Record<string, string> = {
  marcus: 'Marcus',
  cassidy: 'Cassidy',
  letitia: 'Letitia',
  giorgio: 'Giorgio',
  jamal: 'Jamal',
};

export function AgentActivityPanel({ data, loading, error }: AgentActivityPanelProps) {
  const agents = data?.normalized.agents || [];
  const empty = !loading && agents.length === 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'working':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'available':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'idle':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'working':
        return 'Working';
      case 'available':
        return 'Available';
      case 'idle':
        return 'Idle';
      default:
        return status;
    }
  };

  return (
    <ControlPanel
      title="Agent Activity"
      loading={loading}
      error={error}
      empty={empty}
      emptyMessage="No agents available"
    >
      <div className="space-y-3">
        {agents.map((agent) => {
          const icon = agentIcons[agent.name.toLowerCase()] || '🤖';
          const displayName = agentDisplayNames[agent.name.toLowerCase()] || agent.name;

          return (
            <div key={agent.name} className="rounded-lg border border-zinc-200 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{icon}</span>
                  <span className="text-sm font-medium text-zinc-900">{displayName}</span>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded border ${getStatusBadge(agent.status)}`}
                >
                  {getStatusLabel(agent.status)}
                </span>
              </div>

              {agent.currentTask && (
                <div className="text-xs text-zinc-600 mb-1">
                  <span className="font-medium">Current:</span> {agent.currentTask.title}
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-zinc-500">
                <span>Queue: {agent.queueDepth}</span>
                <span>Pending: {agent.counts.pending}</span>
                <span>In Progress: {agent.counts.inProgress}</span>
                {agent.counts.completedToday > 0 && (
                  <span>Completed Today: {agent.counts.completedToday}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ControlPanel>
  );
}
