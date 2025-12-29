import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

export async function POST(request: NextRequest) {
  try {
    // Safely parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid request body. Expected JSON.' },
        { status: 400 }
      );
    }

    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();
    
    // Create response object for cookie handling
    const response = new NextResponse(null, { status: 200 });

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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Log full error object for debugging
      console.error('[Auth] Login error - Full error object:', {
        message: error.message,
        status: error.status,
        name: error.name,
        code: (error as any).code,
        error_description: (error as any).error_description,
      });
      
      // Check if it's an email confirmation error
      const isEmailNotConfirmed = 
        error.message?.toLowerCase().includes('email not confirmed') ||
        error.message?.toLowerCase().includes('email_not_confirmed') ||
        (error as any).code === 'email_not_confirmed' ||
        (error as any).error_description?.toLowerCase().includes('email not confirmed');
      
      // Only return "Email not confirmed" if that's actually the error
      const errorMessage = isEmailNotConfirmed 
        ? 'Email not confirmed. Please check your email and click the confirmation link.'
        : error.message || 'Login failed';
      
      // Create JSON response and copy cookies
      const errorResponse = NextResponse.json(
        { error: errorMessage },
        { status: 401 }
      );
      // Copy all cookies from the response object
      response.cookies.getAll().forEach((cookie) => {
        errorResponse.cookies.set(cookie.name, cookie.value);
      });
      return errorResponse;
    }

    if (!data.user) {
      console.error('[Auth] Login failed: No user data returned');
      // Create JSON response and copy cookies
      const errorResponse = NextResponse.json(
        { error: 'Login failed' },
        { status: 401 }
      );
      // Copy all cookies from the response object
      response.cookies.getAll().forEach((cookie) => {
        errorResponse.cookies.set(cookie.name, cookie.value);
      });
      return errorResponse;
    }

    // Force session refresh to ensure we have the latest user state
    // This is critical after email confirmation
    const { data: { user: refreshedUser }, error: refreshError } = await supabase.auth.getUser();
    
    if (refreshError) {
      console.error('[Auth] Session refresh error:', refreshError);
    }
    
    // Log user confirmation status for debugging
    console.log('[Auth] Login successful:', {
      userId: data.user.id,
      email: data.user.email,
      emailConfirmed: data.user.email_confirmed_at !== null,
      emailConfirmedAt: data.user.email_confirmed_at,
      refreshedEmailConfirmed: refreshedUser?.email_confirmed_at !== null,
    });

    // Create success JSON response and copy cookies
    const successResponse = NextResponse.json(
      {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      },
      { status: 200 }
    );
    
    // Copy all cookies from the response object
    response.cookies.getAll().forEach((cookie) => {
      successResponse.cookies.set(cookie.name, cookie.value);
    });
    
    return successResponse;
  } catch (error) {
    // Catch all errors and ensure we always return valid JSON
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Auth] Unexpected login error:', errorMessage);
    
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}