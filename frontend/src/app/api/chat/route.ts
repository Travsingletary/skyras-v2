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

    // Return in format expected by frontend
    return NextResponse.json({
      success: true,
      conversationId: finalConversationId,
      assistantMessageId: messageId,
      response: responseText, // ← Frontend expects this!
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
