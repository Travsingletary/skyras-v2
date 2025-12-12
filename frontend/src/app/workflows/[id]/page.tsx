'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface WorkflowTask {
  id: string;
  workflow_id: string;
  title: string;
  description: string;
  agent_name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  priority: number;
  dependencies: string[];
  results: Record<string, any>;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

interface Workflow {
  id: string;
  user_id: string;
  name: string;
  type: string;
  status: 'active' | 'completed' | 'cancelled';
  plan_markdown?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [tasks, setTasks] = useState<WorkflowTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [executingTaskId, setExecutingTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (!workflowId) return;

    async function fetchWorkflowDetails() {
      try {
        setLoading(true);

        // Fetch workflow
        const workflowRes = await fetch(`/api/workflows/${workflowId}`);
        const workflowData = await workflowRes.json();

        if (!workflowData.success) {
          setError(workflowData.error || 'Failed to fetch workflow');
          return;
        }

        setWorkflow(workflowData.data.workflow);

        // Fetch tasks
        const tasksRes = await fetch(`/api/workflows/${workflowId}/tasks`);
        const tasksData = await tasksRes.json();

        if (tasksData.success) {
          setTasks(tasksData.data.tasks || []);
        }
      } catch (err) {
        setError('Network error fetching workflow details');
        console.error('Error fetching workflow:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchWorkflowDetails();

    // Refresh every 3 seconds
    const interval = setInterval(fetchWorkflowDetails, 3000);
    return () => clearInterval(interval);
  }, [workflowId]);

  // Execute all pending tasks in the workflow
  const handleExecuteWorkflow = async () => {
    if (!workflowId || executing) return;

    try {
      setExecuting(true);
      setError(null);

      const res = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulate: true }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to execute workflow');
      }
    } catch (err) {
      setError('Network error executing workflow');
      console.error('Error executing workflow:', err);
    } finally {
      setExecuting(false);
    }
  };

  // Execute a single task
  const handleExecuteTask = async (taskId: string) => {
    if (executingTaskId) return;

    try {
      setExecutingTaskId(taskId);
      setError(null);

      const res = await fetch(`/api/tasks/${taskId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulate: true }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Failed to execute task');
      }
    } catch (err) {
      setError('Network error executing task');
      console.error('Error executing task:', err);
    } finally {
      setExecutingTaskId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'skipped': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'in_progress': return '⏳';
      case 'failed': return '❌';
      case 'skipped': return '⏭️';
      default: return '⏸️';
    }
  };

  const getAgentIcon = (agentName: string) => {
    if (!agentName) return '🤖';
    switch (agentName.toLowerCase()) {
      case 'cassidy': return '📋';
      case 'letitia': return '📁';
      case 'giorgio': return '🎬';
      case 'jamal': return '📢';
      default: return '🤖';
    }
  };

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
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Workflow Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'This workflow does not exist'}</p>
          <Link
            href="/workflows"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Back to Workflows
          </Link>
        </div>
      </div>
    );
  }

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    failed: tasks.filter(t => t.status === 'failed').length,
  };

  const progress = taskStats.total > 0
    ? Math.round((taskStats.completed / taskStats.total) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/workflows"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{workflow.name}</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {workflow.type.charAt(0).toUpperCase() + workflow.type.slice(1)} Workflow •
                  Created {new Date(workflow.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {taskStats.pending > 0 && workflow.status === 'active' && (
                <button
                  onClick={handleExecuteWorkflow}
                  disabled={executing}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {executing ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      Running...
                    </>
                  ) : (
                    <>
                      ▶️ Run All Tasks ({taskStats.pending})
                    </>
                  )}
                </button>
              )}
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                workflow.status === 'active' ? 'bg-blue-100 text-blue-800' :
                workflow.status === 'completed' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {workflow.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Overview */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Progress</h2>
            <span className="text-3xl font-bold text-gray-900">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{taskStats.total}</p>
              <p className="text-xs text-gray-600">Total Tasks</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{taskStats.completed}</p>
              <p className="text-xs text-gray-600">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</p>
              <p className="text-xs text-gray-600">In Progress</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{taskStats.pending}</p>
              <p className="text-xs text-gray-600">Pending</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{taskStats.failed}</p>
              <p className="text-xs text-gray-600">Failed</p>
            </div>
          </div>
        </div>

        {/* Plan Description */}
        {workflow.plan_markdown && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Workflow Plan</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              {workflow.plan_markdown}
            </div>
          </div>
        )}

        {/* Tasks List */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Tasks ({tasks.length})</h2>

          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-600">No tasks in this workflow yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks
                .sort((a, b) => a.priority - b.priority)
                .map((task, index) => (
                  <div
                    key={task.id}
                    className={`border rounded-lg p-5 ${getStatusColor(task.status)}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center font-bold text-gray-700">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-1">{task.title}</h3>
                            <p className="text-sm text-gray-700">{task.description}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {task.status === 'pending' && (
                              <button
                                onClick={() => handleExecuteTask(task.id)}
                                disabled={executingTaskId === task.id}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                              >
                                {executingTaskId === task.id ? (
                                  <>
                                    <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>
                                    Running...
                                  </>
                                ) : (
                                  <>▶️ Run</>
                                )}
                              </button>
                            )}
                            <span className="text-2xl">{getStatusIcon(task.status)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm mt-3">
                          <span className="flex items-center gap-1">
                            <span>{getAgentIcon(task.agent_name)}</span>
                            <span className="font-medium">{task.agent_name}</span>
                          </span>
                          <span className="text-gray-600">
                            Priority: <span className="font-medium">{task.priority}</span>
                          </span>
                          {task.started_at && (
                            <span className="text-gray-600">
                              Started {new Date(task.started_at).toLocaleString()}
                            </span>
                          )}
                          {task.completed_at && (
                            <span className="text-gray-600">
                              Completed {new Date(task.completed_at).toLocaleString()}
                            </span>
                          )}
                        </div>

                        {/* Results */}
                        {task.results && Object.keys(task.results).length > 0 && (
                          <div className="mt-4 p-3 bg-white rounded border border-gray-200">
                            <p className="text-xs font-semibold text-gray-600 mb-2">Results:</p>
                            <pre className="text-xs text-gray-700 overflow-auto max-h-40">
                              {JSON.stringify(task.results, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Error Message */}
                        {task.error_message && (
                          <div className="mt-4 p-3 bg-red-50 rounded border border-red-200">
                            <p className="text-xs font-semibold text-red-600 mb-1">Error:</p>
                            <p className="text-sm text-red-700">{task.error_message}</p>
                          </div>
                        )}

                        {/* Dependencies */}
                        {task.dependencies && task.dependencies.length > 0 && (
                          <div className="mt-3 text-xs text-gray-600">
                            Depends on: {task.dependencies.length} task(s)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
