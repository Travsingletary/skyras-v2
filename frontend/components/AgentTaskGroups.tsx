/**
 * Agent Task Groups Component
 *
 * Displays workflow tasks grouped by the agent assigned to them.
 * Shows real-time status updates with visual feedback (pulse animations, colors).
 */

'use client';

import type { WorkflowTask } from '@/types/database';

interface AgentTaskGroupsProps {
  tasks: WorkflowTask[];
}

const AGENT_INFO = {
  marcus: {
    name: 'Marcus',
    icon: '🎯',
    color: 'blue',
    role: 'Project Manager',
  },
  giorgio: {
    name: 'Giorgio',
    icon: '🎨',
    color: 'purple',
    role: 'Creative Director',
  },
  cassidy: {
    name: 'Cassidy',
    icon: '📋',
    color: 'green',
    role: 'Compliance Specialist',
  },
  jamal: {
    name: 'Jamal',
    icon: '📢',
    color: 'orange',
    role: 'Distribution Manager',
  },
  letitia: {
    name: 'Letitia',
    icon: '📁',
    color: 'pink',
    role: 'Catalog Manager',
  },
} as const;

type AgentName = keyof typeof AGENT_INFO;

export default function AgentTaskGroups({ tasks }: AgentTaskGroupsProps) {
  // Group tasks by agent
  const tasksByAgent = tasks.reduce((acc, task) => {
    const agent = (task.agent_name as AgentName) || 'marcus';
    if (!acc[agent]) acc[agent] = [];
    acc[agent].push(task);
    return acc;
  }, {} as Record<AgentName, WorkflowTask[]>);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-300 animate-pulse';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'pending':
        return 'bg-gray-100 text-gray-600 border-gray-300';
      case 'skipped':
        return 'bg-gray-100 text-gray-500 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (Object.keys(tasksByAgent).length === 0) {
    return (
      <div className="bg-white rounded-lg border p-12 text-center">
        <p className="text-gray-600">No tasks assigned yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(tasksByAgent).map(([agentName, agentTasks]) => {
        const agent =
          AGENT_INFO[agentName as AgentName] ||
          {
            name: agentName,
            icon: '🤖',
            color: 'gray',
            role: 'Agent',
          };

        const stats = {
          total: agentTasks.length,
          completed: agentTasks.filter((t) => t.status === 'completed').length,
          inProgress: agentTasks.filter((t) => t.status === 'in_progress').length,
          pending: agentTasks.filter((t) => t.status === 'pending').length,
          failed: agentTasks.filter((t) => t.status === 'failed').length,
        };

        return (
          <div
            key={agentName}
            className={`bg-white rounded-lg border-2 border-${agent.color}-200 p-6`}
          >
            {/* Agent Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{agent.icon}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
                  <p className="text-sm text-gray-600">{agent.role}</p>
                </div>
              </div>
              <div className="flex gap-2 text-xs">
                {stats.inProgress > 0 && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium animate-pulse">
                    {stats.inProgress} active
                  </span>
                )}
                {stats.pending > 0 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                    {stats.pending} pending
                  </span>
                )}
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                  {stats.completed}/{stats.total} done
                </span>
                {stats.failed > 0 && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full">
                    {stats.failed} failed
                  </span>
                )}
              </div>
            </div>

            {/* Task List */}
            <div className="space-y-2">
              {agentTasks
                .sort((a, b) => a.position - b.position)
                .map((task) => (
                  <div
                    key={task.id}
                    className={`border rounded-lg p-3 transition-all ${getStatusColor(
                      task.status
                    )}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        {task.description && (
                          <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                        )}
                        {task.started_at && task.status === 'in_progress' && (
                          <p className="text-xs text-blue-600 mt-1">
                            ⏳ Started {formatTime(task.started_at)}
                          </p>
                        )}
                        {task.completed_at && task.status === 'completed' && (
                          <p className="text-xs text-green-600 mt-1">
                            ✅ Completed {formatTime(task.completed_at)}
                          </p>
                        )}
                        {task.error_message && (
                          <p className="text-xs text-red-600 mt-1">
                            ❌ Error: {task.error_message}
                          </p>
                        )}
                        {task.results && Object.keys(task.results).length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                              View results
                            </summary>
                            <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                              {JSON.stringify(task.results, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                      <span className="text-xs font-medium uppercase ml-2 whitespace-nowrap">
                        {task.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
