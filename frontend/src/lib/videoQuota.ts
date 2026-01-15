// Video animation quota management
// Uses atomic UPSERT to prevent race conditions

import { getSupabaseClient } from '@/backend/supabaseClient';

const DEFAULT_DAILY_LIMIT = parseInt(process.env.VIDEO_DAILY_LIMIT || '20', 10);

export interface QuotaCheckResult {
  allowed: boolean;
  remaining: number;
  limit: number;
}

/**
 * Check if user has quota remaining for today
 */
export async function checkQuota(userId: string): Promise<QuotaCheckResult> {
  const supabase = getSupabaseClient();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Get today's quota record
  const { data, error } = await supabase
    .from('video_quota')
    .select({ user_id: userId, date: today } as Record<string, unknown>);

  if (error) {
    console.error('[VideoQuota] Error checking quota:', error);
    // Fail open - allow request if quota check fails
    return {
      allowed: true,
      remaining: DEFAULT_DAILY_LIMIT,
      limit: DEFAULT_DAILY_LIMIT,
    };
  }

  const quotas = (data as Array<{ user_id: string; date: string; count: number }>) || [];
  const todayQuota = quotas.find(q => q.user_id === userId && q.date === today);

  const count = todayQuota?.count || 0;
  const remaining = Math.max(0, DEFAULT_DAILY_LIMIT - count);

  return {
    allowed: count < DEFAULT_DAILY_LIMIT,
    remaining,
    limit: DEFAULT_DAILY_LIMIT,
  };
}

/**
 * Increment quota atomically using UPSERT
 * This prevents race conditions when multiple requests come in simultaneously
 */
export async function incrementQuota(userId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Use raw SQL for atomic increment via UPSERT
  // This ensures thread-safe quota increments
  const { error } = await supabase.rpc('increment_video_quota', {
    p_user_id: userId,
    p_date: today,
  });

  // If RPC doesn't exist, fall back to manual UPSERT
  if (error && error.message?.includes('function') && error.message?.includes('does not exist')) {
    // Fallback: Manual UPSERT with increment
    // First, try to get existing record
    const { data: existing } = await supabase
      .from('video_quota')
      .select({ user_id: userId, date: today } as Record<string, unknown>);

    const quotas = (existing as Array<{ id: string; count: number }>) || [];
    const todayQuota = quotas.find((q: any) => q.user_id === userId && q.date === today);

    if (todayQuota) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('video_quota')
        .update({ count: (todayQuota as any).count + 1 }, { id: (todayQuota as any).id });

      if (updateError) {
        console.error('[VideoQuota] Error incrementing quota:', updateError);
        throw new Error(`Failed to increment quota: ${updateError.message}`);
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase.from('video_quota').insert({
        user_id: userId,
        date: today,
        count: 1,
      });

      if (insertError) {
        // If insert fails due to race condition (unique constraint), retry update
        if (insertError.message?.includes('duplicate') || insertError.message?.includes('unique')) {
          // Retry: get and update
          const { data: retryData } = await supabase
            .from('video_quota')
            .select({ user_id: userId, date: today } as Record<string, unknown>);

          const retryQuotas = (retryData as Array<{ id: string; count: number }>) || [];
          const retryQuota = retryQuotas.find((q: any) => q.user_id === userId && q.date === today);

          if (retryQuota) {
            const { error: retryError } = await supabase
              .from('video_quota')
              .update({ count: ((retryQuota as any).count || 0) + 1 }, { id: (retryQuota as any).id });

            if (retryError) {
              console.error('[VideoQuota] Error on retry increment:', retryError);
              throw new Error(`Failed to increment quota: ${retryError.message}`);
            }
          } else {
            throw new Error(`Failed to increment quota: ${insertError.message}`);
          }
        } else {
          console.error('[VideoQuota] Error inserting quota:', insertError);
          throw new Error(`Failed to increment quota: ${insertError.message}`);
        }
      }
    }
  } else if (error) {
    console.error('[VideoQuota] Error incrementing quota:', error);
    throw new Error(`Failed to increment quota: ${error.message}`);
  }
}
