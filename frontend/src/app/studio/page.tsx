"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthLoading from "@/components/AuthLoading";
import NextActionPrompt from "@/components/NextActionPrompt";

export const dynamic = 'force-dynamic';

interface ChatResponse {
  success?: boolean;
  conversationId?: string;
  data?: {
    output?: string;
    delegations?: { agent: string; task: string; status: string }[];
    notes?: Record<string, unknown>;
    message?: {
      id: string;
      content: string;
      sender: string;
      timestamp: string;
    };
  };
  error?: string;
}

interface Message {
  id: string;
  content: string;
  sender: "user" | "agent";
  timestamp: Date;
}

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  processingCount?: number;
}

interface WorkflowSuggestion {
  workflowType: string;
  title: string;
  description: string;
  agents: string[];
}

function StudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("");
  const [authChecking, setAuthChecking] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [response, setResponse] = useState<ChatResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [workflowSuggestions, setWorkflowSuggestions] = useState<WorkflowSuggestion[]>([]);
  const [plans, setPlans] = useState<Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    plan: string | null;
    summary: string | null;
    created_at: string;
  }>>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Do not use NEXT_PUBLIC_API_BASE_URL for internal Next.js API routes.
  // We always call same-origin `/api/*` in production to avoid CORS issues.
  const apiBaseUrl = "same-origin";

  // Check auth state on mount and redirect if not authenticated
  // Use window focus/visibilitychange for cross-tab logout detection (no polling)
  useEffect(() => {
    let isChecking = false; // Prevent concurrent checks

    const checkAuth = async () => {
      // Prevent concurrent auth checks
      if (isChecking) return;
      isChecking = true;

      try {
        const res = await fetch('/api/auth/user');
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
          setAuthChecking(false);
        } else {
          setUser(null);
          // Not authenticated, redirect to login with next param
          const currentPath = '/studio';
          router.push(`/login?next=${encodeURIComponent(currentPath)}`);
        }
      } catch (err) {
        console.error('[Auth] Error checking auth state:', err);
        setUser(null);
        // On error, redirect to login with next param
        const currentPath = '/studio';
        router.push(`/login?next=${encodeURIComponent(currentPath)}`);
      } finally {
        isChecking = false;
      }
    };

    // Initial auth check on mount
    checkAuth();

    // Re-check auth on window focus (catches logout from other tabs)
    const handleFocus = () => {
      checkAuth();
    };

    // Re-check auth when page becomes visible (catches logout from other tabs)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAuth();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router]);

  // Note: User identity is now derived server-side from auth session (no client-side userId needed)

  // Fetch plans on mount and when workflows might have changed
  const fetchPlans = async () => {
    try {
      setPlansLoading(true);
      // User identity is derived server-side from auth session (no userId parameter)
      const res = await fetch('/api/data/plans');
      const data = await res.json();
      
      if (data.success) {
        setPlans(data.data || []);
      } else {
        console.error('[Plans] Error:', data.error);
        // If auth required, show appropriate message
        if (data.error === 'Authentication required') {
          setError('Please sign in to view your plans');
        }
      }
    } catch (err) {
      console.error('[Plans] Fetch error:', err);
      setError('Failed to load plans');
    } finally {
      setPlansLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [user]); // Refetch plans when auth state changes

  // Show loading while checking auth
  if (authChecking) {
    return <AuthLoading />;
  }

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setUser(null);
        setPlans([]);
        setMessages([]);
        router.push('/login');
      }
    } catch (err) {
      console.error('[Auth] Logout error:', err);
    }
  };

  const isFirstRun = !plansLoading && plans.length === 0 && user;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPendingFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveUploadedFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleRunDemo = async () => {
    setDemoLoading(true);
    setError(null);

    try {
      // Trigger compliance golden path demo (quick and shows multiple agents)
      // Note: userId is derived server-side from auth session (if auth is configured)
      const res = await fetch('/api/test/golden-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: 'compliance',
          project: 'SkySky',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to run demo');
      }

      const data = await res.json();
      console.log('[Demo] Result:', data);

      // Create a workflow to track this demo (so onboarding disappears)
      try {
        // Note: userId is derived server-side from auth session
        const workflowRes = await fetch('/api/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Demo: Compliance Scan',
            type: 'licensing',
            planMarkdown: 'Initial demo workflow - compliance scan completed successfully.',
            summary: data.output || 'Compliance scan completed',
            tasks: [
              {
                title: 'Review compliance scan results',
                description: 'Compliance scan completed with demo workflow',
              },
            ],
          }),
        });

        if (workflowRes.ok) {
          console.log('[Demo] Created workflow for onboarding');
        }
      } catch (workflowErr) {
        console.warn('[Demo] Failed to create workflow (non-critical):', workflowErr);
        // Don't fail the demo if workflow creation fails
      }

      // Show success message
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}`,
          content: `✓ Demo completed! ${data.output || 'Compliance scan finished successfully.'}`,
          sender: 'agent',
          timestamp: new Date(),
        },
      ]);

      // Refresh plans to check if onboarding should be hidden
      await fetchPlans();
    } catch (err) {
      console.error('[Demo] Error:', err);
      setError(`Failed to run demo: ${(err as Error).message}`);
    } finally {
      setDemoLoading(false);
    }
  };

  const handleCreateWorkflow = async (suggestion: WorkflowSuggestion) => {
    try {
      // Note: userId is derived server-side from auth session
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: suggestion.title,
          type: suggestion.workflowType,
          planMarkdown: suggestion.description,
          tasks: [
            {
              title: `Review ${suggestion.workflowType} workflow`,
              description: suggestion.description,
            },
          ],
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to create workflow');
      }

      const data = await res.json();
      console.log('[Workflow] Created:', data);

      // Show success message
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}`,
          content: `✓ Workflow "${suggestion.title}" created successfully`,
          sender: 'agent',
          timestamp: new Date(),
        },
      ]);

      // Clear suggestion after creation
      setWorkflowSuggestions((prev) =>
        prev.filter((s) => s.workflowType !== suggestion.workflowType)
      );

      // Refresh plans to check if onboarding should be hidden
      await fetchPlans();
    } catch (err) {
      console.error('[Workflow] Error:', err);
      setError(`Failed to create workflow: ${(err as Error).message}`);
    }
  };

  const handleSend = async () => {
    if (!message.trim() && pendingFiles.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      // Append user message locally
      const userMessage: Message = {
        id: `msg_${Date.now()}`,
        content: message,
        sender: "user",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Upload files if any
      const fileIds: string[] = [];
      if (pendingFiles.length > 0) {
        console.log(`[Upload] Starting upload of ${pendingFiles.length} file(s)...`);
        try {
          const formData = new FormData();
          pendingFiles.forEach((file) => {
            formData.append("files", file);
          });
          // userId is derived server-side from auth session

          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!uploadRes.ok) {
            const uploadError = await uploadRes.text();
            throw new Error(`Upload failed: ${uploadError}`);
          }

          const uploadData = await uploadRes.json();
          console.log("[Upload] Success:", uploadData);

          // Extract file IDs for chat
          if (uploadData.success && uploadData.data?.fileIds) {
            fileIds.push(...uploadData.data.fileIds);
          } else if (uploadData.fileIds) {
            fileIds.push(...uploadData.fileIds);
          }

          // Store uploaded files data for preview
          if (uploadData.success && uploadData.data?.files) {
            setUploadedFiles((prev) => [...prev, ...uploadData.data.files]);
          }

          // Store workflow suggestions
          if (uploadData.success && uploadData.data?.workflowSuggestions) {
            setWorkflowSuggestions(uploadData.data.workflowSuggestions);
          }
        } catch (uploadErr) {
          console.error("[Upload] Error:", uploadErr);
          setError(`File upload failed: ${(uploadErr as Error).message}`);
          setLoading(false);
          return;
        }
      }

      // Send chat message to Next.js API route
      console.log('[Chat] Sending message to /api/chat');
      console.log("[Chat] Payload:", {
        conversationId,
        message,
        files: fileIds.map((id) => ({ fileId: id })),
      });

      // Note: userId is derived server-side from auth session
      const res = await fetch('/api/chat', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          message,
          files: fileIds.map((id) => ({ fileId: id })),
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = (await res.json()) as ChatResponse;
      console.log("[Chat] Response:", data);

      setResponse(data);

      // Update conversationId if returned
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      // Append assistant message if present
      if (data.data?.message) {
        const assistantMessage: Message = {
          id: data.data.message.id || `msg_${Date.now()}`,
          content: data.data.message.content,
          sender: "agent",
          timestamp: new Date(data.data.message.timestamp || Date.now()),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }

      // Clear pending files after successful send
      setPendingFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Clear input
      setMessage("");

      // Refresh plans in case a workflow was created
      await fetchPlans();
    } catch (err) {
      const errorMessage = (err as Error).message;
      console.error("[Chat] Error:", errorMessage);
      setError(`Connection error: ${errorMessage}`);
      setResponse({ success: false, error: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-6 text-zinc-900">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">SkyRas Studio</h1>
            <p className="text-sm text-zinc-600">
              One clear next action. No overwhelm.
            </p>
          </div>
          <div className="flex gap-3">
            {user ? (
              <>
                <span className="text-sm text-zinc-600 self-center">
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
            {/* Workflows and Analytics - HIDDEN in Phase 1 (organization/inspiration layered after clarity) */}
            {/* <Link
              href="/workflows"
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 transition-colors"
            >
              📋 Workflows
            </Link>
            <Link
              href="/analytics"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              📊 Analytics
            </Link> */}
          </div>
        </header>

        {/* Next Action Prompt - Show when no active plan or first run */}
        {(!plansLoading && plans.length === 0) && (
          <NextActionPrompt 
            onStartAction={() => {
              // Focus on the message input to guide user
              const textarea = document.querySelector('textarea');
              if (textarea) {
                textarea.focus();
              }
            }}
            loading={false}
            hasWorkflows={plans.length > 0}
          />
        )}

        {/* Connection Status - HIDDEN in Phase 1 (technical details not needed for clarity) */}

        {/* Error Display */}
        {error && (
          <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-red-800">Connection Error</h3>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
            <p className="mt-2 text-sm text-red-700 font-mono">{error}</p>
          </div>
        )}

        {/* Uploaded Files Preview - HIDDEN in Phase 1 (file complexity removed for clarity) */}

        {/* Workflow Suggestions - HIDDEN in Phase 1 (clarity first) */}
        {/* {workflowSuggestions.length > 0 && (
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <WorkflowSuggestions
              suggestions={workflowSuggestions}
              onCreateWorkflow={handleCreateWorkflow}
            />
          </div>
        )} */}

        {/* Messages List - Simplified: Show only recent conversation */}
        {messages.length > 0 && (
          <div className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
            <h2 className="text-base font-semibold">Conversation</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {messages.slice(-4).map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-lg p-3 ${
                    msg.sender === "user" ? "bg-blue-50" : "bg-zinc-50"
                  }`}
                >
                  <p className="text-sm text-zinc-900 whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Input - Simplified for Phase 1 */}
        <div className="rounded-lg border bg-white p-6 shadow-sm space-y-4">
          <div>
            <label className="text-base font-medium text-zinc-900 block mb-2">
              What do you need help with?
            </label>
            <textarea
              className="w-full rounded-lg border border-zinc-300 p-4 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleSend();
                }
              }}
              placeholder="Tell us what you're working on, and we'll give you one clear next step..."
            />
          </div>

          {/* File Upload - HIDDEN in Phase 1 (clarity first) */}
          {/* <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-input"
            />
            <label
              htmlFor="file-input"
              className="inline-flex items-center rounded border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 cursor-pointer"
            >
              📎 Attach Files
            </label>
          </div> */}

          <button
            onClick={handleSend}
            disabled={loading || !message.trim()}
            className="w-full inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading ? "Getting your next action..." : "Get My Next Action"}
          </button>
        </div>

        {/* Response Display - Simplified: Focus on next action */}
        {response && response.data?.output && (
          <div className="rounded-lg border-2 border-green-200 bg-green-50 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-zinc-900 mb-3">Your Next Action</h2>
            <div className="bg-white rounded-lg p-4 border border-green-100">
              <p className="text-sm text-zinc-900 whitespace-pre-wrap leading-relaxed">
                {response.data.output}
              </p>
            </div>
          </div>
        )}

        {/* Error Display - Simplified */}
        {response && response.error && (
          <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 shadow-sm">
            <p className="text-sm text-red-700">{response.error}</p>
          </div>
        )}

        {/* Technical Details - HIDDEN in Phase 1 (notes, delegations, etc.) */}
        {/* {response && response.data?.notes && (
          <details className="text-sm" open>
            <summary className="cursor-pointer font-semibold">Notes</summary>
            <pre className="mt-2 whitespace-pre-wrap text-xs text-zinc-700">{JSON.stringify(response.data.notes, null, 2)}</pre>
          </details>
        )} */}

        {/* Next Action Display - Show only the most recent/active plan */}
        {!plansLoading && plans.length > 0 && (
          <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold text-zinc-900 mb-1">Your Next Action</h3>
                <p className="text-sm text-zinc-600">Here's what to do next:</p>
              </div>
            </div>
            {(() => {
              // Show the most recent active plan, or most recent if none active
              const activePlan = plans.find(p => p.status === 'active') || plans[0];
              return (
                <div className="bg-white rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-sm font-medium text-zinc-900">{activePlan.name}</h4>
                    {activePlan.status === 'active' && (
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                        Active
                      </span>
                    )}
                  </div>
                  {activePlan.summary && (
                    <p className="text-sm text-zinc-700 mb-2">{activePlan.summary}</p>
                  )}
                  {activePlan.plan && (
                    <p className="text-sm text-zinc-700 whitespace-pre-wrap">
                      {activePlan.plan.length > 500 ? `${activePlan.plan.substring(0, 500)}...` : activePlan.plan}
                    </p>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Plans List - HIDDEN in Phase 1 (show only next action, not full list) */}
        {/* {!plansLoading && plans.length > 1 && (
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold mb-3">All Plans</h3>
            <div className="space-y-2">
              {plans.slice(1).map((plan) => (
                <div key={plan.id} className="rounded border border-zinc-200 p-3">
                  <h4 className="text-sm font-medium text-zinc-900">{plan.name}</h4>
                </div>
              ))}
            </div>
          </div>
        )} */}

        {/* Test URLs and Tips - HIDDEN in Phase 1 (exploration features) */}
        {/* <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold">Test URLs</h3>
            ...
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold">Tips</h3>
            ...
          </div>
        </div> */}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <StudioContent />
    </Suspense>
  );
}
