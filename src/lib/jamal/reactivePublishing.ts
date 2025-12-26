/**
 * Reactive Publishing Mode
 * Triggers publishing from app events (file upload, drop flag, campaign start)
 * No trend scraping in MVP - only app events
 */

import { getSupabaseClient } from "@/backend/supabaseClient";
import { createLogger } from "@/lib/logger";
import { routePost, type RouterDecision } from "./decisionRouter";
import type { SocialPlatform } from "../socialPostingClient";
import type { TriggerEvent } from "./publishingQueue";

const logger = createLogger("ReactivePublishing");

export interface ReactivePublishInput {
  contentItemId: string;
  triggerEvent: TriggerEvent;
  userId: string;
  campaignId?: string;
  templateId?: string;
  platforms?: SocialPlatform[];
  immediate?: boolean; // If true, skip approval and publish immediately
}

/**
 * Trigger reactive publishing from app event
 */
export async function triggerReactivePublish(
  input: ReactivePublishInput
): Promise<{ success: boolean; postIds?: string[]; decisions?: RouterDecision[]; error?: string }> {
  try {
    // Check if reactive mode is enabled and not killed
    const killSwitchEnabled = await checkReactiveKillSwitch(input.userId);
    if (killSwitchEnabled) {
      logger.warn("Reactive publishing disabled by kill switch", { userId: input.userId });
      return {
        success: false,
        error: "Reactive publishing is disabled",
      };
    }

    const supabase = getSupabaseClient();

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

    // Check if content item has reactive_publish_enabled or drop_flag
    if (!contentItem.reactive_publish_enabled && !contentItem.drop_flag && input.triggerEvent !== "drop_flag") {
      logger.info("Content item not enabled for reactive publishing", { contentItemId: input.contentItemId });
      return {
        success: false,
        error: "Content item not enabled for reactive publishing",
      };
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
    } else if (contentItem.campaign_id) {
      const { data } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", contentItem.campaign_id)
        .single();
      campaign = data;
    }

    // Determine platforms
    const platforms = input.platforms || campaign?.platforms || ["instagram"];

    // Get template
    let template = null;
    if (input.templateId) {
      const { data } = await supabase
        .from("post_templates")
        .select("*")
        .eq("id", input.templateId)
        .single();
      template = data;
    }

    // Generate posts for each platform
    const postIds: string[] = [];
    const decisions: RouterDecision[] = [];

    for (const platform of platforms) {
      const caption = generateCaption(contentItem, template, campaign, platform);
      const hashtags = generateHashtags(contentItem, template, campaign, platform);
      const mentions = generateMentions(template, campaign);

      // Create post
      const { data: post, error: postError } = await supabase
        .from("posts")
        .insert({
          user_id: input.userId,
          content_item_id: input.contentItemId,
          campaign_id: input.campaignId || contentItem.campaign_id || null,
          template_id: input.templateId || null,
          platform,
          caption,
          media_url: contentItem.media_url,
          media_urls: contentItem.media_type === "carousel" ? [contentItem.media_url] : null,
          hashtags,
          mentions,
          publishing_mode: "reactive",
          trigger_event: input.triggerEvent,
          approval_state: input.immediate ? "auto_approved" : "pending",
          publish_state: "draft",
          scheduled_at: null, // Reactive posts publish immediately
        })
        .select()
        .single();

      if (postError) {
        logger.error("Failed to create reactive post", { platform, error: postError.message });
        continue;
      }

      postIds.push(post.id);

      // Route the post (this will queue it if approved)
      const decision = await routePost(post.id, "reactive");
      decisions.push(decision);

      logger.info("Reactive post created and routed", {
        postId: post.id,
        platform,
        triggerEvent: input.triggerEvent,
        queued: decision.shouldQueue,
      });
    }

    return {
      success: true,
      postIds,
      decisions,
    };
  } catch (error) {
    logger.error("Error in reactive publishing", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to trigger reactive publish",
    };
  }
}

/**
 * Handle file upload event (trigger reactive publishing)
 */
export async function handleFileUploadEvent(
  fileId: string,
  userId: string,
  contentItemId?: string
): Promise<{ success: boolean; triggered?: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    // Find or create content item
    let contentItemIdToUse = contentItemId;

    if (!contentItemIdToUse) {
      // Find content item by file_id
      const { data: contentItem } = await supabase
        .from("content_items")
        .select("id, reactive_publish_enabled, drop_flag")
        .eq("file_id", fileId)
        .eq("user_id", userId)
        .single();

      if (!contentItem || (!contentItem.reactive_publish_enabled && !contentItem.drop_flag)) {
        return { success: true, triggered: false }; // Not enabled for reactive publishing
      }

      contentItemIdToUse = contentItem.id;
    } else {
      // Check if content item is enabled
      const { data: contentItem } = await supabase
        .from("content_items")
        .select("reactive_publish_enabled, drop_flag")
        .eq("id", contentItemIdToUse)
        .single();

      if (!contentItem || (!contentItem.reactive_publish_enabled && !contentItem.drop_flag)) {
        return { success: true, triggered: false };
      }
    }

    // Determine trigger event
    const { data: contentItem } = await supabase
      .from("content_items")
      .select("drop_flag, campaign_id")
      .eq("id", contentItemIdToUse)
      .single();

    const triggerEvent: TriggerEvent = contentItem?.drop_flag ? "drop_flag" : "file_upload";

    // Trigger reactive publishing
    const result = await triggerReactivePublish({
      contentItemId: contentItemIdToUse,
      triggerEvent,
      userId,
      immediate: triggerEvent === "drop_flag", // Drop flag posts publish immediately
    });

    return {
      success: result.success,
      triggered: result.success && (result.postIds?.length || 0) > 0,
      error: result.error,
    };
  } catch (error) {
    logger.error("Error handling file upload event", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to handle file upload event",
    };
  }
}

/**
 * Handle campaign start event
 */
export async function handleCampaignStartEvent(
  campaignId: string,
  userId: string
): Promise<{ success: boolean; triggered?: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    // Get campaign
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("id, platforms")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      return {
        success: false,
        error: "Campaign not found",
      };
    }

    // Find content items for this campaign that are enabled for reactive publishing
    const { data: contentItems } = await supabase
      .from("content_items")
      .select("id")
      .eq("campaign_id", campaignId)
      .eq("reactive_publish_enabled", true)
      .eq("status", "approved");

    if (!contentItems || contentItems.length === 0) {
      return { success: true, triggered: false }; // No content items to publish
    }

    let triggered = false;

    // Trigger reactive publishing for each content item
    for (const contentItem of contentItems) {
      const result = await triggerReactivePublish({
        contentItemId: contentItem.id,
        triggerEvent: "campaign_start",
        userId,
        campaignId,
      });

      if (result.success && result.postIds && result.postIds.length > 0) {
        triggered = true;
      }
    }

    return {
      success: true,
      triggered,
    };
  } catch (error) {
    logger.error("Error handling campaign start event", {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to handle campaign start event",
    };
  }
}

// Helper functions (shared with scheduled publishing)
function generateCaption(contentItem: any, template: any, campaign: any, platform: SocialPlatform): string {
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

  if (campaign?.cta) {
    return `${contentItem.title || "New Content"}\n\n${campaign.cta}`;
  }

  return contentItem.title || contentItem.description || "Check this out!";
}

function generateHashtags(contentItem: any, template: any, campaign: any, platform: SocialPlatform): string[] {
  const hashtags: string[] = [];

  if (template?.hashtag_template) {
    hashtags.push(...template.hashtag_template);
  }

  if (contentItem?.tags) {
    hashtags.push(...contentItem.tags.map((tag: string) => `#${tag.replace(/\s+/g, "")}`));
  }

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

async function checkReactiveKillSwitch(userId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();

    const { data: userSettings } = await supabase
      .from("publishing_settings")
      .select("reactive_mode_kill_switch")
      .eq("user_id", userId)
      .single();

    if (userSettings) {
      return userSettings.reactive_mode_kill_switch === true;
    }

    const { data: globalSettings } = await supabase
      .from("publishing_settings")
      .select("reactive_mode_kill_switch")
      .is("user_id", null)
      .single();

    return globalSettings?.reactive_mode_kill_switch === true;
  } catch {
    return false;
  }
}






