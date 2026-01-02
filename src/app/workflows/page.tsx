'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWorkflowsRealtime } from '@/hooks/useWorkflowsRealtime';
import type { Workflow, WorkflowTask } from '@/types/database';

export default function WorkflowsPage() {
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      // Generate a userId if one doesn't exist
      const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('userId', newUserId);
      setUserId(newUserId);
    }
  }, []);

  // Use real-time hook instead of polling
  const { workflows, loading, error } = useWorkflowsRealtime(userId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'licensing': return '📋';
      case 'creative': return '🎨';
      case 'distribution': return '📢';
      case 'cataloging': return '📁';
      default: return '⚙️';
    }
  };

  if (loading && workflows.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workflows...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your AI-powered workflows and tasks
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/analytics"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                📊 Analytics
              </Link>
              <Link
                href="/studio"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                ← Back to Studio
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">⚠️ {error}</p>
          </div>
        )}

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Total Workflows</p>
            <p className="text-3xl font-semibold text-gray-900 mt-1">
              {workflows.length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Active</p>
            <p className="text-3xl font-semibold text-blue-600 mt-1">
              {workflows.filter(w => w.status === 'active').length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-3xl font-semibold text-green-600 mt-1">
              {workflows.filter(w => w.status === 'completed').length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Total Tasks</p>
            <p className="text-3xl font-semibold text-gray-900 mt-1">
              {workflows.reduce((sum, w) => sum + (w.tasks?.length || 0), 0)}
            </p>
          </div>
        </div>

        {/* Workflows List */}
        {workflows.length === 0 && !loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No workflows yet</h3>
            <p className="text-gray-600 mb-6">
              {userId ? (
                <>No workflows found for your account. Ask Marcus to create a workflow, or upload files in the Studio.</>
              ) : (
                <>Please start a conversation with Marcus first to get a user ID.</>
              )}
            </p>
            <div className="flex gap-3 justify-center">
              <Link
                href="/app"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Chat with Marcus
              </Link>
              <Link
                href="/studio"
                className="inline-block px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Go to Studio
              </Link>
            </div>
            {userId && (
              <p className="text-xs text-gray-500 mt-4">
                User ID: {userId}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {workflows.map((workflow) => {
              const taskStats = {
                total: workflow.tasks?.length || 0,
                completed: workflow.tasks?.filter(t => t.status === 'completed').length || 0,
                inProgress: workflow.tasks?.filter(t => t.status === 'in_progress').length || 0,
                pending: workflow.tasks?.filter(t => t.status === 'pending').length || 0,
              };
              const progress = taskStats.total > 0
                ? Math.round((taskStats.completed / taskStats.total) * 100)
                : 0;

              return (
                <Link
                  key={workflow.id}
                  href={`/workflows/${workflow.id}`}
                  className="block bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getTypeIcon(workflow.type)}</span>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {workflow.name}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(workflow.status)}`}>
                          {workflow.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Type: <span className="font-medium">{workflow.type}</span> •
                        Created {new Date(workflow.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{progress}%</p>
                      <p className="text-xs text-gray-600">complete</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{taskStats.completed} of {taskStats.total} tasks completed</span>
                      {taskStats.inProgress > 0 && (
                        <span className="text-blue-600">{taskStats.inProgress} in progress</span>
                      )}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Task Preview */}
                  {workflow.tasks && workflow.tasks.length > 0 && (
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-xs text-gray-600 mb-2">Recent Tasks:</p>
                      <div className="space-y-2">
                        {workflow.tasks.slice(0, 3).map((task) => (
                          <div key={task.id} className="flex items-center gap-2 text-sm">
                            <span className={`w-2 h-2 rounded-full ${
                              task.status === 'completed' ? 'bg-green-500' :
                              task.status === 'in_progress' ? 'bg-blue-500' :
                              task.status === 'failed' ? 'bg-red-500' :
                              'bg-gray-300'
                            }`}></span>
                            <span className="text-gray-700 flex-1 truncate">{task.title}</span>
                            <span className="text-xs text-gray-500">{task.agent_name}</span>
                          </div>
                        ))}
                        {workflow.tasks.length > 3 && (
                          <p className="text-xs text-gray-500 italic">
                            +{workflow.tasks.length - 3} more tasks
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {workflow.plan_markdown && (
                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {workflow.plan_markdown}
                      </p>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
