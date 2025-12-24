/**
 * Publishing Guardrails
 * Rate limiting, cooldown, approval checks, kill switches
 */

import { getSupabaseClient } from "@/backend/supabaseClient";
import { createLogger } from "@/lib/logger";
import type { SocialPlatform } from "../socialPostingClient";

const logger = createLogger("Guardrails");

export interface PublishingSettings {
  requireApproval: boolean;
  autoApproveCampaigns: boolean;
  reactiveModeEnabled: boolean;
  reactiveModeKillSwitch: boolean;
  rateLimitEnabled: boolean;
  rateLimitConfig: Record<string, { maxPerHour: number; cooldownMinutes: number }>;
  maxRetries: number;
  retryDelayMinutes: number;
  retryBackoffMultiplier: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
  resetAt?: string;
  cooldownMinutes?: number;
}

/**
 * Get publishing settings for a user (with global fallback)
 */
export async function getPublishingSettings(userId: string): Promise<PublishingSettings> {
  try {
    const supabase = getSupabaseClient();

    // Get user-specific settings
    const { data: userSettings } = await supabase
      .from("publishing_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Get global settings
    const { data: globalSettings } = await supabase
      .from("publishing_settings")
      .select("*")
      .is("user_id", null)
      .single();

    // Merge: user settings override global
    const settings = {
      requireApproval: userSettings?.require_approval ?? globalSettings?.require_approval ?? true,
      autoApproveCampaigns: userSettings?.auto_approve_campaigns ?? globalSettings?.auto_approve_campaigns ?? false,
      reactiveModeEnabled: userSettings?.reactive_mode_enabled ?? globalSettings?.reactive_mode_enabled ?? true,
      reactiveModeKillSwitch: userSettings?.reactive_mode_kill_switch ?? globalSettings?.reactive_mode_kill_switch ?? false,
      rateLimitEnabled: userSettings?.rate_limit_enabled ?? globalSettings?.rate_limit_enabled ?? true,
      rateLimitConfig: userSettings?.rate_limit_config ?? globalSettings?.rate_limit_config ?? getDefaultRateLimitConfig(),
      maxRetries: userSettings?.max_retries ?? globalSettings?.max_retries ?? 3,
      retryDelayMinutes: userSettings?.retry_delay_minutes ?? globalSettings?.retry_delay_minutes ?? 15,
      retryBackoffMultiplier: parseFloat(userSettings?.retry_backoff_multiplier ?? globalSettings?.retry_backoff_multiplier ?? "2.0"),
    };

    return settings;
  } catch (error) {
    logger.error("Error getting publishing settings", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return getDefaultSettings();
  }
}

/**
 * Check rate limit for a platform
 */
export async function checkRateLimit(
  userId: string,
  platform: SocialPlatform,
  rateLimitKey: string
): Promise<RateLimitResult> {
  try {
    const settings = await getPublishingSettings(userId);

    if (!settings.rateLimitEnabled) {
      return { allowed: true };
    }

    const platformConfig = settings.rateLimitConfig[platform];
    if (!platformConfig) {
      return { allowed: true }; // No config = no limit
    }

    // TODO: Implement actual rate limit tracking
    // For MVP, we'll use a simple check against recent posts in the database
    // In production, use Redis or similar for accurate rate limiting

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const supabase = getSupabaseClient();

    const { data: recentPosts, error } = await supabase
      .from("posts")
      .select("id")
      .eq("user_id", userId)
      .eq("platform", platform)
      .eq("publish_state", "published")
      .gte("published_at", oneHourAgo.toISOString());

    if (error) {
      logger.error("Error checking rate limit", { userId, platform, error: error.message });
      return { allowed: true }; // Fail open if check fails
    }

    const recentCount = recentPosts?.length || 0;
    const maxPerHour = platformConfig.maxPerHour;

    if (recentCount >= maxPerHour) {
      logger.warn("Rate limit exceeded", {
        userId,
        platform,
        recentCount,
        maxPerHour,
        cooldownMinutes: platformConfig.cooldownMinutes,
      });

      return {
        allowed: false,
        cooldownMinutes: platformConfig.cooldownMinutes,
      };
    }

    return {
      allowed: true,
      remaining: maxPerHour - recentCount,
    };
  } catch (error) {
    logger.error("Error in rate limit check", {
      userId,
      platform,
      error: error instanceof Error ? error.message : String(error),
    });
    return { allowed: true }; // Fail open
  }
}

/**
 * Get rate limit configuration for a platform
 */
export function getRateLimitConfig(platform: SocialPlatform): { maxPerHour: number; cooldownMinutes: number } {
  const defaultConfig = getDefaultRateLimitConfig();
  return defaultConfig[platform] || { maxPerHour: 5, cooldownMinutes: 15 };
}

/**
 * Default rate limit configuration per platform
 */
function getDefaultRateLimitConfig(): Record<string, { maxPerHour: number; cooldownMinutes: number }> {
  return {
    instagram: { maxPerHour: 3, cooldownMinutes: 20 },
    tiktok: { maxPerHour: 5, cooldownMinutes: 15 },
    twitter: { maxPerHour: 10, cooldownMinutes: 10 },
    linkedin: { maxPerHour: 5, cooldownMinutes: 15 },
    facebook: { maxPerHour: 10, cooldownMinutes: 10 },
    youtube: { maxPerHour: 2, cooldownMinutes: 30 },
  };
}

/**
 * Default publishing settings
 */
function getDefaultSettings(): PublishingSettings {
  return {
    requireApproval: true,
    autoApproveCampaigns: false,
    reactiveModeEnabled: true,
    reactiveModeKillSwitch: false,
    rateLimitEnabled: true,
    rateLimitConfig: getDefaultRateLimitConfig(),
    maxRetries: 3,
    retryDelayMinutes: 15,
    retryBackoffMultiplier: 2.0,
  };
}

/**
 * Check if reactive mode is enabled (not killed)
 */
export async function isReactiveModeEnabled(userId: string): Promise<boolean> {
  try {
    const settings = await getPublishingSettings(userId);
    return settings.reactiveModeEnabled && !settings.reactiveModeKillSwitch;
  } catch {
    return false; // Fail closed
  }
}

/**
 * Toggle reactive mode kill switch
 */
export async function setReactiveKillSwitch(userId: string | null, enabled: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    // Upsert settings
    const { error } = await supabase
      .from("publishing_settings")
      .upsert({
        user_id: userId,
        reactive_mode_kill_switch: enabled,
      }, {
        onConflict: "user_id",
      });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    logger.info("Reactive kill switch toggled", { userId, enabled });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle kill switch",
    };
  }
}

/**
 * Update approval requirement
 */
export async function setRequireApproval(userId: string | null, require: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("publishing_settings")
      .upsert({
        user_id: userId,
        require_approval: require,
      }, {
        onConflict: "user_id",
      });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    logger.info("Approval requirement updated", { userId, require });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update approval requirement",
    };
  }
}




