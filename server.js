require('dotenv').config();
require('ts-node/register');

const express = require('express');
const cors = require('cors');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { createClient } = require('@supabase/supabase-js');

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

        if (newConv) {
          convId = newConv.id;
          conversation = newConv;
          onboardingState = {};
        }
      }
    } else {
      // Fallback: use in-memory state (for development without Supabase)
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
    const isFirstMessage = !onboardingState || Object.keys(onboardingAnswers).length === 0;

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
    if (supabase && convId) {
      const { data: msgData } = await supabase.from('messages').insert({
        conversation_id: convId,
        user_id: userId,
        role: 'assistant',
        content: response
      }).select().single();

      if (msgData) {
        assistantMessageId = msgData.id;
      }

      // Update conversation with onboarding state and workflow
      await supabase
        .from('conversations')
        .update({
          onboarding_state: updatedOnboardingState,
          workflow: updatedWorkflow,
          updated_at: new Date().toISOString()
        })
        .eq('id', convId);
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'SkyRas v2 Backend running' });
});

app.listen(PORT, () => {
  console.log(`🚀 SkyRas v2 running on port ${PORT}`);
  console.log(`📱 Open: http://localhost:${PORT}`);
});
