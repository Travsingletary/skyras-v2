"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  files?: Array<{ id: string; filename: string; size?: number; type?: string }>;
}

interface ChatResponse {
  success?: boolean;
  conversationId?: string;
  assistantMessageId?: string;
  response?: string;
  error?: string;
}

interface UploadResponse {
  success?: boolean;
  files?: Array<{ id: string; filename: string; size?: number; type?: string }>;
  error?: string;
}

export default function Home() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessCode, setAccessCode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
  const requiredAccessCode = process.env.NEXT_PUBLIC_ACCESS_CODE || "";

  // Check authentication on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem("marcus_access");
    const expectedCode = requiredAccessCode;
    
    // If no access code is required, allow access
    if (!expectedCode || expectedCode === "") {
      setIsAuthenticated(true);
      return;
    }

    // Check if user is already authenticated
    if (storedAuth === expectedCode) {
      setIsAuthenticated(true);
    }
  }, [requiredAccessCode]);

  // Initialize userId and conversationId from localStorage
  useEffect(() => {
    if (!isAuthenticated) return;
    
    let storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      storedUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("userId", storedUserId);
    }
    setUserId(storedUserId);

    // Load conversationId from localStorage
    const storedConversationId = localStorage.getItem("conversationId");
    if (storedConversationId) {
      setConversationId(storedConversationId);
    }
  }, [isAuthenticated]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAccessCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAccessError(null);

    const expectedCode = requiredAccessCode;
    
    // If no access code is required, allow access
    if (!expectedCode || expectedCode === "") {
      setIsAuthenticated(true);
      return;
    }

    if (accessCode === expectedCode) {
      localStorage.setItem("marcus_access", accessCode);
      setIsAuthenticated(true);
    } else {
      setAccessError("Incorrect access code. Please try again.");
      setAccessCode("");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPendingFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Play voice response using ElevenLabs TTS
  const playVoiceResponse = async (text: string) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/voice/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text, voiceId: 'EXAVITQu4vr4xnSDxMaL' })
      });

      if (!response.ok) {
        console.warn('Voice playback not available');
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      await audio.play();
      audio.onended = () => URL.revokeObjectURL(audioUrl);
    } catch (error) {
      console.warn('Voice playback error:', error);
    }
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setMessage(transcript);
          setVoiceStatus(null);
          setIsRecording(false);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setVoiceStatus('Speech recognition failed. Please type your message.');
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.start();
        recognitionRef.current = recognition;
        setIsRecording(true);
        setVoiceStatus('Listening...');
      } else {
        setVoiceStatus('Voice input not supported in this browser.');
        setTimeout(() => setVoiceStatus(null), 3000);
      }
    } catch (error) {
      console.error('Microphone access error:', error);
      setVoiceStatus('Microphone access denied');
      setIsRecording(false);
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setVoiceStatus(null);
  };

  const handleSend = async () => {
    if (!message.trim() && pendingFiles.length === 0) return;

    setIsLoading(true);
    setError(null);

    // Store message text and files before clearing
    const messageText = message;
    const filesToUpload = [...pendingFiles];
    
    // 1) Optimistically append user message
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: message,
      files: pendingFiles.map((f) => ({
        id: `pending_${f.name}`,
        filename: f.name,
        size: f.size,
        type: f.type,
      })),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {

      // Clear input immediately
      setMessage("");
      setPendingFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // 2) Upload files if any
      const fileIds: string[] = [];
      if (filesToUpload.length > 0) {
        console.log(`[Upload] Starting upload of ${filesToUpload.length} file(s)...`);
        try {
          const formData = new FormData();
          filesToUpload.forEach((file) => {
            formData.append("files", file);
          });
          formData.append("userId", userId);
          if (conversationId) {
            formData.append("conversationId", conversationId);
          }

          const uploadRes = await fetch(`${apiBaseUrl}/api/upload`, {
            method: "POST",
            body: formData,
          });

          if (!uploadRes.ok) {
            const uploadError = await uploadRes.text();
            throw new Error(`Upload failed: ${uploadError}`);
          }

          const uploadData = (await uploadRes.json()) as UploadResponse;
          console.log("[Upload] Success:", uploadData);

          if (uploadData.files && uploadData.files.length > 0) {
            fileIds.push(...uploadData.files.map((f) => f.id));
          } else if (uploadData.success && (uploadData as any).data?.files) {
            fileIds.push(...(uploadData as any).data.files.map((f: any) => f.id));
          }
        } catch (uploadErr) {
          console.error("[Upload Error]:", uploadErr);
          setError(`File upload failed: ${(uploadErr as Error).message}`);
          setIsLoading(false);
          // Remove the optimistic message on error
          setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
          return;
        }
      }

      // 3) POST to /api/chat
      console.log(`[Chat] Sending message to ${apiBaseUrl}/api/chat`);
      const chatPayload = {
        conversationId,
        userId,
        message: messageText,
        files: fileIds.map((id) => ({ fileId: id })),
      };
      console.log("[Chat] Payload:", chatPayload);

      const res = await fetch(`${apiBaseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chatPayload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = (await res.json()) as ChatResponse;
      console.log("[Chat] Response:", data);

      // 4) Update conversationId and append assistant message
      if (data.conversationId) {
        setConversationId(data.conversationId);
        // Persist conversationId to localStorage
        localStorage.setItem("conversationId", data.conversationId);
      }

      if (data.response) {
        const assistantMessage: Message = {
          id: data.assistantMessageId || `msg_${Date.now()}`,
          role: "assistant",
          content: data.response,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        
        // Play voice response
        playVoiceResponse(data.response);
      }

      // Update user message with actual file IDs
      if (fileIds.length > 0) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === userMessage.id
              ? {
                  ...m,
                  files: fileIds.map((id) => {
                    const file = filesToUpload.find((f, idx) => idx < fileIds.length);
                    return {
                      id,
                      filename: file?.name || "file",
                      size: file?.size,
                      type: file?.type,
                    };
                  }),
                }
              : m
          )
        );
      }
    } catch (err) {
      const errorMessage = (err as Error).message;
      console.error("[Chat Error]:", errorMessage);
      setError(`Chat failed. Check backend. ${errorMessage}`);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  // Access Code Gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-lg border border-zinc-200 shadow-sm p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-zinc-900 mb-2">Marcus · SkyRas PM</h1>
            <p className="text-sm text-zinc-600">
              Enter the access code to continue
            </p>
          </div>

          <form onSubmit={handleAccessCodeSubmit} className="space-y-4">
            <div>
              <label htmlFor="access-code" className="block text-sm font-medium text-zinc-700 mb-2">
                Access Code
              </label>
              <input
                id="access-code"
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Enter access code"
                className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              {accessError && (
                <p className="mt-2 text-sm text-red-600">{accessError}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Continue
            </button>
          </form>

          <p className="mt-6 text-xs text-center text-zinc-500">
            This is a private beta. Contact the administrator for access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Marcus · SkyRas PM</h1>
            <p className="text-xs text-zinc-600 mt-1">
              Talk to Marcus. He'll route your request to the right agents.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Dashboard
            </Link>
            <div className="text-xs text-zinc-500 space-y-1 text-right">
              <div>API: <span className="font-mono">{apiBaseUrl}</span></div>
              <div>User: <span className="font-mono">{userId || "loading..."}</span></div>
            </div>
          </div>
        </div>
      </header>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mt-4 rounded">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-700 font-mono">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 text-xl leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-zinc-500 text-sm py-12">
              Start a conversation with Marcus...
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-zinc-200 text-zinc-900"
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">
                  {msg.content.split('\n').map((line, idx) => {
                    // Simple markdown rendering
                    if (line.startsWith('## ')) {
                      return <h2 key={idx} className="font-semibold text-base mt-4 mb-2">{line.replace('## ', '')}</h2>;
                    } else if (line.startsWith('### ')) {
                      return <h3 key={idx} className="font-semibold text-sm mt-3 mb-1">{line.replace('### ', '')}</h3>;
                    } else if (line.startsWith('**') && line.endsWith('**')) {
                      return <strong key={idx} className="font-semibold">{line.replace(/\*\*/g, '')}</strong>;
                    } else if (line.startsWith('  • ') || line.startsWith('- ')) {
                      return <div key={idx} className="ml-4">{line}</div>;
                    } else if (line.trim() === '') {
                      return <br key={idx} />;
                    }
                    return <p key={idx}>{line}</p>;
                  })}
                </div>
                {msg.files && msg.files.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-opacity-20">
                    <div className="text-xs opacity-80">
                      {msg.files.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-1 mt-1">
                          <span>📎</span>
                          <span>{file.filename}</span>
                          {file.size && (
                            <span className="opacity-60">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t bg-white px-6 py-4">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Pending Files */}
          {pendingFiles.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {pendingFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-zinc-100 rounded px-2 py-1 text-xs"
                >
                  <span>📎 {file.name}</span>
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

          {/* Input Row */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type your message..."
                rows={1}
                className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ minHeight: "44px", maxHeight: "120px" }}
              />
            </div>

            {/* File Input */}
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
              className="flex items-center justify-center w-11 h-11 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 cursor-pointer"
              title="Attach files"
            >
              📎
            </label>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={isLoading || (!message.trim() && pendingFiles.length === 0)}
              className="flex items-center justify-center w-11 h-11 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Send message"
            >
              {isLoading ? (
                <span className="text-xs">...</span>
              ) : (
                <span>➤</span>
              )}
            </button>

            {/* Mic Button */}
            <button
              type="button"
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              onTouchStart={(e) => {
                e.preventDefault();
                startRecording();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                stopRecording();
              }}
              className={`flex items-center justify-center w-11 h-11 rounded-lg border transition-colors ${
                isRecording
                  ? 'bg-red-500 text-white border-red-500'
                  : 'border-zinc-300 bg-white hover:bg-zinc-50'
              }`}
              title={isRecording ? 'Recording... Release to stop' : 'Hold to record voice message'}
            >
              🎙️
            </button>
          </div>
          
          {/* Voice Status */}
          {voiceStatus && (
            <div className="text-xs text-zinc-500 mt-2">{voiceStatus}</div>
          )}
        </div>
      </div>
    </div>
  );
}
