import { NextRequest, NextResponse } from "next/server";
import { createMarcusAgent } from "@/agents/marcus";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => ({}));
    const { conversationId, userId, message, files } = payload;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'message is required' },
        { status: 400 }
      );
    }

    // Create Marcus agent and run
    const marcus = createMarcusAgent();
    const result = await marcus.run({
      prompt: message,
      metadata: {
        conversationId,
        userId,
        files
      }
    });

    // Extract response text from agent result
    const responseText = result.output || 'No response from Marcus';

    // Generate conversation ID if not provided
    const finalConversationId = conversationId || `conv_${userId}_${Date.now()}`;
    const messageId = `msg_${Date.now()}`;

    // Extract auto-execution results if present
    const autoExecution = result.notes?.autoExecution as {
      workflowId?: string;
      tasksCreated?: number;
      agentsTriggered?: string[];
      executionResults?: Array<{
        agentName: string;
        success: boolean;
        tasksProcessed?: number;
        error?: string;
      }>;
    } | undefined;

    // Return in format expected by frontend
    return NextResponse.json({
      success: true,
      conversationId: finalConversationId,
      assistantMessageId: messageId,
      response: responseText,
      data: {
        message: {
          id: messageId,
          content: responseText,
          sender: 'agent',
          timestamp: new Date().toISOString(),
        },
        output: responseText,
        delegations: result.delegations || [],
        notes: result.notes || {},
        // Include execution status for frontend
        execution: autoExecution ? {
          workflowId: autoExecution.workflowId,
          tasksCreated: autoExecution.tasksCreated,
          agentsTriggered: autoExecution.agentsTriggered,
          status: autoExecution.executionResults?.every(r => r.success) ? 'success' : 'partial',
        } : undefined,
      },
    });
  } catch (error) {
    console.error('[/api/chat] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
