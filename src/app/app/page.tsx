"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowserClient";

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
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioQueueRef = useRef<Array<{ text: string; role: Message['role'] }>>([]);
  const isPlayingAudioRef = useRef<boolean>(false);
  const isStartingAudioRef = useRef<boolean>(false); // Track if we're starting playback
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fullTranscriptRef = useRef<string>('');
  const hasSentRef = useRef<boolean>(false); // Track if we've already sent the message

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

  // Load voice preference from localStorage (client-only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("voiceEnabled");
      if (stored !== null) setVoiceEnabled(stored === "true");
    } catch {
      // Ignore: localStorage may be unavailable in some environments
    }
  }, []);

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

  // Voice input handlers using Web Speech API
  const startRecording = () => {
    try {
      // Stop any existing recognition first
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors when stopping
        }
        recognitionRef.current = null;
      }

      // Check if browser supports speech recognition
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      
      if (!SpeechRecognition) {
        setError('Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true; // Keep listening until stopped
      recognition.interimResults = true; // Show results as you speak
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1; // Only get the best result

      const SILENCE_DELAY = 2000; // Send after 2 seconds of silence

      recognition.onstart = () => {
        setIsRecording(true);
        setError(null);
        fullTranscriptRef.current = '';
      };

      recognition.onresult = (event: any) => {
        // Accumulate all results
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        // Update full transcript with final results
        if (finalTranscript) {
          fullTranscriptRef.current += finalTranscript;
          console.log('[Voice] Final transcript:', fullTranscriptRef.current.trim());
        }

        // Show combined transcript in input field (final + interim)
        const displayText = (fullTranscriptRef.current + interimTranscript).trim();
        if (displayText) {
          setMessage(displayText);
        }

        // Clear existing timeout
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }

        // If we have final results, set a timeout to send after silence
        if (finalTranscript.trim() && !hasSentRef.current) {
          silenceTimeoutRef.current = setTimeout(() => {
            const textToSend = fullTranscriptRef.current.trim();
            if (textToSend && !hasSentRef.current) {
              hasSentRef.current = true; // Mark as sent
              console.log('[Voice] Auto-sending after silence:', textToSend);
              stopRecording(); // Stop recording first
              setTimeout(() => {
                handleSend(textToSend);
              }, 200);
            }
            silenceTimeoutRef.current = null;
          }, SILENCE_DELAY);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('[Voice] Speech recognition error:', event.error);
        
        // Clear timeout on error
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
        
        setIsRecording(false);
        
        if (event.error === 'no-speech') {
          // If we have a transcript, send it; otherwise show error
          if (fullTranscriptRef.current.trim() && !hasSentRef.current) {
            hasSentRef.current = true; // Mark as sent
            console.log('[Voice] No more speech, sending transcript:', fullTranscriptRef.current.trim());
            stopRecording();
            setTimeout(() => {
              handleSend(fullTranscriptRef.current.trim());
            }, 200);
          } else if (!fullTranscriptRef.current.trim()) {
            setError('No speech detected. Please try again.');
          }
        } else if (event.error === 'not-allowed') {
          setError('Microphone access denied. Please allow microphone access in your browser settings.');
        } else if (event.error === 'aborted') {
          // User stopped it, don't show error
          setIsRecording(false);
        } else {
          setError('Speech recognition failed. Please try typing your message.');
        }
      };

      recognition.onend = () => {
        // Clear timeout when recognition ends
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
        
        setIsRecording(false);
        const transcriptToSend = fullTranscriptRef.current.trim();
        recognitionRef.current = null;
        
        // Only send if we haven't already sent (prevents duplicate sends)
        // This handles the case where user manually stops recording
        if (transcriptToSend && !hasSentRef.current) {
          hasSentRef.current = true; // Mark as sent
          console.log('[Voice] Recording ended, sending transcript:', transcriptToSend);
          setTimeout(() => {
            handleSend(transcriptToSend);
          }, 200);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error('[Voice] Error starting recognition:', error);
      setError('Failed to start voice input. Please try typing your message.');
      setIsRecording(false);
      recognitionRef.current = null;
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      // Clear any pending timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      
      try {
        // Stop the recognition
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore errors when stopping
      }
      // Don't set recognitionRef.current to null here - let onend handle it
      // This way onend can check if we have a transcript to send
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

      // 2) Upload files if any
      const fileIds: string[] = [];
      if (filesToUpload.length > 0) {
        console.log(`[Upload] Starting upload of ${filesToUpload.length} file(s)...`);
        try {
          // Direct-to-storage upload (avoids Vercel FUNCTION_PAYLOAD_TOO_LARGE)
          const supabase = getSupabaseBrowserClient();

          const initFiles = filesToUpload.map((file, idx) => ({
            clientId: `${Date.now()}_${idx}_${file.name}`,
            name: file.name,
            size: file.size,
            type: file.type || null,
          }));

          const initRes = await fetch("/api/upload/signed-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, files: initFiles }),
          });

          if (!initRes.ok) {
            const t = await initRes.text();
            throw new Error(`Upload init failed: ${t}`);
          }

          const initJson = await initRes.json();
          if (!initJson?.success || !initJson?.data?.uploads) {
            throw new Error(`Upload init failed: ${JSON.stringify(initJson)}`);
          }

          const bucket = initJson.data.bucket as string;
          const uploads = initJson.data.uploads as Array<{
            clientId: string;
            fileId: string;
            path: string;
            token: string;
          }>;

          for (const u of uploads) {
            const idx = initFiles.findIndex((f) => f.clientId === u.clientId);
            const file = filesToUpload[idx];
            if (!file) throw new Error("Upload mapping failed (clientId mismatch)");

            const { error } = await (supabase.storage as any)
              .from(bucket)
              .uploadToSignedUrl(u.path, u.token, file, {
                contentType: file.type || "application/octet-stream",
              });

            if (error) {
              throw new Error(`Storage upload failed: ${error.message || String(error)}`);
            }
          }

          const completeRes = await fetch("/api/upload/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              files: uploads.map((u) => {
                const idx = initFiles.findIndex((f) => f.clientId === u.clientId);
                const file = filesToUpload[idx]!;
                return {
                  fileId: u.fileId,
                  path: u.path,
                  name: file.name,
                  size: file.size,
                  type: file.type || null,
                };
              }),
            }),
          });

          if (!completeRes.ok) {
            const t = await completeRes.text();
            throw new Error(`Upload finalize failed: ${t}`);
          }

          const uploadData = await completeRes.json();
          console.log("[Upload] Finalized:", uploadData);

          if (uploadData.success && uploadData.data?.fileIds) {
            fileIds.push(...uploadData.data.fileIds);
          } else if (uploadData.fileIds) {
            fileIds.push(...uploadData.fileIds);
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

      // 4) Update conversationId and append assistant message
      if (data.conversationId) {
        setConversationId(data.conversationId);
        // Persist conversationId to localStorage
        localStorage.setItem("conversationId", data.conversationId);
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

      if (data.response) {
        const assistantMessage: Message = {
          id: data.assistantMessageId || `msg_${Date.now()}`,
          role: "assistant",
          content: data.response,
          agentName: "Marcus",
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Play voice response (Marcus reads his response aloud) if enabled
        if (voiceEnabled && data.response && typeof data.response === 'string') {
          // Queue Marcus's response (will play after any agent messages)
          playVoiceResponse(data.response as string, 'assistant');
        }
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
