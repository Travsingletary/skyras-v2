/**
 * Initiate Google OAuth flow
 * Redirects user to Google authorization page
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizationUrl } from '@/lib/googleCalendar/oauth';

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
    // Get authorization URL from OAuth service
    const authUrl = getAuthorizationUrl(userId);

    // Redirect user to Google
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('[/api/auth/google/authorize GET] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to initiate OAuth: ${(error as Error).message}`,
      },
      { status: 500 }
    );
  }
}
