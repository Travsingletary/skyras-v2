import { NextRequest, NextResponse } from "next/server";
import { createMarcusAgent } from "@/agents/marcus";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch((parseError) => {
      console.error('[/api/chat] JSON parse error:', parseError);
      return {};
    });
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
    let marcus;
    try {
      marcus = createMarcusAgent();
    } catch (agentError) {
      console.error('[/api/chat] Failed to create Marcus agent:', agentError);
      return NextResponse.json(
        { success: false, error: `Failed to initialize agent: ${(agentError as Error).message}` },
        { status: 500 }
      );
    }

    let result;
    try {
      result = await marcus.run({
        prompt: message,
        metadata: {
          conversationId,
          userId,
          files
        }
      });
    } catch (runError) {
      console.error('[/api/chat] Marcus agent run failed:', runError);
      return NextResponse.json(
        { success: false, error: `Agent execution failed: ${(runError as Error).message}` },
        { status: 500 }
      );
    }

    // Extract response text from agent result
    const responseText = result?.output || 'No response from Marcus';

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
    console.error('[/api/chat] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('[/api/chat] Error stack:', errorStack);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
