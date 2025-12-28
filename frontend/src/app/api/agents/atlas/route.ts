/**
 * Atlas API Route
 * Primary decision-maker and traffic controller for all work
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAtlasAgent } from '@/agents/atlas';
import { getSupabaseClient } from '@/backend/supabaseClient';
import { getMarcusManagerState } from '@/agents/marcusManager/marcusManagerActions';
import { logAgentExecution, generateRequestId } from '@/lib/agentLogging';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const body = await request.json();
    const { message, userId = 'public' } = body;

    // Validate inputs
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    if (typeof userId !== 'string' || userId.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'userId must be a non-empty string' },
        { status: 400 }
      );
    }

    // Log agent execution with canonical runtime identification
    logAgentExecution({
      agent: 'atlas',
      action: 'processMessage',
      requestId,
      userId,
    });

    // Create Atlas agent
    const atlas = createAtlasAgent();

    // Run agent with user message
    const result = await atlas.run({
      prompt: message.trim(),
      metadata: {
        userId: userId.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      output: result.output,
      notes: result.notes,
    });
  } catch (error) {
    // Log error context (no secrets, no payload bodies)
    console.error('[Atlas API] Error:', {
      request_id: requestId,
      error_type: error instanceof Error ? error.constructor.name : typeof error,
      error_message: error instanceof Error ? error.message : String(error),
      error_stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5).join('\n') : undefined,
    });

    // Return 4xx for validation errors, 5xx for server errors
    const statusCode = error instanceof Error && error.message.includes('required') ? 400 : 500;
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: statusCode }
    );
  }
}

/**
 * GET: Retrieve current Atlas state
 */
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'public';

    // Validate userId
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'userId must be a non-empty string' },
        { status: 400 }
      );
    }

    // Log agent execution with canonical runtime identification
    logAgentExecution({
      agent: 'atlas',
      action: 'getState',
      requestId,
      userId,
    });

    const supabase = getSupabaseClient();
    const atlas = createAtlasAgent();
    const context = {
      supabase,
      memory: atlas['memory'],
      logger: atlas['logger'],
      delegateTo: () => ({ agent: '', task: '', status: 'pending' as const }),
    };

    const state = await getMarcusManagerState(context, userId.trim());

    return NextResponse.json({
      success: true,
      state,
    });
  } catch (error) {
    // Log error context (no secrets, no payload bodies)
    console.error('[Atlas API GET] Error:', {
      request_id: requestId,
      error_type: error instanceof Error ? error.constructor.name : typeof error,
      error_message: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

