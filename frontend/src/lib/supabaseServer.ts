/**
 * Server-side Supabase client for authentication
 * Uses cookie-based sessions for Next.js API routes
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required');
}

/**
 * Get Supabase client for server-side API routes (cookie-based auth)
 * 
 * This client automatically reads/writes auth session from cookies
 */
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch (error) {
          // Cookies can only be set in Server Components or Route Handlers
          // This is expected in some contexts
        }
      },
    },
  });
}

/**
 * Get authenticated user from request (for API routes)
 * 
 * Extracts user identity from Supabase auth session stored in cookies
 */
export async function getAuthenticatedUser() {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('[Auth] Error getting authenticated user:', error);
    return null;
  }
}

/**
 * Get authenticated user ID from request (for API routes)
 * 
 * Returns the user ID string or null if not authenticated
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  const user = await getAuthenticatedUser();
  return user?.id || null;
}