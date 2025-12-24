/**
 * Approve morning meeting plan and sync to calendar
 */

import { NextRequest, NextResponse } from 'next/server';
import { approvePlan } from '@/lib/morningMeeting/approvalService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, userId } = body;

    if (!planId || !userId) {
      return NextResponse.json(
        { success: false, error: 'planId and userId are required' },
        { status: 400 }
      );
    }

    // Approve plan and sync to calendar
    const result = await approvePlan(planId, userId);

    return NextResponse.json({
      success: result.success,
      message: `Synced ${result.syncedCount} block(s) to calendar`,
      data: {
        syncedCount: result.syncedCount,
        failedCount: result.failedCount,
        conflictCount: result.conflictCount,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error('[/api/morning-meeting/approve POST] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to approve plan: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}
