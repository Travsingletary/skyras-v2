"use client";

import { useState, useEffect, useRef } from "react";

export const dynamic = 'force-dynamic';

interface ChatResponse {
  success?: boolean;
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

export default function Home() {
  const [message, setMessage] = useState("Run a creative concept for SkySky");
  const [messages, setMessages] = useState<Message[]>([]);
  const [response, setResponse] = useState<ChatResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize userId from localStorage
  useEffect(() => {
    let storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      storedUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("userId", storedUserId);
    }
    setUserId(storedUserId);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPendingFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
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
          formData.append("userId", userId);

          // File upload disabled - requires backend integration
          console.warn('[Upload] File upload disabled');
          throw new Error('File upload not implemented');

          if (!uploadRes.ok) {
            const uploadError = await uploadRes.text();
            throw new Error(`Upload failed: ${uploadError}`);
          }

          const uploadData = await uploadRes.json();
          console.log("[Upload] Success:", uploadData);

          if (uploadData.success && uploadData.data?.fileIds) {
            fileIds.push(...uploadData.data.fileIds);
          } else if (uploadData.fileIds) {
            fileIds.push(...uploadData.fileIds);
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
        userId,
        message,
        files: fileIds.map((id) => ({ fileId: id })),
      });

      const res = await fetch('/api/chat', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          userId,
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
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">SkyRas v2 · Agent Console</h1>
          <p className="text-sm text-zinc-600">
            Marcus will delegate to Giorgio (creative), Cassidy (compliance), Jamal (distribution), and Letitia (cataloging)
            based on your request.
          </p>
        </header>

        {/* Connection Status */}
        <div className="rounded-lg border bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-600">
              API: <span className="font-mono text-zinc-900">{apiBaseUrl}</span>
            </span>
            <span className="text-zinc-600">
              User ID: <span className="font-mono text-zinc-900">{userId || "loading..."}</span>
            </span>
          </div>
        </div>

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

        {/* Messages List */}
        {messages.length > 0 && (
          <div className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
            <h2 className="text-lg font-semibold">Messages</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded p-3 ${
                    msg.sender === "user" ? "bg-blue-50 ml-8" : "bg-zinc-50 mr-8"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-zinc-600">
                      {msg.sender === "user" ? "You" : "Assistant"}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {msg.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-900 whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Input */}
        <div className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
          <label className="text-sm font-medium text-zinc-700">Message to Marcus</label>
          <textarea
            className="w-full rounded border border-zinc-200 p-2 text-sm"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                handleSend();
              }
            }}
            placeholder="Type your message... (Cmd/Ctrl+Enter to send)"
          />

          {/* File Upload */}
          <div className="space-y-2">
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

            {/* Pending Files */}
            {pendingFiles.length > 0 && (
              <div className="mt-2 space-y-1">
                {pendingFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded bg-zinc-50 px-2 py-1 text-xs"
                  >
                    <span className="text-zinc-700">{file.name}</span>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleSend}
            disabled={loading || (!message.trim() && pendingFiles.length === 0)}
            className="inline-flex items-center rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>

        {response && (
          <div className="rounded-lg border bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Response</h2>
              <span className={`text-xs px-2 py-1 rounded ${response.success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {response.success ? "success" : "error"}
              </span>
            </div>
            {response.error && <p className="text-sm text-red-600">{response.error}</p>}
            {response.data?.output && <pre className="whitespace-pre-wrap text-sm text-zinc-800">{response.data.output}</pre>}

            {response.data?.delegations && response.data.delegations.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold">Delegations</h3>
                <ul className="mt-1 space-y-1 text-sm text-zinc-700">
                  {response.data.delegations.map((d, idx) => (
                    <li key={idx} className="rounded border border-zinc-200 px-2 py-1">
                      <span className="font-medium">{d.agent}</span>: {d.task} ({d.status})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {response.data?.notes && (
              <details className="text-sm" open>
                <summary className="cursor-pointer font-semibold">Notes</summary>
                <pre className="mt-2 whitespace-pre-wrap text-xs text-zinc-700">{JSON.stringify(response.data.notes, null, 2)}</pre>
              </details>
            )}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold">Test URLs</h3>
            <ul className="mt-2 space-y-1 text-sm text-blue-700">
              <li><a href="/api/test/marcus">/api/test/marcus</a></li>
              <li><a href="/api/agents/compliance/scan">/api/agents/compliance/scan</a></li>
              <li><a href="/api/agents/giorgio/test">/api/agents/giorgio/test</a></li>
              <li><a href="/api/agents/jamal/test">/api/agents/jamal/test</a></li>
              <li><a href="/api/agents/letitia/test">/api/agents/letitia/test</a></li>
            </ul>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold">Tips</h3>
            <ul className="mt-2 space-y-1 text-sm text-zinc-700">
              <li>Include project + files to trigger Cassidy for licensing.</li>
              <li>Use creative keywords (idea, script, prompt) to trigger Giorgio.</li>
              <li>Mention posting/schedule/rollout to trigger Jamal.</li>
              <li>Send asset name/tags to trigger Letitia cataloging.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
