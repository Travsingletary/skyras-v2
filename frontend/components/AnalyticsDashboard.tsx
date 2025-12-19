'use client';

import { useEffect, useState } from 'react';

interface AnalyticsData {
  projects: {
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
  };
  files: {
    total: number;
    totalSize: number;
    byType: Record<string, number>;
    byProcessingStatus: Record<string, number>;
  };
  workflows: {
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
  };
  processing: {
    total: number;
    byStatus: Record<string, number>;
    byAgent: Record<string, number>;
    byType: Record<string, number>;
  };
  recent: {
    projects: Array<{
      id: string;
      name: string;
      type: string;
      status: string;
      createdAt: string;
    }>;
    files: Array<{
      id: string;
      name: string;
      type: string;
      size: number;
      status: string;
      createdAt: string;
    }>;
    workflows: Array<{
      id: string;
      name: string;
      type: string;
      status: string;
      progress: number;
      createdAt: string;
    }>;
  };
}

interface AnalyticsDashboardProps {
  userId: string;
}

export default function AnalyticsDashboard({ userId }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const res = await fetch(`/api/analytics?userId=${userId}`);

        if (!res.ok) {
          throw new Error('Failed to fetch analytics');
        }

        const result = await res.json();

        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.error || 'Unknown error');
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchAnalytics();
    }
  }, [userId]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAgentEmoji = (agent: string): string => {
    const emojiMap: Record<string, string> = {
      cassidy: '⚖️',
      letitia: '📚',
      giorgio: '🎬',
      jamal: '📢',
    };
    return emojiMap[agent] || '🤖';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-zinc-600">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4">
        <h3 className="text-sm font-semibold text-red-800">Error</h3>
        <p className="mt-1 text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="text-xs font-medium text-zinc-600 uppercase">Projects</h3>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">{data.projects.total}</p>
          <div className="mt-2 flex gap-2 text-xs text-zinc-600">
            <span className="text-green-600">{data.projects.byStatus.active || 0} active</span>
            <span>•</span>
            <span>{data.projects.byStatus.completed || 0} done</span>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="text-xs font-medium text-zinc-600 uppercase">Files</h3>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">{data.files.total}</p>
          <div className="mt-2 text-xs text-zinc-600">
            {formatFileSize(data.files.totalSize)} total
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="text-xs font-medium text-zinc-600 uppercase">Workflows</h3>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">{data.workflows.total}</p>
          <div className="mt-2 flex gap-2 text-xs text-zinc-600">
            <span className="text-blue-600">{data.workflows.byStatus.active || 0} active</span>
            <span>•</span>
            <span>{data.workflows.completionRate}% complete</span>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="text-xs font-medium text-zinc-600 uppercase">Processing Jobs</h3>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">{data.processing.total}</p>
          <div className="mt-2 flex gap-2 text-xs text-zinc-600">
            <span className="text-green-600">{data.processing.byStatus.completed || 0} done</span>
            <span>•</span>
            <span className="text-yellow-600">{data.processing.byStatus.pending || 0} pending</span>
          </div>
        </div>
      </div>

      {/* File Types Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-900">Files by Type</h3>
          <div className="mt-3 space-y-2">
            {Object.entries(data.files.byType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between text-sm">
                <span className="capitalize text-zinc-700">{type}</span>
                <span className="font-medium text-zinc-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-900">Agent Activity</h3>
          <div className="mt-3 space-y-2">
            {Object.entries(data.processing.byAgent).map(([agent, count]) => (
              <div key={agent} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-zinc-700">
                  <span>{getAgentEmoji(agent)}</span>
                  <span className="capitalize">{agent}</span>
                </span>
                <span className="font-medium text-zinc-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Recent Projects */}
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-900 mb-3">Recent Projects</h3>
          <div className="space-y-2">
            {data.recent.projects.length === 0 ? (
              <p className="text-xs text-zinc-500">No projects yet</p>
            ) : (
              data.recent.projects.slice(0, 5).map((project) => (
                <div key={project.id} className="text-xs">
                  <p className="font-medium text-zinc-900 truncate">{project.name}</p>
                  <p className="text-zinc-500">
                    {project.type} • {formatDate(project.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Files */}
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-900 mb-3">Recent Files</h3>
          <div className="space-y-2">
            {data.recent.files.length === 0 ? (
              <p className="text-xs text-zinc-500">No files yet</p>
            ) : (
              data.recent.files.slice(0, 5).map((file) => (
                <div key={file.id} className="text-xs">
                  <p className="font-medium text-zinc-900 truncate">{file.name}</p>
                  <p className="text-zinc-500">
                    {formatFileSize(file.size)} • {formatDate(file.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Workflows */}
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-900 mb-3">Recent Workflows</h3>
          <div className="space-y-2">
            {data.recent.workflows.length === 0 ? (
              <p className="text-xs text-zinc-500">No workflows yet</p>
            ) : (
              data.recent.workflows.slice(0, 5).map((workflow) => (
                <div key={workflow.id} className="text-xs">
                  <p className="font-medium text-zinc-900 truncate">{workflow.name}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-zinc-200 rounded-full h-1">
                      <div
                        className="bg-blue-600 h-1 rounded-full"
                        style={{ width: `${workflow.progress}%` }}
                      />
                    </div>
                    <span className="text-zinc-500">{workflow.progress}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
