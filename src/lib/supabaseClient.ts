/**
 * Frontend Supabase Client
 *
 * Provides a Supabase client configured for browser-side real-time subscriptions.
 * Uses the anon key for client-side operations (RLS enforced).
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
      params: {
        eventsPerSecond: 10, // Rate limit for real-time events
      },
    },
    auth: {
      persistSession: false, // No auth sessions for now
    },
  });

  return supabaseClient;
}
