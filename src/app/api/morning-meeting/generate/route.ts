/**
 * Manually trigger morning meeting plan generation
 * For testing and on-demand generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateDailyPlanForUser } from '@/lib/morningMeeting/planGenerator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, targetDate } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    console.log(`[/api/morning-meeting/generate] Generating plan for user ${userId}`);

    // Generate plan
    const { plan, blocks } = await generateDailyPlanForUser(userId, targetDate);

    return NextResponse.json({
      success: true,
      message: 'Plan generated successfully',
      data: {
        plan,
        blocks,
      },
    });
  } catch (error) {
    console.error('[/api/morning-meeting/generate POST] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to generate plan: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}
