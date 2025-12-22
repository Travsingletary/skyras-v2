"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { uploadFilesDirect } from "@/lib/directUpload";

interface Message {
  id: string;
  role: "user" | "assistant" | "giorgio" | "jamal" | "letitia" | "cassidy";
  content: string;
  files?: Array<{ id: string; filename: string; size?: number; type?: string }>;
  agentName?: string; // For identifying which agent
}

interface ChatResponse {
  success?: boolean;
  conversationId?: string;
  assistantMessageId?: string;
  response?: string;
  error?: string;
  data?: {
    delegations?: Array<{
      agent?: string;
      to?: string;
      task: string;
      status?: string;
      result?: {
        output?: string;
        text?: string;
      };
    }>;
    notes?: Record<string, unknown>;
  };
}


export default function Home() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);

  // Debug: Log messages whenever they change
  useEffect(() => {
    console.log('[DEBUG] Messages state updated:', messages.length, 'messages:', messages);
  }, [messages]);
  const [message, setMessage] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessCode, setAccessCode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    // Check localStorage for voice preference (SSR-safe)
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem('voiceEnabled');
    return stored !== null ? stored === 'true' : true; // Default to enabled
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioQueueRef = useRef<Array<{ text: string; role: Message['role'] }>>([]);
  const isPlayingAudioRef = useRef<boolean>(false);
  const isStartingAudioRef = useRef<boolean>(false); // Track if we're starting playback

  // Access code is optional - if not set, allow access
  const requiredAccessCode = process.env.NEXT_PUBLIC_ACCESS_CODE?.trim() || "";

  // Check authentication on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem("marcus_access");
    const expectedCode = requiredAccessCode;
    
    // If no access code is required (empty or undefined), allow access immediately
    if (!expectedCode || expectedCode === "" || expectedCode === "undefined") {
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

    // HARD RULE: Use 'public' as userId until user scoping is complete
    const standardUserId = 'public';

    // Force clear old userId if it's different
    const existingUserId = localStorage.getItem("userId");
    if (existingUserId !== standardUserId) {
      console.log('[Chat] Clearing old userId:', existingUserId, '→', standardUserId);
      localStorage.removeItem("userId");
    }

    localStorage.setItem("userId", standardUserId);
    setUserId(standardUserId);

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

    const expectedCode = requiredAccessCode?.trim() || "";
    
    // If no access code is required (empty or undefined), allow access immediately
    if (!expectedCode || expectedCode === "" || expectedCode === "undefined") {
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

  // Voice input handlers using MediaRecorder + OpenAI Whisper
  const startRecording = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        // Combine audio chunks
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

        if (audioBlob.size === 0) {
          setError('No audio recorded. Please try again.');
          setIsRecording(false);
          return;
        }

        console.log(`[Voice] Recorded ${audioBlob.size} bytes, sending to transcription...`);
        setMessage('🎤 Transcribing...');

        try {
          // Send to speech-to-text API
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          const response = await fetch('/api/speech-to-text', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Transcription failed');
          }

          const data = await response.json();

          if (!data.success || !data.transcript) {
            throw new Error('No transcript returned');
          }

          const transcript = data.transcript.trim();
          console.log('[Voice] Transcription:', transcript);

          if (transcript) {
            setMessage(transcript);
            // Auto-send after transcription
            setTimeout(() => {
              handleSend(transcript);
            }, 500);
          } else {
            setError('No speech detected. Please try again.');
            setMessage('');
          }

        } catch (error) {
          console.error('[Voice] Transcription error:', error);
          setError('Failed to transcribe audio. Please try typing your message.');
          setMessage('');
        } finally {
          setIsRecording(false);
        }
      };

      mediaRecorder.onerror = (event: any) => {
        console.error('[Voice] MediaRecorder error:', event.error);
        setError('Recording failed. Please try again.');
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());
      };

      // Store reference and start recording
      recognitionRef.current = mediaRecorder as any;
      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
      setMessage('🎤 Recording...');
      console.log('[Voice] Recording started');

    } catch (error: any) {
      console.error('[Voice] Error starting recording:', error);

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setError('Microphone access denied. Please allow microphone access in your browser settings.');
      } else if (error.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.');
      } else {
        setError('Failed to start recording. Please try typing your message.');
      }

      setIsRecording(false);
      recognitionRef.current = null;
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        // Stop the MediaRecorder
        recognitionRef.current.stop();
        console.log('[Voice] Stopping recording...');
      } catch (e) {
        console.error('[Voice] Error stopping recording:', e);
        setIsRecording(false);
      }
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Clean text for TTS - remove action markers, formatting, etc.
  const cleanTextForTTS = (text: string): string => {
    if (!text) return '';
    
    let cleaned = text;
    
    // Remove action markers - be more aggressive with patterns
    cleaned = cleaned.replace(/\*[^*]+\*/g, ''); // Remove *action* or *createWorkflow*
    cleaned = cleaned.replace(/\[[^\]]+\]/g, ''); // Remove [action]
    cleaned = cleaned.replace(/<[^>]+>/g, ''); // Remove <tags>
    cleaned = cleaned.replace(/\{[^}]+\}/g, ''); // Remove {action}
    
    // Remove common action patterns (case-insensitive)
    cleaned = cleaned.replace(/\b(action|executing|running|performing|creating|updating|deleting|fetching|processing):\s*[^\n]*/gi, '');
    
    // Remove markdown formatting (but preserve content)
    cleaned = cleaned.replace(/#{1,6}\s+/g, ''); // Remove headers
    cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1'); // Remove bold, keep text
    cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1'); // Remove italic, keep text (but be careful not to remove action markers)
    cleaned = cleaned.replace(/`([^`]+)`/g, '$1'); // Remove code, keep text
    cleaned = cleaned.replace(/```[\s\S]*?```/g, ''); // Remove code blocks entirely
    
    // Remove URLs
    cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, '');
    
    // Remove JSON-like structures that might be action results
    cleaned = cleaned.replace(/\{[^{}]*"success"[^{}]*\}/g, '');
    cleaned = cleaned.replace(/\{[^{}]*"error"[^{}]*\}/g, '');
    
    // Remove extra whitespace and normalize
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n'); // Max 2 newlines
    cleaned = cleaned.replace(/[ \t]+/g, ' '); // Multiple spaces to one
    cleaned = cleaned.replace(/\s*\.\s*\.\s*\./g, '...'); // Normalize ellipsis
    cleaned = cleaned.trim();
    
    // If cleaned text is too short or empty, return empty
    if (cleaned.length < 3) {
      return '';
    }
    
    return cleaned;
  };

  // Get voice ID for each agent
  const getVoiceIdForAgent = (role: Message['role']): string => {
    // Voice IDs from ElevenLabs - using different voices for each agent
    const voiceMap: Record<string, string> = {
      'assistant': 'luNIF3trvZTxXGD2gWus', // travito - Young African-American male (Marcus)
      'giorgio': 'CwhRBWXzGAHq8TQ4Fs17', // Roger - Laid-Back, Casual, Resonant (Giorgio - Creative)
      'jamal': 'IKne3meq5aSn9XLyUdCD', // Charlie - Deep, Confident, Energetic (Jamal - Distribution)
      'letitia': 'XrExE9yKIg1WjnnlVkGX', // Matilda - Knowledgeable, Professional (Letitia - Catalog)
      'cassidy': 'EXAVITQu4vr4xnSDxMaL', // Sarah - Mature, Reassuring, Confident (Cassidy - Compliance)
    };
    return voiceMap[role] || voiceMap['assistant']; // Default to Marcus voice
  };

  // Play voice response using ElevenLabs TTS with queue management
  const playVoiceResponse = async (text: string, agentRole: Message['role'] = 'assistant') => {
    // Clean the text first
    const cleanedText = cleanTextForTTS(text);
    
    if (!cleanedText || cleanedText.trim().length === 0) {
      console.log('[Voice] No clean text to speak after filtering');
      return; // Don't try to play empty responses
    }

    // If audio is currently playing or starting, queue this new one instead of interrupting
    if ((isPlayingAudioRef.current && currentAudioRef.current) || isStartingAudioRef.current) {
      console.log('[Voice] Audio already playing or starting, queuing this message');
      audioQueueRef.current.push({ text: cleanedText, role: agentRole });
      return;
    }

    // Mark that we're starting playback
    isStartingAudioRef.current = true;

    try {
      const agentName = agentRole === 'assistant' ? 'Marcus' : agentRole.charAt(0).toUpperCase() + agentRole.slice(1);
      console.log(`[Voice] Playing TTS response for ${agentName}`);

      // Same-origin (Next) API route with cache-busting
      const response = await fetch(`/api/voice/tts?t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          text: cleanedText,
          voiceId: getVoiceIdForAgent(agentRole),
        }),
      });

      if (!response.ok) {
        // Don't log as error if it's just not configured (503) - that's expected
        if (response.status === 503) {
          console.log('[Voice] TTS not configured (ELEVENLABS_API_KEY not set). Add ELEVENLABS_API_KEY to enable voice responses.');
        } else if (response.status === 404) {
          console.log('[Voice] TTS endpoint not available');
        } else {
          console.error('[Voice] TTS failed:', response.status);
        }
        return;
      }

      // Convert response to audio blob
      const audioBlob = await response.blob();
      
      if (audioBlob.size === 0) {
        console.warn('[Voice] Received empty audio blob');
        return;
      }

      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and play audio element
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      isPlayingAudioRef.current = true;
      isStartingAudioRef.current = false; // No longer starting, now playing
      
      // Handle audio playback
      audio.onloadeddata = () => {
        console.log('[Voice] Audio loaded, playing...');
      };

      audio.onerror = (e) => {
        console.error('[Voice] Audio playback error:', e);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        isPlayingAudioRef.current = false;
        isStartingAudioRef.current = false;
        
        // Try to play next in queue even on error
        if (audioQueueRef.current.length > 0) {
          const next = audioQueueRef.current.shift();
          if (next) {
            setTimeout(() => {
              playVoiceResponse(next.text, next.role);
            }, 300);
          }
        }
      };

      audio.onended = () => {
        console.log('[Voice] Audio playback completed');
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        isPlayingAudioRef.current = false;
        
        // Play next item in queue if available
        if (audioQueueRef.current.length > 0) {
          const next = audioQueueRef.current.shift();
          if (next) {
            setTimeout(() => {
              playVoiceResponse(next.text, next.role);
            }, 300); // Small delay between speakers
          }
        }
      };

      // Play the audio
      await audio.play().catch((error) => {
        console.error('[Voice] Failed to play audio:', error);
        // User might need to interact with page first (browser autoplay policy)
        console.log('[Voice] Tip: Click anywhere on the page to enable audio playback');
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        isPlayingAudioRef.current = false;
        isStartingAudioRef.current = false;
        
        // Try to play next in queue even on play error
        if (audioQueueRef.current.length > 0) {
          const next = audioQueueRef.current.shift();
          if (next) {
            setTimeout(() => {
              playVoiceResponse(next.text, next.role);
            }, 300);
          }
        }
      });
    } catch (error) {
      console.error('[Voice] TTS error:', error);
      currentAudioRef.current = null;
      isPlayingAudioRef.current = false;
    }
  };

  const handleSend = async (overrideMessage?: string) => {
    // Use override message if provided (e.g., from voice input), otherwise use state
    const messageToSend = overrideMessage || message;
    
    if (!messageToSend.trim() && pendingFiles.length === 0) return;

    setIsLoading(true);
    setError(null);

    // Store message text and files before clearing
    const messageText = messageToSend;
    const filesToUpload = [...pendingFiles];
    
    // 1) Optimistically append user message
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: messageToSend,
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

      // 2) Upload files if any (DIRECT to Supabase - no Vercel size limits)
      const fileIds: string[] = [];
      if (filesToUpload.length > 0) {
        console.log(`[Upload] Starting direct upload of ${filesToUpload.length} file(s)...`);
        try {
          // Use direct upload to avoid Vercel function payload limits
          const { successful, failed } = await uploadFilesDirect(
            filesToUpload,
            userId,
            {
              projectId: conversationId || undefined,
              onFileComplete: (index, result) => {
                console.log(`[Upload] File ${index + 1}/${filesToUpload.length} complete:`, result?.name);
              },
            }
          );

          // Collect successful file IDs
          if (successful.length > 0) {
            fileIds.push(...successful.filter(f => f?.id).map((f) => f!.id));
            console.log(`[Upload] ${successful.length} file(s) uploaded successfully`);
          }

          // Show errors for failed uploads
          if (failed.length > 0) {
            const failedNames = failed.map((f) => f.file.name).join(', ');
            console.error(`[Upload] ${failed.length} file(s) failed:`, failed);
            setError(`Some files failed to upload: ${failedNames}`);

            // Continue anyway if at least one file succeeded
            if (successful.length === 0) {
              setIsLoading(false);
              setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
              return;
            }
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
      console.log(`[Chat] Sending message to /api/chat`);
      const chatPayload = {
        conversationId,
        userId,
        message: messageText,
        files: fileIds.map((id) => ({ fileId: id })),
      };
      console.log("[Chat] Payload:", chatPayload);

      const res = await fetch(`/api/chat`, {
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
      console.log("[Chat] Response type:", typeof data.response, "Value:", data.response);

      // 4) Update conversationId and append assistant message
      if (data.conversationId) {
        setConversationId(data.conversationId);
        // Persist conversationId to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem("conversationId", data.conversationId);
        }
      }

      // Process delegations and notes to show agent responses
      if (data.data) {
        const agentMessages: Message[] = [];
        
        // Check delegations
        if (data.data.delegations && Array.isArray(data.data.delegations)) {
          for (const delegation of data.data.delegations) {
            const agentName = (delegation.agent || delegation.to)?.toLowerCase();
            
            if (agentName && ['giorgio', 'jamal', 'letitia', 'cassidy'].includes(agentName)) {
              // Try to get output from notes
              const notes = data.data.notes || {};
              let agentOutput = '';
              
              // Check notes for agent-specific output
              const agentNote = notes[agentName];
              if (agentNote && typeof agentNote === 'object' && 'output' in agentNote) {
                agentOutput = String((agentNote as any).output || '');
              } else if (agentNote && typeof agentNote === 'object' && 'text' in agentNote) {
                agentOutput = String((agentNote as any).text || '');
              } else if (typeof agentNote === 'string') {
                agentOutput = agentNote;
              } else if (notes.creative && agentName === 'giorgio') {
                agentOutput = typeof notes.creative === 'string' ? notes.creative : JSON.stringify(notes.creative);
              } else if (notes.distribution && agentName === 'jamal') {
                agentOutput = typeof notes.distribution === 'string' ? notes.distribution : JSON.stringify(notes.distribution);
              } else if (notes.catalog && agentName === 'letitia') {
                agentOutput = typeof notes.catalog === 'string' ? notes.catalog : JSON.stringify(notes.catalog);
              } else if (notes.licensing && agentName === 'cassidy') {
                agentOutput = typeof notes.licensing === 'string' ? notes.licensing : JSON.stringify(notes.licensing);
              }
              
              // Map agent names to display names
              const displayNames: Record<string, string> = {
                'giorgio': 'Giorgio',
                'jamal': 'Jamal',
                'letitia': 'Letitia',
                'cassidy': 'Cassidy',
              };
              
              if (agentOutput) {
                agentMessages.push({
                  id: `agent_${agentName}_${Date.now()}_${Math.random()}`,
                  role: agentName as Message['role'],
                  content: agentOutput,
                  agentName: displayNames[agentName] || agentName,
                });
              } else {
                // Show delegation even without output
                agentMessages.push({
                  id: `agent_${agentName}_${Date.now()}_${Math.random()}`,
                  role: agentName as Message['role'],
                  content: `Working on: ${delegation.task}`,
                  agentName: displayNames[agentName] || agentName,
                });
              }
            }
          }
        }
        
        // Add agent messages to conversation and play their voices
        if (agentMessages.length > 0) {
          setMessages((prev) => [...prev, ...agentMessages]);
          
          // Play voices for each agent message if voice is enabled
          if (voiceEnabled) {
            // Play first message immediately, queue the rest
            if (agentMessages.length > 0) {
              playVoiceResponse(agentMessages[0].content, agentMessages[0].role);
              // Queue remaining messages
              for (let i = 1; i < agentMessages.length; i++) {
                audioQueueRef.current.push({ text: agentMessages[i].content, role: agentMessages[i].role });
              }
            }
          }
        }
      }

      // Always show Marcus's response, even if empty
      const responseText = data.response || "[No response from Marcus]";
      const assistantMessage: Message = {
        id: data.assistantMessageId || `msg_${Date.now()}`,
        role: "assistant",
        content: responseText,
        agentName: "Marcus",
      };
      console.log("[Chat] Adding Marcus message:", assistantMessage);
      setMessages((prev) => [...prev, assistantMessage]);

      // Play voice response (Marcus reads his response aloud) if enabled
      if (voiceEnabled && data.response && typeof data.response === 'string') {
        // Queue Marcus's response (will play after any agent messages)
        playVoiceResponse(data.response as string, 'assistant');
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
              {voiceEnabled && (
                <span className="text-xs text-blue-600 ml-2">🔊 Voice enabled</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/workflows"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Workflows
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Dashboard
            </Link>
            <div className="text-xs text-zinc-500 space-y-1 text-right">
              <div>API: <span className="font-mono">same-origin</span></div>
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
          {/* Debug info */}
          <div className="text-xs text-gray-400 mb-2">
            Messages in state: {messages.length} | Loading: {isLoading ? 'yes' : 'no'}
          </div>

          {messages.length === 0 && (
            <div className="text-center text-zinc-500 text-sm py-12">
              Start a conversation with Marcus...
            </div>
          )}

          {messages.map((msg) => {
            // Determine agent styling
            const getAgentStyle = (role: Message['role']) => {
              switch (role) {
                case 'user':
                  return 'bg-blue-600 text-white';
                case 'giorgio':
                  return 'bg-purple-100 border border-purple-300 text-purple-900';
                case 'jamal':
                  return 'bg-green-100 border border-green-300 text-green-900';
                case 'letitia':
                  return 'bg-pink-100 border border-pink-300 text-pink-900';
                case 'cassidy':
                  return 'bg-yellow-100 border border-yellow-300 text-yellow-900';
                case 'assistant':
                default:
                  return 'bg-white border border-zinc-200 text-zinc-900';
              }
            };

            const getAgentName = (msg: Message) => {
              if (msg.role === 'user') return null;
              if (msg.agentName) return msg.agentName;
              if (msg.role === 'assistant') return 'Marcus';
              return msg.role.charAt(0).toUpperCase() + msg.role.slice(1);
            };

            const agentName = getAgentName(msg);
            
            return (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${getAgentStyle(msg.role)}`}
              >
                {agentName && (
                  <div className="text-xs font-semibold mb-1 opacity-75">
                    {agentName}
                  </div>
                )}
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
            );
          })}
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
              onClick={() => handleSend()}
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
              onClick={handleMicClick}
              disabled={isLoading}
              className={`flex items-center justify-center w-11 h-11 rounded-lg border ${
                isRecording
                  ? 'bg-red-500 text-white border-red-600 animate-pulse'
                  : 'border-zinc-300 bg-white hover:bg-zinc-50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={isRecording ? 'Recording... Click to stop' : 'Click to record voice message'}
            >
              🎙
            </button>

            {/* Voice Toggle Button */}
            <button
              onClick={() => {
                const newValue = !voiceEnabled;
                setVoiceEnabled(newValue);
                localStorage.setItem('voiceEnabled', String(newValue));
              }}
              className={`flex items-center justify-center w-11 h-11 rounded-lg border ${
                voiceEnabled
                  ? 'bg-green-100 border-green-300 text-green-700'
                  : 'border-zinc-300 bg-white text-zinc-400'
              } hover:bg-zinc-50`}
              title={voiceEnabled ? 'Voice responses enabled (click to disable)' : 'Voice responses disabled (click to enable)'}
            >
              {voiceEnabled ? '🔊' : '🔇'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
