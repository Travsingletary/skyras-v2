/**
 * Client-side Supabase client for authentication
 * 
 * Provides a Supabase client configured for browser-side operations.
 * Uses the anon key for client-side operations (RLS enforced).
 * Note: Auth is handled via server-side API routes, so this client
 * is primarily for non-auth operations.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseClient: SupabaseClient | null = null;

/**
 * Get or create the frontend Supabase client
 * 
 * Singleton pattern ensures only one client instance across the app.
 * Configured with real-time subscriptions enabled.
 */
export function getSupabaseFrontendClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
    );
  }

  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false, // Session handled server-side via cookies
    },
  });

  return supabaseClient;
}