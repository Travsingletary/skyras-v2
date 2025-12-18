'use client';

import { useState, useEffect } from 'react';

interface AgentStatus {
  agentName: string;
  status: 'working' | 'available' | 'idle';
  pendingTasks: number;
  inProgressTasks: number;
  completedToday: number;
  currentTask: {
    id: string;
    title: string;
    workflowId: string;
  } | null;
  nextTask: {
    id: string;
    title: string;
    workflowId: string;
  } | null;
}

interface AgentStatusResponse {
  success: boolean;
  data: {
    agents: AgentStatus[];
    timestamp: string;
  };
}

export default function AgentStatusDashboard() {
  const [statuses, setStatuses] = useState<AgentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/agents/status');
      const data: AgentStatusResponse = await response.json();

      if (data.success) {
        setStatuses(data.data.agents);
        setLastUpdate(new Date());
        setError(null);
      } else {
        setError('Failed to fetch agent status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
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

  const getAgentIcon = (agentName: string) => {
    const icons: Record<string, string> = {
      cassidy: '🛡️',
      letitia: '📚',
      giorgio: '🎨',
      jamal: '📢',
    };
    return icons[agentName] || '🤖';
  };

  const triggerPoll = async (agentName: string) => {
    try {
      const response = await fetch('/api/agents/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentName, maxTasks: 5, autoExecute: true }),
      });
      const data = await response.json();
      if (data.success) {
        // Refresh status after polling
        setTimeout(fetchStatus, 1000);
      }
    } catch (err) {
      console.error('Failed to trigger poll:', err);
    }
  };

  if (loading && statuses.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse">Loading agent status...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Agent Status Dashboard</h2>
        <div className="flex gap-2">
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          {lastUpdate && (
            <span className="text-sm text-gray-500 self-center">
              Updated {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-800 rounded border border-red-300">
          Error: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statuses.map((agent) => (
          <div
            key={agent.agentName}
            className={`p-4 rounded-lg border-2 ${getStatusColor(agent.status)}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getAgentIcon(agent.agentName)}</span>
                <h3 className="font-semibold capitalize">{agent.agentName}</h3>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-white/50 capitalize">
                {agent.status}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Pending:</span>
                <span className="font-semibold">{agent.pendingTasks}</span>
              </div>
              <div className="flex justify-between">
                <span>In Progress:</span>
                <span className="font-semibold">{agent.inProgressTasks}</span>
              </div>
              <div className="flex justify-between">
                <span>Completed Today:</span>
                <span className="font-semibold">{agent.completedToday}</span>
              </div>
            </div>

            {agent.currentTask && (
              <div className="mt-3 pt-3 border-t border-current/20">
                <p className="text-xs font-semibold mb-1">Current Task:</p>
                <p className="text-xs truncate">{agent.currentTask.title}</p>
              </div>
            )}

            {agent.nextTask && (
              <div className="mt-2">
                <p className="text-xs font-semibold mb-1">Next Task:</p>
                <p className="text-xs truncate">{agent.nextTask.title}</p>
              </div>
            )}

            {agent.pendingTasks > 0 && (
              <button
                onClick={() => triggerPoll(agent.agentName)}
                className="mt-3 w-full px-3 py-1.5 text-xs bg-white/50 hover:bg-white/70 rounded transition-colors"
              >
                Process Tasks
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


