/**
 * Authentication utilities for server-side API routes
 * 
 * Provides server-side user identity from Supabase auth session.
 * Eliminates client-supplied userId parameters for security.
 */

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

/**
 * Get authenticated user ID from request (server-side only)
 * 
 * Extracts user identity from Supabase auth session via:
 * 1. Authorization header (Bearer token)
 * 2. Cookies (Supabase session cookies)
 * 
 * Returns null if no valid session is found (unauthenticated).
 * 
 * @param request Next.js request object
 * @returns User ID string or null if unauthenticated
 */
export async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('[Auth] Supabase URL/Key not configured, cannot extract user identity');
      return null;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });

    // Try Authorization header first (Bearer token)
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user?.id) {
        return user.id;
      }
    }

    // Try cookies (Supabase session cookies)
    try {
      const cookieStore = await cookies();
      const accessToken = cookieStore.get('sb-access-token')?.value || 
                         cookieStore.get(`${SUPABASE_URL.split('//')[1]?.split('.')[0]}-auth-token`)?.value;
      
      if (accessToken) {
        const { data: { user }, error } = await supabase.auth.getUser(accessToken);
        
        if (!error && user?.id) {
          return user.id;
        }
      }
    } catch (cookieError) {
      // cookies() not available in this context (expected in some Next.js runtimes)
    }

    // No valid session found
    return null;
  } catch (error) {
    console.error('[Auth] Error extracting user identity:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * Log auth-derived user identity (no PII)
 * 
 * @param route API route path
 * @param userId User ID (can be null)
 */
export function logAuthIdentity(route: string, userId: string | null): void {
  console.log(
    `[AUTH] derived_user=${userId ? 'true' : 'false'} route=${route}`
  );
}