import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/user
 * 
 * Returns the currently authenticated user (if any)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('[Auth] Error getting user:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Failed to get user' },
      { status: 500 }
    );
  }
}