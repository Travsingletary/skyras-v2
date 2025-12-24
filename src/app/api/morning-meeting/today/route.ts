/**
 * Fetch today's morning meeting plan
 */

import { NextRequest, NextResponse } from 'next/server';
import { dailyPlansDb, dailyPlanBlocksDb } from '@/lib/database';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'userId parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const planDate = today.toISOString().split('T')[0];

    // Fetch plan for today
    const plan = await dailyPlansDb.getByUserAndDate(userId, planDate);

    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'No plan found for today' },
        { status: 404 }
      );
    }

    // Fetch blocks
    const blocks = await dailyPlanBlocksDb.getByPlanId(plan.id);

    return NextResponse.json({
      success: true,
      data: {
        plan,
        blocks,
      },
    });
  } catch (error) {
    console.error('[/api/morning-meeting/today GET] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch plan: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}
