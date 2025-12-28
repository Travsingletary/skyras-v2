/**
 * Authentication utilities for server-side API routes
 * 
 * Provides server-side user identity from Supabase auth session.
 * Uses cookie-based sessions via @supabase/ssr.
 */

import { getAuthenticatedUserId as getUserIdFromServer } from './supabaseServer';

/**
 * Get authenticated user ID from request (server-side only)
 * 
 * Extracts user identity from Supabase auth session stored in cookies.
 * Uses @supabase/ssr for proper cookie-based session handling.
 * 
 * @param request Next.js request object (kept for backward compatibility, not used)
 * @returns User ID string or null if unauthenticated
 */
export async function getAuthenticatedUserId(request?: unknown): Promise<string | null> {
  try {
    return await getUserIdFromServer();
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