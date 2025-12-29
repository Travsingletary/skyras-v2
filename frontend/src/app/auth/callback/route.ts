import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

/**
 * GET /auth/callback
 * 
 * Handles email confirmation callbacks from Supabase
 * After user clicks confirmation link, Supabase redirects here
 * We exchange the code for a session and redirect to the app
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token_hash = searchParams.get('token_hash');
    const code = searchParams.get('code'); // Alternative format
    const type = searchParams.get('type'); // 'signup' or 'recovery' or 'email'
    const next = searchParams.get('next') || '/studio';

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://skyras-v2.vercel.app'}/login?error=config_error`
      );
    }

    const cookieStore = await cookies();
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://skyras-v2.vercel.app'}${next}`
    );

    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    // TEMPORARY: Log which params we received
    console.log('[Auth] Callback received params:', {
      token_hash: token_hash ? 'present' : 'missing',
      code: code ? 'present' : 'missing',
      type: type || 'missing',
      allParams: Object.fromEntries(searchParams.entries()),
    });

    // Supabase email confirmation can come in different formats
    // Handle both token_hash (newer) and code (older) formats
    if (token_hash && type) {
      // Newer format: token_hash + type
      const { data, error } = await supabase.auth.verifyOtp({
        type: type as 'signup' | 'email',
        token_hash,
      });

      if (error) {
        console.error('[Auth] Callback verification error (token_hash):', {
          message: error.message,
          status: error.status,
          code: (error as any).code,
        });
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || 'https://skyras-v2.vercel.app'}/login?error=verification_failed&message=${encodeURIComponent(error.message)}`
        );
      }

      if (data.user) {
        console.log('[Auth] Email confirmed successfully (token_hash):', {
          userId: data.user.id,
          email: data.user.email,
          emailConfirmedAt: data.user.email_confirmed_at,
        });
        console.log('[Auth] TEMPORARY: exchangeCodeForSession succeeded (token_hash format)');
      }
    } else if (code && type) {
      // Older format: code + type
      const { data, error } = await supabase.auth.verifyOtp({
        type: type as 'signup' | 'email',
        token: code,
      });

      if (error) {
        console.error('[Auth] Callback verification error (code):', {
          message: error.message,
          status: error.status,
          code: (error as any).code,
        });
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || 'https://skyras-v2.vercel.app'}/login?error=verification_failed&message=${encodeURIComponent(error.message)}`
        );
      }

      if (data.user) {
        console.log('[Auth] Email confirmed successfully (code):', {
          userId: data.user.id,
          email: data.user.email,
          emailConfirmedAt: data.user.email_confirmed_at,
        });
        console.log('[Auth] TEMPORARY: exchangeCodeForSession succeeded (code format)');
      }
    } else {
      // If no token_hash/code, try to get the current session (might already be set)
      // This handles cases where Supabase auto-confirms and sets session
      const { data: { user }, error: sessionError } = await supabase.auth.getUser();
      
      if (sessionError) {
        console.error('[Auth] Callback session error:', sessionError);
        // If no session and no token, redirect to login
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || 'https://skyras-v2.vercel.app'}/login?error=no_session`
        );
      } else if (user) {
        console.log('[Auth] Callback - User session found:', {
          userId: user.id,
          email: user.email,
          emailConfirmedAt: user.email_confirmed_at,
        });
      } else {
        // No user session found
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || 'https://skyras-v2.vercel.app'}/login?error=no_user`
        );
      }
    }

    // Copy all cookies to the redirect response
    response.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value);
    });

    return response;
  } catch (error) {
    console.error('[Auth] Callback unexpected error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://skyras-v2.vercel.app'}/login?error=callback_error`
    );
  }
}