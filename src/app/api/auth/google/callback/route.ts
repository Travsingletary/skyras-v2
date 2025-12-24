/**
 * Google OAuth callback handler
 * Exchanges authorization code for tokens and stores them
 */

import { NextRequest, NextResponse } from 'next/server';
import { handleCallback } from '@/lib/googleCalendar/oauth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Handle OAuth error
  if (error) {
    console.error('[/api/auth/google/callback] OAuth error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=oauth_denied`
    );
  }

  // Validate parameters
  if (!code || !state) {
    return NextResponse.json(
      { success: false, error: 'Missing code or state parameter' },
      { status: 400 }
    );
  }

  try {
    // Exchange code for tokens
    const userId = await handleCallback(code, state);

    console.log(`[/api/auth/google/callback] Successfully connected calendar for user ${userId}`);

    // Redirect to success page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?success=calendar_connected`
    );
  } catch (error) {
    console.error('[/api/auth/google/callback] Error:', error);

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/settings?error=oauth_failed&message=${encodeURIComponent((error as Error).message)}`
    );
  }
}
