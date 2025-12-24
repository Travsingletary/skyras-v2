/**
 * Jamal Decision Router
 * Routes posts to either scheduled or reactive publishing based on configuration
 */

import { getSupabaseClient } from "@/backend/supabaseClient";
import { createLogger } from "@/lib/logger";
import { queuePublishingJob, type PublishingMode } from "./publishingQueue";

const logger = createLogger("DecisionRouter");

export interface RouterDecision {
  mode: PublishingMode;
  shouldQueue: boolean;
  reason: string;
}

/**
 * Route a post to the appropriate publishing mode
 */
export async function routePost(
  postId: string,
  forceMode?: PublishingMode
): Promise<RouterDecision> {
  try {
    const supabase = getSupabaseClient();

    // Get post details
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("publishing_mode, approval_state, publish_state, scheduled_at, trigger_event, user_id")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      logger.error("Post not found for routing", { postId, error: postError?.message });
      return {
        mode: "scheduled",
        shouldQueue: false,
        reason: "Post not found",
      };
    }

    // Check kill switch for reactive mode
    if (!forceMode && post.publishing_mode === "reactive") {
      const killSwitchEnabled = await checkReactiveKillSwitch(post.user_id);
      if (killSwitchEnabled) {
        logger.warn("Reactive mode disabled by kill switch", { postId, userId: post.user_id });
        return {
          mode: "reactive",
          shouldQueue: false,
          reason: "Reactive mode disabled by kill switch",
        };
      }
    }

    // Determine mode
    const mode = forceMode || post.publishing_mode || "scheduled";

    // Check approval requirements
    if (post.approval_state !== "approved" && post.approval_state !== "auto_approved") {
      const requireApproval = await checkRequireApproval(post.user_id);
      if (requireApproval) {
        logger.info("Post requires approval before publishing", { postId, approvalState: post.approval_state });
        return {
          mode,
          shouldQueue: false,
          reason: "Post requires approval",
        };
      }
    }

    // For scheduled mode, check if scheduled time has arrived
    if (mode === "scheduled") {
      if (!post.scheduled_at) {
        return {
          mode,
          shouldQueue: false,
          reason: "Scheduled time not set",
        };
      }

      const scheduledTime = new Date(post.scheduled_at);
      const now = new Date();

      if (scheduledTime > now) {
        // Not yet time to publish
        return {
          mode,
          shouldQueue: false,
          reason: `Scheduled for ${scheduledTime.toISOString()}`,
        };
      }
    }

    // Check if post is already queued or published
    if (post.publish_state === "published" || post.publish_state === "publishing") {
      return {
        mode,
        shouldQueue: false,
        reason: `Post already ${post.publish_state}`,
      };
    }

    // Queue the job
    const rateLimitKey = await getRateLimitKey(postId);
    const queueResult = await queuePublishingJob(postId, mode, {
      rateLimitKey,
      priority: mode === "reactive" ? 3 : 5, // Reactive posts get higher priority
    });

    if (!queueResult.success) {
      return {
        mode,
        shouldQueue: false,
        reason: queueResult.error || "Failed to queue job",
      };
    }

    // Update post state
    await supabase
      .from("posts")
      .update({
        publish_state: "queued",
        queued_at: new Date().toISOString(),
      })
      .eq("id", postId);

    logger.info("Post routed and queued", {
      postId,
      mode,
      jobId: queueResult.jobId,
      triggerEvent: post.trigger_event,
    });

    return {
      mode,
      shouldQueue: true,
      reason: `Queued for ${mode} publishing`,
    };
  } catch (error) {
    logger.error("Error routing post", {
      postId,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      mode: "scheduled",
      shouldQueue: false,
      reason: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check if reactive mode kill switch is enabled
 */
async function checkReactiveKillSwitch(userId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();

    // Check user-specific settings first
    const { data: userSettings } = await supabase
      .from("publishing_settings")
      .select("reactive_mode_kill_switch")
      .eq("user_id", userId)
      .single();

    if (userSettings) {
      return userSettings.reactive_mode_kill_switch === true;
    }

    // Check global settings
    const { data: globalSettings } = await supabase
      .from("publishing_settings")
      .select("reactive_mode_kill_switch")
      .is("user_id", null)
      .single();

    return globalSettings?.reactive_mode_kill_switch === true;
  } catch {
    return false; // Default to not killing if check fails
  }
}

/**
 * Check if approval is required
 */
async function checkRequireApproval(userId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();

    const { data: userSettings } = await supabase
      .from("publishing_settings")
      .select("require_approval")
      .eq("user_id", userId)
      .single();

    if (userSettings) {
      return userSettings.require_approval === true;
    }

    // Check global settings
    const { data: globalSettings } = await supabase
      .from("publishing_settings")
      .select("require_approval")
      .is("user_id", null)
      .single();

    return globalSettings?.require_approval !== false; // Default to requiring approval
  } catch {
    return true; // Default to requiring approval
  }
}

/**
 * Get rate limit key for a post
 */
async function getRateLimitKey(postId: string): Promise<string | undefined> {
  try {
    const supabase = getSupabaseClient();

    const { data: post } = await supabase
      .from("posts")
      .select("user_id, platform, account_id")
      .eq("id", postId)
      .single();

    if (!post) {
      return undefined;
    }

    // Format: platform_userId_accountId
    const accountPart = post.account_id ? `_${post.account_id}` : "";
    return `${post.platform}_${post.user_id}${accountPart}`;
  } catch {
    return undefined;
  }
}




