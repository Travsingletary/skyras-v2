"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthLoading from "@/components/AuthLoading";
import UnstuckPrompt from "@/components/UnstuckPrompt";

interface Message {
  id: string;
  content: string;
  sender: "user" | "agent";
  timestamp: Date;
}

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [nextAction, setNextAction] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Check auth state and redirect if authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/user');
        const data = await res.json();
        if (data.authenticated && data.user) {
          setIsAuthenticated(true);
          // Redirect authenticated users to start
          router.push('/start');
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('[Auth] Error checking auth state:', err);
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, [router]);

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return <AuthLoading />;
  }

  // If authenticated, the redirect will happen, but show loading just in case
  if (isAuthenticated) {
    return <AuthLoading message="Redirecting..." />;
  }

  const handleGetNextAction = async () => {
    if (!message.trim()) return;

    setLoading(true);
    setError(null);
    setShowLoginPrompt(false);

    try {
      // Append user message locally
      const userMessage: Message = {
        id: `msg_${Date.now()}`,
        content: message,
        sender: "user",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Call chat API with 'public' userId (no auth required)
      const res = await fetch('/api/chat', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          userId: 'public', // Unauthenticated public access
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      
      // Extract response from unified 'message' field (fallback to legacy)
      const actionText = data.message || data.response || data.data?.output || data.data?.message?.content || 'No response';
      setNextAction(actionText);

      // Append assistant message
      const assistantMessage: Message = {
        id: data.data?.message?.id || `msg_${Date.now()}`,
        content: actionText,
        sender: "agent",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Show login prompt after delivering action
      setShowLoginPrompt(true);

      // Clear input
      setMessage("");
    } catch (err) {
      const errorMessage = (err as Error).message;
      console.error("[Unstuck] Error:", errorMessage);
      setError(`Failed to get next action: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Unstuck Entry Point */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">
            Let's assist you in creating.
          </h1>
          <p className="text-base text-zinc-600 mb-1">
            One clear next action. No overwhelm.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Next Action Display */}
        {nextAction && (
          <div className="rounded-lg border-2 border-green-200 bg-green-50 p-6 mb-6">
            <h2 className="text-base font-semibold text-zinc-900 mb-3">Your Next Action</h2>
            <div className="bg-white rounded-lg p-4 border border-green-100">
              <p className="text-sm text-zinc-900 whitespace-pre-wrap leading-relaxed">
                {nextAction}
              </p>
            </div>
          </div>
        )}

        {/* Login Prompt (after action delivered) */}
        {showLoginPrompt && (
          <div className="mb-6">
            <UnstuckPrompt 
              onLogin={() => router.push('/signup?next=/studio')}
            />
          </div>
        )}

        {/* Conversation (last 2 messages only) */}
        {messages.length > 0 && (
          <div className="rounded-lg border bg-white p-4 mb-6 shadow-sm space-y-3">
            <div className="space-y-2">
              {messages.slice(-2).map((msg) => (
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

        {/* Input Section */}
        <div className="rounded-lg border bg-white p-6 shadow-sm space-y-4">
          <div>
            <label className="text-base font-medium text-zinc-900 block mb-2">
              What are you working on right now?
            </label>
            <textarea
              className="w-full rounded-lg border border-zinc-300 p-4 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleGetNextAction();
                }
              }}
              placeholder="Tell us what you're working on, and we'll give you one clear next step..."
            />
            <p className="mt-2 text-xs text-zinc-500">
              We focus on one step at a time so you can move forward with clarity.
            </p>
          </div>

          <button
            onClick={handleGetNextAction}
            disabled={loading || !message.trim()}
            className="w-full inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {loading ? "Getting your next action..." : "Get My Next Action"}
          </button>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-xs text-zinc-500">
            No saving, no memory, no history. Just one clear next action.
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            <button
              onClick={() => router.push('/signup?next=/studio')}
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Sign up
            </button>
            {" "}to keep your progress organized and continue in Studio.
          </p>
        </div>
      </div>

      {/* Removed marketing sections - landing page is now unstuck entry point */}
    </div>
  );
}
