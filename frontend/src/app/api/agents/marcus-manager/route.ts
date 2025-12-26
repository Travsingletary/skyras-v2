/**
 * Marcus the Manager API Route
 * Strict Project Manager for YouTube Music Growth
 */

import { NextRequest, NextResponse } from 'next/server';
import { createMarcusManagerAgent } from '@/agents/marcusManager';
import { getSupabaseClient } from '@/backend/supabaseClient';

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

    // Create Marcus Manager agent
    const marcusManager = createMarcusManagerAgent();

    // Run agent with user message
    const result = await marcusManager.run({
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
    console.error('[Marcus Manager API] Error:', error);
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
 * GET: Retrieve current Marcus Manager state
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'public';

    const supabase = getSupabaseClient();
    const { getMarcusManagerState } = await import('@/agents/marcusManager/marcusManagerActions');

    const marcusManager = createMarcusManagerAgent();
    const context = {
      supabase,
      memory: marcusManager['memory'],
      logger: marcusManager['logger'],
      delegateTo: () => ({ agent: '', task: '', status: 'pending' as const }),
    };

    const state = await getMarcusManagerState(context, userId);

    return NextResponse.json({
      success: true,
      state,
    });
  } catch (error) {
    console.error('[Marcus Manager API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

