/**
 * Reject morning meeting plan
 */

import { NextRequest, NextResponse } from 'next/server';
import { rejectPlan } from '@/lib/morningMeeting/approvalService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId } = body;

    if (!planId) {
      return NextResponse.json(
        { success: false, error: 'planId is required' },
        { status: 400 }
      );
    }

    // Reject plan
    await rejectPlan(planId);

    return NextResponse.json({
      success: true,
      message: 'Plan rejected',
    });
  } catch (error) {
    console.error('[/api/morning-meeting/reject POST] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to reject plan: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}
