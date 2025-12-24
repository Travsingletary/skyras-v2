/**
 * Disconnect Google Calendar
 * Revokes OAuth access and deletes stored tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { revokeAccess } from '@/lib/googleCalendar/oauth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // Revoke access and delete tokens
    await revokeAccess(userId);

    console.log(`[/api/auth/google/disconnect] Disconnected calendar for user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Google Calendar disconnected',
    });
  } catch (error) {
    console.error('[/api/auth/google/disconnect POST] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to disconnect: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}
