require('dotenv').config();
require('ts-node/register');

const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { createClient } = require('@supabase/supabase-js');
const WebSocket = require('ws');
const ElevenLabs = require('elevenlabs-node');

const { runDailyStudioRun } = require('./agentkit/workflows/dailyStudioRun');
const { runDailyGrowthLoop } = require('./agentkit/workflows/dailyGrowthLoop');
const { generateContentShippingPlan } = require('./agentkit/workflows/contentShipping');
const { memoryClient, getRunHistory } = require('./agentkit/memory/memoryClient');
const {
  ONBOARDING_QUESTIONS,
  getOnboardingQuestion,
  generateWorkflowProposals,
  generateWeeklyStructure,
  generateTaskBreakdown,
  summarizeAnswers
} = require('./backend/marcusWorkflows');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// File upload configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept common file types
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/json',
      'audio/mpeg',
      'audio/wav',
      'video/mp4',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not supported`));
    }
  }
});

// Proxy to new FastAPI v2 backend (microservices)
app.use('/api/v2', createProxyMiddleware({
  target: 'http://localhost:8000',
  changeOrigin: true,
  logLevel: 'debug',
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(503).json({ 
      error: 'FastAPI backend unavailable',
      message: 'Make sure Docker services are running'
    });
  }
}));

app.post('/api/studio/run', async (req, res) => {
  try {
    const { goal = 'Plan SkySky content for today.', includeSkySky = true, expand = false, project = 'SkySky' } = req.body || {};
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ success: false, error: 'OPENAI_API_KEY not set. Please create a .env file and restart the server.' });
    }
    let studioResult = await runDailyStudioRun({ goal, includeSkySky, project });

    if (expand) {
      const expandedPlan = await runDailyGrowthLoop(goal, { expand: true, project });
      studioResult = { ...studioResult, dailyPlan: expandedPlan };
    }

    res.json({ success: true, data: studioResult });
  } catch (error) {
    console.error('Studio run failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/studio/today', async (req, res) => {
  try {
    const todayKey = `daily-studio:${new Date().toISOString().slice(0, 10)}`;
    const record = await memoryClient.getByKey('plan', todayKey);
    if (!record) {
      return res.status(404).json({ success: false, message: 'No studio run recorded for today.' });
    }
    res.json({ success: true, data: record.data });
  } catch (error) {
    console.error('Fetching studio plan failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/studio/history', async (req, res) => {
  try {
    const workflow = req.query.workflow ? String(req.query.workflow) : undefined;
    const project = req.query.project ? String(req.query.project) : undefined;
    const history = await getRunHistory(workflow, project);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Fetching studio history failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/studio/ship', async (req, res) => {
  try {
    const {
      goal,
      project = 'SkySky',
      platforms = ['instagram', 'tiktok'],
      slots = 3,
    } = req.body || {};
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ success: false, error: 'OPENAI_API_KEY not set. Please create a .env file and restart the server.' });
    }

    const todayKey = `daily-studio:${new Date().toISOString().slice(0, 10)}`;
    let studioRecord = await memoryClient.getByKey('plan', todayKey);
    let studioRun = (studioRecord?.data);

    if (!studioRun || (goal && studioRun.goal !== goal) || (studioRun && studioRun.project && studioRun.project !== project)) {
      if (!goal) {
        return res.status(404).json({ success: false, message: 'No studio run found for today. Provide a goal to generate one.' });
      }
      studioRun = await runDailyStudioRun({ goal, includeSkySky: true, project });
      await memoryClient.save({
        id: todayKey,
        kind: 'plan',
        key: todayKey,
        data: studioRun,
      });
    }

    const shipping = await generateContentShippingPlan({
      studioRun,
      project,
      platforms,
      slots,
    });

    res.json({ success: true, data: shipping });
  } catch (error) {
    console.error('Shipping run failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// File upload endpoint
app.post('/api/upload', upload.array('files', 10), async (req, res) => {
  try {
    const { userId, conversationId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    const uploadedFiles = [];

    // Process each file
    for (const file of req.files) {
      const fileData = {
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer,
        uploadedAt: new Date().toISOString()
      };

      // If Supabase is configured, save file metadata
      if (supabase && conversationId) {
        try {
          // Save file metadata to database
          const { data: fileRecord, error: fileError } = await supabase
            .from('files')
            .insert({
              id: fileData.id,
              conversation_id: conversationId,
              user_id: userId,
              filename: file.originalname,
              mimetype: file.mimetype,
              size: file.size,
              created_at: fileData.uploadedAt
            })
            .select()
            .single();

          if (fileError) {
            console.error('Error saving file metadata:', fileError);
          }

          // Optionally: Upload file to Supabase Storage
          // const { data: storageData, error: storageError } = await supabase.storage
          //   .from('user-files')
          //   .upload(`${userId}/${conversationId}/${fileData.id}`, file.buffer, {
          //     contentType: file.mimetype
          //   });

        } catch (dbError) {
          console.error('Database error:', dbError);
        }
      }

      uploadedFiles.push({
        id: fileData.id,
        filename: fileData.filename,
        mimetype: fileData.mimetype,
        size: fileData.size
      });
    }

    res.json({
      success: true,
      files: uploadedFiles,
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'File upload failed'
    });
  }
});

const mockTasks = [
  {
    id: '1',
    title: 'Complete Marcus agent framework',
    description: 'Build the core agent personality system',
    dueDate: '2024-01-15',
    status: 'completed',
    priority: 'high'
  },
  {
    id: '2',
    title: 'Implement function calling',
    description: 'Create intent parser and function registry',
    dueDate: '2024-01-20',
    status: 'in-progress',
    priority: 'high'
  },
  {
    id: '3',
    title: 'Build frontend dashboard',
    description: 'Create chat interface and project panels',
    dueDate: '2024-01-25',
    status: 'pending',
    priority: 'medium'
  }
];

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/studio', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'studio.html'));
});

// Chat API endpoint with onboarding and workflow generation
app.post('/api/chat', async (req, res) => {
  try {
    const { conversationId, userId, message, files } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'userId is required' 
      });
    }

    // Get or create conversation
    let convId = conversationId;
    let conversation = null;
    let onboardingState = null;
    let userWorkflow = null;

    if (supabase) {
      if (convId) {
        // Get existing conversation
        const { data: convData, error: convError } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', convId)
          .eq('user_id', userId)
          .single();

        if (convError) {
          console.error('Error fetching conversation:', convError);
        }

        if (convData) {
          conversation = convData;
          onboardingState = convData.onboarding_state || null;
          userWorkflow = convData.workflow || null;
        }
      } else {
        // Create new conversation
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({
            user_id: userId,
            title: 'New Conversation',
            onboarding_state: {},
            workflow: null
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating conversation:', createError);
          // Generate fallback conversationId if Supabase fails
          convId = `conv_${userId}_${Date.now()}`;
          onboardingState = {};
        } else if (newConv) {
          convId = newConv.id;
          conversation = newConv;
          onboardingState = {};
        } else {
          // Fallback if insert returns no data
          convId = `conv_${userId}_${Date.now()}`;
          onboardingState = {};
        }
      }
    } else {
      // Fallback: use in-memory state (for development without Supabase)
      if (!convId) {
        convId = `conv_${userId}_${Date.now()}`;
      }
      onboardingState = onboardingState || {};
    }

    // Save user message to database
    if (supabase && convId) {
      await supabase.from('messages').insert({
        conversation_id: convId,
        user_id: userId,
        role: 'user',
        content: message,
        files: files || []
      });
    }

    let response = '';
    let assistantMessageId = null;
    let updatedOnboardingState = onboardingState;
    let updatedWorkflow = userWorkflow;

    // Check if user is in onboarding
    const onboardingAnswers = onboardingState?.answers || {};
    const currentQuestion = getOnboardingQuestion(onboardingAnswers);
    const isOnboardingComplete = !currentQuestion && Object.keys(onboardingAnswers).length > 0;
    // Check if this is truly the first message (no onboarding state OR no current question set)
    const isFirstMessage = !onboardingState || (!onboardingState.currentQuestion && Object.keys(onboardingAnswers).length === 0);

    if (isFirstMessage) {
      // Start onboarding
      const firstQuestion = ONBOARDING_QUESTIONS[0];
      response = `Hey! I'm Marcus, your workflow builder. I help content creators and marketers build systems that actually fit their life.\n\nLet's get you set up. ${firstQuestion.question}`;
      updatedOnboardingState = { answers: {}, currentQuestion: 1 };
    } else if (currentQuestion) {
      // Process answer to current question
      const answer = message.trim();
      const newAnswers = { ...onboardingAnswers, [currentQuestion.key]: answer };
      const nextQuestion = getOnboardingQuestion(newAnswers);

      if (nextQuestion) {
        // More questions to go
        response = `Got it. ${nextQuestion.question}`;
        updatedOnboardingState = { 
          answers: newAnswers, 
          currentQuestion: nextQuestion.id 
        };
      } else {
        // All questions answered - summarize and propose workflows
        const summary = summarizeAnswers(newAnswers);
        const proposals = generateWorkflowProposals(newAnswers);
        
        response = `${summary}\n\nDoes that sound right? (Just say "yes" or "no")\n\n`;
        response += `Once you confirm, I'll propose ${proposals.length} workflow${proposals.length > 1 ? 's' : ''} tailored to your situation.`;
        
        updatedOnboardingState = { 
          answers: newAnswers, 
          currentQuestion: null,
          awaitingConfirmation: true,
          proposals: proposals
        };
      }
    } else if (onboardingState?.awaitingConfirmation) {
      // User confirming summary
      const confirmed = message.toLowerCase().includes('yes') || message.toLowerCase().includes('correct') || message.toLowerCase().includes('right');
      
      if (confirmed) {
        const proposals = onboardingState.proposals || generateWorkflowProposals(onboardingState.answers);
        
        response = `Perfect! Here are ${proposals.length} workflow${proposals.length > 1 ? 's' : ''} I think would work for you:\n\n`;
        
        proposals.forEach((proposal, idx) => {
          response += `${idx + 1}. **${proposal.name}**\n`;
          response += `   ${proposal.description}\n`;
          response += `   Focus: ${proposal.focus}\n\n`;
        });
        
        response += `Which one sounds best? (Just say the number or name)`;
        
        updatedOnboardingState = { 
          ...onboardingState,
          awaitingConfirmation: false,
          awaitingWorkflowChoice: true
        };
      } else {
        response = `No problem! Let's adjust. Which part was off? I can ask that question again.`;
        updatedOnboardingState = { 
          ...onboardingState,
          awaitingConfirmation: false
        };
      }
    } else if (onboardingState?.awaitingWorkflowChoice) {
      // User choosing workflow
      const proposals = onboardingState.proposals || [];
      let selectedProposal = null;
      
      // Try to match by number or name
      const messageLower = message.toLowerCase().trim();
      const numMatch = messageLower.match(/\d+/);
      if (numMatch) {
        const idx = parseInt(numMatch[0]) - 1;
        if (idx >= 0 && idx < proposals.length) {
          selectedProposal = proposals[idx];
        }
      } else {
        selectedProposal = proposals.find(p => 
          messageLower.includes(p.name.toLowerCase())
        );
      }

      if (selectedProposal) {
        const workflowName = selectedProposal.name;
        const weeklyStructure = generateWeeklyStructure(workflowName, onboardingState.answers);
        const taskBreakdown = generateTaskBreakdown(workflowName, onboardingState.answers);

        response = `Great choice! Here's your **${workflowName}**:\n\n`;
        response += `## Weekly Structure\n\n`;
        
        weeklyStructure.forEach(day => {
          response += `**${day.day}** (${day.time}, ${day.priority})\n`;
          day.tasks.forEach(task => {
            response += `  • ${task}\n`;
          });
          response += `\n`;
        });

        response += `## Task Breakdown\n\n`;
        taskBreakdown.forEach(category => {
          response += `### ${category.category}\n`;
          category.tasks.forEach(item => {
            const platforms = Array.isArray(item.platforms) ? item.platforms.join(", ") : item.platforms;
            response += `- **${item.task}** (${item.time}, ${item.priority})\n`;
            if (platforms) {
              response += `  Platforms: ${platforms}\n`;
            }
          });
          response += `\n`;
        });

        response += `\nThis workflow is now saved! I'll reference it in our future conversations. How can I help you get started?`;

        updatedWorkflow = {
          name: workflowName,
          weeklyStructure,
          taskBreakdown,
          answers: onboardingState.answers,
          createdAt: new Date().toISOString()
        };

        updatedOnboardingState = { 
          ...onboardingState,
          awaitingWorkflowChoice: false,
          completed: true
        };
      } else {
        response = `I didn't catch that. Which workflow do you want? (Say the number or name)`;
      }
    } else if (userWorkflow) {
      // User has completed onboarding - normal chat with workflow context
      response = `Given your ${userWorkflow.name}, `;
      
      // Context-aware responses
      if (message.toLowerCase().includes('schedule') || message.toLowerCase().includes('time')) {
        response += `here's how this fits into your weekly structure:\n\n`;
        userWorkflow.weeklyStructure.forEach(day => {
          response += `${day.day}: ${day.tasks.join(", ")}\n`;
        });
      } else if (message.toLowerCase().includes('workflow') || message.toLowerCase().includes('system')) {
        response += `your current workflow is the ${userWorkflow.name}. Want to adjust it or add something new?`;
      } else {
        response += `how can I help you today?`;
      }
    } else {
      // Fallback for users who somehow skipped onboarding
      response = `I'm Marcus, your workflow builder. Let's get you set up with a personalized workflow. ${ONBOARDING_QUESTIONS[0].question}`;
      updatedOnboardingState = { answers: {}, currentQuestion: 1 };
    }

    // Save assistant response to database
    if (supabase && convId && !convId.startsWith('conv_')) {
      // Only try to save if convId is a real UUID (not fallback)
      const { data: msgData, error: msgError } = await supabase.from('messages').insert({
        conversation_id: convId,
        user_id: userId,
        role: 'assistant',
        content: response
      }).select().single();

      if (msgError) {
        console.error('Error saving assistant message:', msgError);
      } else if (msgData) {
        assistantMessageId = msgData.id;
      }

      // Update conversation with onboarding state and workflow
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          onboarding_state: updatedOnboardingState,
          workflow: updatedWorkflow,
          updated_at: new Date().toISOString()
        })
        .eq('id', convId);

      if (updateError) {
        console.error('Error updating conversation:', updateError);
      }
    }

    res.json({
      success: true,
      conversationId: convId,
      assistantMessageId: assistantMessageId,
      response: response
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Workflows API endpoint
app.get('/api/workflows', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: 'Supabase not configured'
      });
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('id, title, workflow, created_at, updated_at')
      .eq('user_id', userId)
      .not('workflow', 'is', null)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Workflows query error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      workflows: data || []
    });

  } catch (error) {
    console.error('Workflows error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// ElevenLabs voice endpoints
const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;

// Text-to-speech endpoint
app.post('/api/voice/tts', express.text({ type: '*/*', limit: '10mb' }), async (req, res) => {
  try {
    // Parse JSON manually to handle any escaping issues
    let parsedBody;
    try {
      // If body is already parsed by json middleware
      if (typeof req.body === 'object' && req.body !== null) {
        parsedBody = req.body;
      } else {
        // Parse manually
        parsedBody = JSON.parse(req.body);
      }
    } catch (parseError) {
      console.error('[TTS] JSON parse error:', parseError.message);
      console.error('[TTS] Raw body:', req.body);
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON in request body'
      });
    }

    console.log('[TTS] Request received, text length:', parsedBody.text?.length);
    const { text, voiceId = 'EXAVITQu4vr4xnSDxMaL' } = parsedBody;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    if (!elevenLabsApiKey) {
      return res.status(500).json({
        success: false,
        error: 'ElevenLabs API key not configured'
      });
    }

    const voice = new ElevenLabs({
      apiKey: elevenLabsApiKey,
      voiceId: voiceId,
    });

    const audioStream = await voice.textToSpeechStream({
      textInput: text,
      voiceId: voiceId,
      stability: 0.5,
      similarityBoost: 0.75,
      modelId: 'eleven_monolingual_v1',
    });

    res.setHeader('Content-Type', 'audio/mpeg');

    // Handle the stream properly
    if (audioStream && typeof audioStream.pipe === 'function') {
      audioStream.pipe(res);
    } else {
      // If it's not a stream, try treating it as a buffer
      res.send(audioStream);
    }

  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Text-to-speech failed'
    });
  }
});

// Get available voices
app.get('/api/voice/voices', async (req, res) => {
  try {
    if (!elevenLabsApiKey) {
      return res.status(500).json({
        success: false,
        error: 'ElevenLabs API key not configured'
      });
    }

    const voices = await ElevenLabs.getVoices(elevenLabsApiKey);
    res.json({
      success: true,
      voices: voices
    });

  } catch (error) {
    console.error('Voices fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch voices'
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'SkyRas v2 Backend running' });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 SkyRas v2 running on port ${PORT}`);
  console.log(`📱 Open: http://localhost:${PORT}`);
});

// WebSocket server for real-time voice conversations
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');

  let elevenLabsWs = null;

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'start_voice_session') {
        // Initialize ElevenLabs WebSocket connection
        if (!elevenLabsApiKey) {
          ws.send(JSON.stringify({
            type: 'error',
            error: 'ElevenLabs API key not configured'
          }));
          return;
        }

        const voiceId = data.voiceId || 'EXAVITQu4vr4xnSDxMaL';
        const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=eleven_monolingual_v1`;

        elevenLabsWs = new WebSocket(wsUrl, {
          headers: {
            'xi-api-key': elevenLabsApiKey
          }
        });

        elevenLabsWs.on('open', () => {
          ws.send(JSON.stringify({ type: 'voice_session_started' }));

          // Send initial config
          elevenLabsWs.send(JSON.stringify({
            text: ' ',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75
            }
          }));
        });

        elevenLabsWs.on('message', (audioData) => {
          // Forward audio chunks to client
          ws.send(audioData);
        });

        elevenLabsWs.on('error', (error) => {
          console.error('ElevenLabs WebSocket error:', error);
          ws.send(JSON.stringify({
            type: 'error',
            error: error.message
          }));
        });

      } else if (data.type === 'text_chunk' && elevenLabsWs) {
        // Forward text chunk to ElevenLabs for streaming TTS
        elevenLabsWs.send(JSON.stringify({
          text: data.text,
          try_trigger_generation: true
        }));

      } else if (data.type === 'end_voice_session' && elevenLabsWs) {
        // End the stream
        elevenLabsWs.send(JSON.stringify({ text: '' }));
        elevenLabsWs.close();
        elevenLabsWs = null;
      }

    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        error: error.message
      }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    if (elevenLabsWs) {
      elevenLabsWs.close();
    }
  });
});
