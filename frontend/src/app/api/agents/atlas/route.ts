/**
 * Atlas API Route
 * Primary decision-maker and traffic controller for all work
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAtlasAgent } from '@/agents/atlas';
import { getSupabaseClient } from '@/backend/supabaseClient';
import { getMarcusManagerState } from '@/agents/marcusManager/marcusManagerActions';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId = 'public' } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Create Atlas agent
    const atlas = createAtlasAgent();

    // Run agent with user message
    const result = await atlas.run({
      prompt: message,
      metadata: {
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      output: result.output,
      notes: result.notes,
    });
  } catch (error) {
    console.error('[Atlas API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Retrieve current Atlas state
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'public';

    const supabase = getSupabaseClient();
    const atlas = createAtlasAgent();
    const context = {
      supabase,
      memory: atlas['memory'],
      logger: atlas['logger'],
      delegateTo: () => ({ agent: '', task: '', status: 'pending' as const }),
    };

    const state = await getMarcusManagerState(context, userId);

    return NextResponse.json({
      success: true,
      state,
    });
  } catch (error) {
    console.error('[Atlas API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

