/**
 * Chat API Route
 * POST /api/chat - Real-time chat with Marcus and agent routing
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabaseClient');
const { runMarcusChat } = require('../services/agents');
const { dispatchActions } = require('../services/actionDispatcher');
const { ONBOARDING_QUESTIONS, getOnboardingQuestion, processOnboardingAnswer } = require('../services/onboarding');
const { authenticateRequest } = require('../middleware/auth');

/**
 * POST /api/chat
 * Request body:
 * {
 *   conversationId: string | null,
 *   userId: string,
 *   message: string,
 *   files: Array<{ fileId: string }> | null
 * }
 *
 * Response:
 * {
 *   conversationId: string,
 *   userMessageId: string,
 *   assistantMessageId: string,
 *   response: string
 * }
 */
// All chat routes require authentication
// TEMPORARY: Auth bypassed for testing action execution
// TODO: Re-enable auth in Week 3
// router.use(authenticateRequest);

router.post('/', async (req, res) => {
  try {
    const { conversationId, message, files, userId: bodyUserId } = req.body;
    // TEMPORARY: Use userId from body if auth is bypassed
    // Generate a valid UUID v4 for temp users
    const generateTempUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };
    const userId = req.userId || bodyUserId || generateTempUUID();

    // Validation
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ error: 'message is required and must be a non-empty string' });
    }

    let finalConversationId = conversationId;

    // TEMPORARY: Use service role (bypasses RLS) when auth is disabled
    const client = req.supabase || supabase;

    // Step 1: Get or create conversation
    let conversation = null;
    let onboardingState = null;

    if (conversationId) {
      // Load existing conversation
      const { data: convData, error: convError} = await client
        .from('conversations')
        .select('id, onboarding_state, workflow')
        .eq('id', conversationId)
        .single();

      if (convError) {
        console.error('Error loading conversation:', convError);
        return res.status(500).json({ error: 'Failed to load conversation', details: convError.message });
      }

      if (convData) {
        conversation = convData;
        onboardingState = convData.onboarding_state || null;
      }
    } else {
      // Create new conversation
      const title = message.length > 80 ? message.substring(0, 77) + '...' : message;

      const { data: newConversation, error: convError } = await client
        .from('conversations')
        .insert({
          user_id: userId, // UUID from auth
          title,
          onboarding_state: {},
          workflow: null
        })
        .select('id, onboarding_state')
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        return res.status(500).json({ error: 'Failed to create conversation', details: convError.message });
      }

      finalConversationId = newConversation.id;
      conversation = newConversation;
      onboardingState = newConversation.onboarding_state || {};
    }

    // Step 2: Insert user message
    const userMessagePayload = {
      conversation_id: finalConversationId,
      role: 'user',
      content: message,
      files: files && files.length > 0 ? JSON.stringify(files) : null,
    };

    const { data: userMessage, error: userMsgError } = await supabase
      .from('messages')
      .insert(userMessagePayload)
      .select('id')
      .single();

    if (userMsgError) {
      console.error('Error inserting user message:', userMsgError);
      return res.status(500).json({ error: 'Failed to save user message', details: userMsgError.message });
    }

    // Step 3: Get message history for context
    const { data: messageHistory, error: historyError } = await client
      .from('messages')
      .select('role, content')
      .eq('conversation_id', finalConversationId)
      .order('created_at', { ascending: true })
      .limit(10);

    if (historyError) {
      console.error('Error fetching message history:', historyError);
      // Continue without history rather than failing
    }

    // Build message history array (excluding the just-inserted user message)
    const previousMessages = (messageHistory || [])
      .filter(msg => msg.role && msg.content)
      .slice(0, -1) // Remove last message (the one we just inserted)
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    // Step 4: Get file metadata if files are attached
    let fileMetadata = [];
    if (files && files.length > 0) {
      const fileIds = files.map(f => f.fileId);
      const { data: filesData, error: filesError } = await client
        .from('files')
        .select('id, filename, type, size, storage_path')
        .in('id', fileIds)
        .eq('user_id', userId); // Ensure files belong to user

      if (!filesError && filesData) {
        fileMetadata = filesData;
      }
    }

    // Step 5: Check if user is in onboarding
    const onboardingAnswers = onboardingState?.answers || {};
    const currentQuestion = getOnboardingQuestion(onboardingAnswers);
    const isOnboardingComplete = !currentQuestion && Object.keys(onboardingAnswers).length > 0;
    const isFirstMessage = !onboardingState || (!onboardingState.currentQuestion && Object.keys(onboardingAnswers).length === 0);

    let assistantResponse;
    let onboardingUpdate = null;
    let workflowPlan = null;

    if (isFirstMessage) {
      // Start onboarding
      const firstQuestion = ONBOARDING_QUESTIONS[0];
      assistantResponse = {
        text: `Hey! I'm Marcus, your workflow builder. I help content creators and marketers build systems that actually fit their life.\n\nLet's get you set up. ${firstQuestion.question}`,
        actions: []
      };
      onboardingUpdate = {
        answers: {},
        currentQuestion: 1
      };
    } else if (currentQuestion) {
      // Process onboarding answer
      const onboardingResult = processOnboardingAnswer(onboardingState, message);
      
      if (onboardingResult.complete) {
        // Onboarding complete - generate workflow
        workflowPlan = onboardingResult.workflowPlan;
        
        // Create workflow via action
        const workflowAction = {
          type: 'RUN_WORKFLOW_PLAN',
          payload: workflowPlan,
          sourceAgent: 'Marcus',
          userContext: {
            conversationId: finalConversationId,
            userId,
            fileIds: files ? files.map(f => f.fileId) : []
          }
        };

        // Generate summary message
        const summary = `Perfect! Based on your answers, I've created a "${workflowPlan.name}" workflow for you. Here's what we'll do:\n\n${workflowPlan.steps.map((s, i) => `${i + 1}. ${s.description} (${s.agent})`).join('\n')}\n\nLet me set this up for you now!`;
        
        assistantResponse = {
          text: summary,
          actions: [workflowAction]
        };
        onboardingUpdate = {
          answers: onboardingResult.answers,
          currentQuestion: null,
          completed: true
        };
      } else {
        // Continue onboarding
        const nextQuestionText = onboardingResult.questionText || 'Thanks!';
        assistantResponse = {
          text: nextQuestionText,
          actions: []
        };
        onboardingUpdate = {
          answers: onboardingResult.answers,
          currentQuestion: onboardingResult.nextQuestion
        };
      }
    } else {
      // Normal chat - not in onboarding
      assistantResponse = await runMarcusChat({
        conversationId: finalConversationId,
        userId,
        message,
        files: fileMetadata,
        messageHistory: previousMessages,
      });
    }

    // Step 6: Update onboarding state if needed
    if (onboardingUpdate) {
      await client
        .from('conversations')
        .update({ onboarding_state: onboardingUpdate })
        .eq('id', finalConversationId)
        .eq('user_id', userId); // Ensure user owns conversation
    }

    // Step 7: Execute actions if any
    let actionResults = [];
    let workflowId = null;
    let taskIds = [];

    if (assistantResponse.actions && assistantResponse.actions.length > 0) {
      // Add userContext to each action
      const actionsWithContext = assistantResponse.actions.map(action => ({
        ...action,
        userContext: {
          conversationId: finalConversationId,
          userId,
          fileIds: files ? files.map(f => f.fileId) : [],
          ...action.userContext
        }
      }));

      try {
        actionResults = await dispatchActions(actionsWithContext, client);
        
        // Extract workflow and task IDs from results
        for (const result of actionResults) {
          if (result.workflowId) {
            workflowId = result.workflowId;
            // Save workflow ID to conversation
            await client
              .from('conversations')
              .update({ workflow: { id: result.workflowId } })
              .eq('id', finalConversationId)
              .eq('user_id', userId);
          }
          if (result.taskId) {
            taskIds.push(result.taskId);
          }
        }
      } catch (actionError) {
        console.error('Action execution error:', actionError);
        // Continue even if actions fail - still return the message
      }
    }

    // Step 8: Insert assistant response with action metadata
    const assistantMessagePayload = {
      conversation_id: finalConversationId,
      role: 'assistant',
      content: assistantResponse.text,
      user_id: userId, // Add user_id for RLS
      metadata: JSON.stringify({
        ...(assistantResponse.metadata || {}),
        actions: assistantResponse.actions || [],
        actionResults: actionResults,
        workflowId,
        taskIds
      }),
    };

    const { data: assistantMessage, error: assistantMsgError } = await client
      .from('messages')
      .insert(assistantMessagePayload)
      .select('id')
      .single();

    if (assistantMsgError) {
      console.error('Error inserting assistant message:', assistantMsgError);
      return res.status(500).json({ error: 'Failed to save assistant response', details: assistantMsgError.message });
    }

    // Step 9: Return success response with action results
    res.json({
      conversationId: finalConversationId,
      userMessageId: userMessage.id,
      assistantMessageId: assistantMessage.id,
      response: assistantResponse.text,
      actions: assistantResponse.actions || [],
      actionResults: actionResults,
      workflowId,
      taskIds
    });

  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

module.exports = router;
