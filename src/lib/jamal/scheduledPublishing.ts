/**
 * Scheduled Publishing Mode
 * Generates drafts, schedules them, and publishes at scheduled times
 */

import { getSupabaseClient } from "@/backend/supabaseClient";
import { createLogger } from "@/lib/logger";
import { routePost } from "./decisionRouter";
import type { SocialPlatform } from "../socialPostingClient";

const logger = createLogger("ScheduledPublishing");

export interface GeneratePostDraftInput {
  contentItemId: string;
  campaignId?: string;
  templateId?: string;
  platforms: SocialPlatform[];
  scheduledAt: string;
  userId: string;
}

export interface SchedulePostInput {
  contentItemId: string;
  campaignId?: string;
  templateId?: string;
  platform: SocialPlatform;
  caption: string;
  mediaUrl?: string;
  mediaUrls?: string[];
  hashtags?: string[];
  mentions?: string[];
  scheduledAt: string;
  userId: string;
  accountId?: string;
}

/**
 * Generate post drafts from content item for multiple platforms
 */
export async function generatePostDrafts(
  input: GeneratePostDraftInput
): Promise<{ success: boolean; postIds?: string[]; error?: string }> {
  try {
    const supabase = getSupabaseClient();
    const postIds: string[] = [];

    // Get content item
    const { data: contentItem, error: contentError } = await supabase
      .from("content_items")
      .select("*")
      .eq("id", input.contentItemId)
      .single();

    if (contentError || !contentItem) {
      return {
        success: false,
        error: "Content item not found",
      };
    }

    // Get template if provided
    let template = null;
    if (input.templateId) {
      const { data } = await supabase
        .from("post_templates")
        .select("*")
        .eq("id", input.templateId)
        .single();
      template = data;
    }

    // Get campaign if provided
    let campaign = null;
    if (input.campaignId) {
      const { data } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", input.campaignId)
        .single();
      campaign = data;
    }

    // Generate drafts for each platform
    for (const platform of input.platforms) {
      const caption = generateCaption(contentItem, template, campaign, platform);
      const hashtags = generateHashtags(contentItem, template, campaign, platform);
      const mentions = generateMentions(template, campaign);

      const { data: post, error: postError } = await supabase
        .from("posts")
        .insert({
          user_id: input.userId,
          content_item_id: input.contentItemId,
          campaign_id: input.campaignId || null,
          template_id: input.templateId || null,
          platform,
          caption,
          media_url: contentItem.media_url,
          media_urls: contentItem.media_type === "carousel" ? [contentItem.media_url] : null,
          hashtags,
          mentions,
          publishing_mode: "scheduled",
          scheduled_at: input.scheduledAt,
          approval_state: await shouldAutoApprove(input.userId, input.campaignId) ? "auto_approved" : "pending",
          publish_state: "draft",
        })
        .select()
        .single();

      if (postError) {
        logger.error("Failed to create post draft", { platform, error: postError.message });
        continue;
      }

      postIds.push(post.id);
    }

    logger.info("Generated post drafts", {
      contentItemId: input.contentItemId,
      platformCount: input.platforms.length,
      postIds,
    });

    return {
      success: true,
      postIds,
    };
  } catch (error) {
    logger.error("Error generating post drafts", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate drafts",
    };
  }
}

/**
 * Schedule a single post
 */
export async function schedulePost(input: SchedulePostInput): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({
        user_id: input.userId,
        content_item_id: input.contentItemId,
        campaign_id: input.campaignId || null,
        template_id: input.templateId || null,
        platform: input.platform,
        caption: input.caption,
        media_url: input.mediaUrl || null,
        media_urls: input.mediaUrls || null,
        hashtags: input.hashtags || null,
        mentions: input.mentions || null,
        publishing_mode: "scheduled",
        scheduled_at: input.scheduledAt,
        approval_state: await shouldAutoApprove(input.userId, input.campaignId) ? "auto_approved" : "pending",
        publish_state: "draft",
        account_id: input.accountId || null,
      })
      .select()
      .single();

    if (postError) {
      return {
        success: false,
        error: postError.message,
      };
    }

    logger.info("Post scheduled", { postId: post.id, platform: input.platform, scheduledAt: input.scheduledAt });

    return {
      success: true,
      postId: post.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to schedule post",
    };
  }
}

/**
 * Process scheduled posts that are due (called by scheduler)
 */
export async function processScheduledPosts(): Promise<{ processed: number; queued: number; errors: number }> {
  try {
    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    // Find posts that are scheduled and due
    const { data: duePosts, error } = await supabase
      .from("posts")
      .select("id")
      .eq("publishing_mode", "scheduled")
      .eq("publish_state", "draft")
      .lte("scheduled_at", now)
      .in("approval_state", ["approved", "auto_approved"])
      .limit(50);

    if (error || !duePosts) {
      logger.error("Error finding due posts", { error: error?.message });
      return { processed: 0, queued: 0, errors: 1 };
    }

    let queued = 0;
    let errors = 0;

    for (const post of duePosts) {
      const decision = await routePost(post.id, "scheduled");
      if (decision.shouldQueue) {
        queued++;
      } else if (decision.reason !== "Post requires approval" && decision.reason !== "Scheduled time not set") {
        errors++;
      }
    }

    logger.info("Processed scheduled posts", { processed: duePosts.length, queued, errors });

    return {
      processed: duePosts.length,
      queued,
      errors,
    };
  } catch (error) {
    logger.error("Error processing scheduled posts", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { processed: 0, queued: 0, errors: 1 };
  }
}

// Helper functions for generating content
function generateCaption(contentItem: any, template: any, campaign: any, platform: SocialPlatform): string {
  // Use template if available
  if (template?.caption_template) {
    let caption = template.caption_template;
    caption = caption.replace("{title}", contentItem.title || "");
    caption = caption.replace("{description}", contentItem.description || "");
    if (campaign) {
      caption = caption.replace("{theme}", campaign.theme || "");
      caption = caption.replace("{cta}", campaign.cta || "");
    }
    return caption;
  }

  // Use campaign CTA if available
  if (campaign?.cta) {
    return `${contentItem.title || "New Content"}\n\n${campaign.cta}`;
  }

  // Default caption
  return contentItem.title || contentItem.description || "Check this out!";
}

function generateHashtags(contentItem: any, template: any, campaign: any, platform: SocialPlatform): string[] {
  const hashtags: string[] = [];

  // Add template hashtags
  if (template?.hashtag_template) {
    hashtags.push(...template.hashtag_template);
  }

  // Add content item tags
  if (contentItem?.tags) {
    hashtags.push(...contentItem.tags.map((tag: string) => `#${tag.replace(/\s+/g, "")}`));
  }

  // Platform-specific defaults (limit to 5-10 per platform)
  const maxHashtags = platform === "instagram" ? 10 : platform === "tiktok" ? 5 : 3;
  return hashtags.slice(0, maxHashtags);
}

function generateMentions(template: any, campaign: any): string[] {
  const mentions: string[] = [];

  if (template?.mention_template) {
    mentions.push(...template.mention_template);
  }

  return mentions;
}

async function shouldAutoApprove(userId: string, campaignId?: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();

    // Check campaign auto-approve setting
    if (campaignId) {
      const { data: campaign } = await supabase
        .from("campaigns")
        .select("auto_approve")
        .eq("id", campaignId)
        .single();

      if (campaign?.auto_approve) {
        return true;
      }
    }

    // Check user settings
    const { data: settings } = await supabase
      .from("publishing_settings")
      .select("auto_approve_campaigns, require_approval")
      .eq("user_id", userId)
      .single();

    if (settings) {
      if (campaignId && settings.auto_approve_campaigns) {
        return true;
      }
      return settings.require_approval === false;
    }

    // Check global settings
    const { data: globalSettings } = await supabase
      .from("publishing_settings")
      .select("auto_approve_campaigns, require_approval")
      .is("user_id", null)
      .single();

    if (globalSettings) {
      if (campaignId && globalSettings.auto_approve_campaigns) {
        return true;
      }
      return globalSettings.require_approval === false;
    }

    return false; // Default to requiring approval
  } catch {
    return false;
  }
}






