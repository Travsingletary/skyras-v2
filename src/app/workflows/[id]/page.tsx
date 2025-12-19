/**
 * Workflow Detail Page
 *
 * Shows a single workflow with real-time task updates grouped by agent.
 * Displays live status changes as agents work on tasks.
 */

'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useWorkflowRealtime } from '@/hooks/useWorkflowRealtime';
import AgentTaskGroups from '@/components/AgentTaskGroups';

export default function WorkflowDetailPage() {
  const params = useParams();
  const workflowId = params?.id as string;

  const { workflow, loading, error } = useWorkflowRealtime(workflowId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workflow...</p>
        </div>
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error || 'Workflow not found'}</p>
          <Link
            href="/workflows"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
          >
            Back to Workflows
          </Link>
        </div>
      </div>
    );
  }

  const progress =
    workflow.total_tasks > 0
      ? Math.round((workflow.completed_tasks / workflow.total_tasks) * 100)
      : 0;

  const tasks = workflow.tasks || [];
  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    failed: tasks.filter((t) => t.status === 'failed').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Link href="/workflows" className="text-gray-600 hover:text-gray-900">
                  ← Back
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">{workflow.name}</h1>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    workflow.status === 'active'
                      ? 'bg-blue-100 text-blue-800'
                      : workflow.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {workflow.status}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Type: {workflow.type} • Created by {workflow.agent_name || 'marcus'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">{progress}%</p>
              <p className="text-xs text-gray-600">complete</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-600">Total Tasks</p>
            <p className="text-2xl font-semibold">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-semibold text-green-600">{stats.completed}</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-600">In Progress</p>
            <p className="text-2xl font-semibold text-blue-600">{stats.inProgress}</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-semibold text-gray-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-600">Failed</p>
            <p className="text-2xl font-semibold text-red-600">{stats.failed}</p>
          </div>
        </div>

        {/* Real-time indicator */}
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span>Real-time updates active</span>
        </div>

        {/* Agent Task Groups */}
        {tasks.length > 0 ? (
          <AgentTaskGroups tasks={tasks} />
        ) : (
          <div className="bg-white rounded-lg border p-12 text-center">
            <p className="text-gray-600">No tasks yet in this workflow</p>
          </div>
        )}
      </main>
    </div>
  );
}
