"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

interface Workflow {
  id: string;
  title: string;
  workflow: {
    name: string;
    weeklyStructure: Array<{
      day: string;
      tasks: string[];
      time: string;
      priority: string;
    }>;
    taskBreakdown: Array<{
      category: string;
      tasks: Array<{
        task: string;
        time: string;
        platforms?: string[];
        priority: string;
      }>;
    }>;
  };
  created_at: string;
  updated_at: string;
}

export default function Dashboard() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    // SSR-safe: Only access localStorage in browser
    if (typeof window === 'undefined') return;

    // Get userId from localStorage
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      setError("No user ID found. Please start a conversation with Marcus first.");
      setLoading(false);
      return;
    }
    setUserId(storedUserId);

    // Fetch workflows
    const fetchWorkflows = async () => {
      try {
        const res = await fetch(`/api/workflows?userId=${storedUserId}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${await res.text()}`);
        }
        const data = await res.json();
        if (data.success) {
          setWorkflows(data.workflows || []);
        } else {
          throw new Error(data.error || "Failed to fetch workflows");
        }
      } catch (err) {
        console.error("Error fetching workflows:", err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflows();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-zinc-600">Loading workflows...</p>
        </div>
      </div>
    );
  }

  if (error && workflows.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/login?next=/studio"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-6 inline-block"
          >
            ← Back to Marcus
          </Link>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-900 mb-2">Error</h2>
            <p className="text-red-700">{error}</p>
            <Link
              href="/login?next=/studio"
              className="mt-4 inline-block text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Start a conversation with Marcus to create your first workflow →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 mb-2">Your Workflows</h1>
            <p className="text-zinc-600">View and manage your saved workflows</p>
          </div>
          <Link
            href="/login?next=/studio"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Chat with Marcus
          </Link>
        </div>

        {workflows.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center border border-zinc-200">
            <p className="text-zinc-600 mb-4">You don't have any workflows yet.</p>
            <Link
              href="/login?next=/studio"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Workflow
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="bg-white rounded-lg p-6 shadow-sm border border-zinc-200 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedWorkflow(workflow)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900">
                      {workflow.workflow?.name || workflow.title || "Untitled Workflow"}
                    </h3>
                    <p className="text-sm text-zinc-500 mt-1">
                      Created {new Date(workflow.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {workflow.workflow?.weeklyStructure && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-zinc-700 uppercase tracking-wide">
                      Weekly Structure
                    </p>
                    <div className="space-y-1">
                      {workflow.workflow.weeklyStructure.slice(0, 3).map((day, idx) => (
                        <div key={idx} className="text-sm text-zinc-600">
                          <span className="font-medium">{day.day}:</span> {day.tasks.slice(0, 2).join(", ")}
                          {day.tasks.length > 2 && "..."}
                        </div>
                      ))}
                      {workflow.workflow.weeklyStructure.length > 3 && (
                        <div className="text-sm text-zinc-500">
                          +{workflow.workflow.weeklyStructure.length - 3} more days
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <button
                  className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedWorkflow(workflow);
                  }}
                >
                  View Details →
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Workflow Detail Modal */}
        {selectedWorkflow && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50"
            onClick={() => setSelectedWorkflow(null)}
          >
            <div
              className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900">
                    {selectedWorkflow.workflow?.name || selectedWorkflow.title}
                  </h2>
                  <p className="text-sm text-zinc-500 mt-1">
                    Created {new Date(selectedWorkflow.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedWorkflow(null)}
                  className="text-zinc-400 hover:text-zinc-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {selectedWorkflow.workflow?.weeklyStructure && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-zinc-900 mb-4">Weekly Structure</h3>
                  <div className="space-y-4">
                    {selectedWorkflow.workflow.weeklyStructure.map((day, idx) => (
                      <div key={idx} className="border-l-4 border-blue-500 pl-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-zinc-900">{day.day}</h4>
                          <div className="flex gap-2 text-xs">
                            <span className="bg-zinc-100 text-zinc-700 px-2 py-1 rounded">
                              {day.time}
                            </span>
                            <span
                              className={`px-2 py-1 rounded ${
                                day.priority === "must-do"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {day.priority}
                            </span>
                          </div>
                        </div>
                        <ul className="space-y-1">
                          {day.tasks.map((task, taskIdx) => (
                            <li key={taskIdx} className="text-sm text-zinc-700">
                              • {task}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedWorkflow.workflow?.taskBreakdown && (
                <div>
                  <h3 className="text-xl font-semibold text-zinc-900 mb-4">Task Breakdown</h3>
                  <div className="space-y-6">
                    {selectedWorkflow.workflow.taskBreakdown.map((category, idx) => (
                      <div key={idx}>
                        <h4 className="font-semibold text-zinc-900 mb-3">{category.category}</h4>
                        <div className="space-y-2">
                          {category.tasks.map((task, taskIdx) => (
                            <div
                              key={taskIdx}
                              className="bg-zinc-50 rounded p-3 border border-zinc-200"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-zinc-900 text-sm">
                                    {task.task}
                                  </p>
                                  {task.platforms && task.platforms.length > 0 && (
                                    <p className="text-xs text-zinc-500 mt-1">
                                      Platforms: {Array.isArray(task.platforms) ? task.platforms.join(", ") : task.platforms}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-2 text-xs ml-4">
                                  <span className="bg-zinc-100 text-zinc-700 px-2 py-1 rounded">
                                    {task.time}
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded ${
                                      task.priority === "must-do"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-blue-100 text-blue-700"
                                    }`}
                                  >
                                    {task.priority}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-zinc-200">
                <Link
                  href="/login?next=/studio"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Chat with Marcus to Adjust This Workflow
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

