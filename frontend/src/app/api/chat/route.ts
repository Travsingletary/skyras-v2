import { NextRequest, NextResponse } from "next/server";
import { createMarcusAgent } from "@/agents/marcus";
import { logAgentExecution, generateRequestId } from "@/lib/agentLogging";
import { getAuthenticatedUserId, logAuthIdentity } from "@/lib/auth";

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    // Parse payload first (request body can only be read once)
    const payload = await request.json().catch((parseError) => {
      console.error('[/api/chat] JSON parse error:', parseError);
      return {};
    });
    const { conversationId, message, files, userId: payloadUserId } = payload;

    // Derive user identity from auth session (server-side only)
    let userId = await getAuthenticatedUserId(request);
    logAuthIdentity('/api/chat', userId);

    // Fallback: If no Supabase auth, allow 'public' userId from payload
    // This supports the access code gate flow until full auth is implemented
    if (!userId) {
      // Only allow 'public' as fallback (matches frontend behavior)
      if (payloadUserId === 'public') {
        userId = 'public';
        console.log('[/api/chat] Using fallback userId: public (no Supabase auth session)');
      } else {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      }
    }
    // Note: userId is derived from auth session, with fallback to 'public' if no auth

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

    // Log agent execution with canonical runtime identification
    logAgentExecution({
      agent: 'marcus',
      action: 'chat',
      requestId,
      userId,
      metadata: { conversationId, hasFiles: !!files?.length },
    });

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
    const response = NextResponse.json({
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
      // PHASE 1 INSTRUMENTATION (temporary - remove after Phase 1 passes)
      actionMode: (result as any).actionMode || 'UNKNOWN',
      templateId: (result as any).templateId || null,
      selectedTemplate: (result as any).selectedTemplate || null,
      router: (result as any).router || 'UNKNOWN',
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    
    return response;
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
