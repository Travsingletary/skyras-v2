/**
 * Jamal Actions V2 - Dual-Mode Publishing System
 * Scheduled and Reactive publishing modes with unified queue
 */

import { AgentRunResult } from "@/agents/core/BaseAgent";
import { generatePostDrafts, schedulePost as schedulePostV2, processScheduledPosts } from "@/lib/jamal/scheduledPublishing";
import { triggerReactivePublish, handleFileUploadEvent, handleCampaignStartEvent } from "@/lib/jamal/reactivePublishing";
import { routePost } from "@/lib/jamal/decisionRouter";
import { getPublishingSettings, setReactiveKillSwitch, setRequireApproval } from "@/lib/jamal/guardrails";
import { getSupabaseClient } from "@/backend/supabaseClient";
import type { SocialPlatform } from "@/lib/socialPostingClient";
import type { TriggerEvent } from "@/lib/jamal/publishingQueue";

export interface GenerateDraftsInput {
  project: string;
  userId: string;
  contentItemId: string;
  campaignId?: string;
  templateId?: string;
  platforms: SocialPlatform[];
  scheduledAt: string;
}

export interface SchedulePostInput {
  project: string;
  userId: string;
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
  accountId?: string;
}

export interface ReactivePublishInput {
  project: string;
  userId: string;
  contentItemId: string;
  triggerEvent?: TriggerEvent;
  campaignId?: string;
  templateId?: string;
  platforms?: SocialPlatform[];
  immediate?: boolean;
}

export interface ManageSettingsInput {
  userId: string;
  requireApproval?: boolean;
  reactiveKillSwitch?: boolean;
}

function baseMetadata(project: string) {
  return {
    agent: "jamal",
    project,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate post drafts from content item (Scheduled mode)
 */
export async function generateDrafts(
  _: unknown,
  input: GenerateDraftsInput
): Promise<AgentRunResult> {
  if (!input.project || !input.userId || !input.contentItemId || !input.platforms.length) {
    throw new Error("project, userId, contentItemId, and platforms are required");
  }

  const result = await generatePostDrafts({
    contentItemId: input.contentItemId,
    campaignId: input.campaignId,
    templateId: input.templateId,
    platforms: input.platforms,
    scheduledAt: input.scheduledAt,
    userId: input.userId,
  });

  if (!result.success) {
    throw new Error(result.error || "Failed to generate drafts");
  }

  return {
    output: `Generated ${result.postIds?.length || 0} post draft(s) for ${input.platforms.join(", ")} scheduled for ${input.scheduledAt}`,
    notes: {
      postIds: result.postIds,
      platforms: input.platforms,
      scheduledAt: input.scheduledAt,
      metadata: baseMetadata(input.project),
    },
  };
}

/**
 * Schedule a single post (Scheduled mode)
 */
export async function schedulePost(
  _: unknown,
  input: SchedulePostInput
): Promise<AgentRunResult> {
  if (!input.project || !input.userId || !input.contentItemId || !input.caption || !input.platform || !input.scheduledAt) {
    throw new Error("project, userId, contentItemId, caption, platform, and scheduledAt are required");
  }

  const result = await schedulePostV2({
    contentItemId: input.contentItemId,
    campaignId: input.campaignId,
    templateId: input.templateId,
    platform: input.platform,
    caption: input.caption,
    mediaUrl: input.mediaUrl,
    mediaUrls: input.mediaUrls,
    hashtags: input.hashtags,
    mentions: input.mentions,
    scheduledAt: input.scheduledAt,
    userId: input.userId,
    accountId: input.accountId,
  });

  if (!result.success) {
    throw new Error(result.error || "Failed to schedule post");
  }

  // Route the post (will queue if approved and ready)
  const routing = await routePost(result.postId!, "scheduled");

  return {
    output: `Post scheduled for ${input.platform} on ${input.scheduledAt}. ${routing.shouldQueue ? "Queued for publishing." : `Status: ${routing.reason}`}`,
    notes: {
      postId: result.postId,
      scheduledAt: input.scheduledAt,
      platform: input.platform,
      queued: routing.shouldQueue,
      routingReason: routing.reason,
      metadata: baseMetadata(input.project),
    },
  };
}

/**
 * Trigger reactive publishing (Reactive mode)
 */
export async function reactivePublish(
  _: unknown,
  input: ReactivePublishInput
): Promise<AgentRunResult> {
  if (!input.project || !input.userId || !input.contentItemId) {
    throw new Error("project, userId, and contentItemId are required");
  }

  const result = await triggerReactivePublish({
    contentItemId: input.contentItemId,
    triggerEvent: input.triggerEvent || "manual",
    userId: input.userId,
    campaignId: input.campaignId,
    templateId: input.templateId,
    platforms: input.platforms,
    immediate: input.immediate,
  });

  if (!result.success) {
    throw new Error(result.error || "Failed to trigger reactive publish");
  }

  const queuedCount = result.decisions?.filter(d => d.shouldQueue).length || 0;
  const platformList = result.postIds?.length ? "platforms" : "no platforms";

  return {
    output: `Reactive publishing triggered for ${platformList}. ${queuedCount} post(s) queued for publishing.`,
    notes: {
      postIds: result.postIds,
      queuedCount,
      decisions: result.decisions,
      triggerEvent: input.triggerEvent || "manual",
      metadata: baseMetadata(input.project),
    },
  };
}

/**
 * Get posts (scheduled or reactive)
 */
export async function getPosts(
  _: unknown,
  input: { userId: string; mode?: "scheduled" | "reactive"; status?: string; platform?: SocialPlatform; projectId?: string }
): Promise<AgentRunResult> {
  if (!input.userId) {
    throw new Error("userId is required");
  }

  const supabase = getSupabaseClient();
  let query = supabase
    .from("posts")
    .select("*")
    .eq("user_id", input.userId)
    .order("created_at", { ascending: false });

  if (input.mode) {
    query = query.eq("publishing_mode", input.mode);
  }
  if (input.status) {
    query = query.eq("publish_state", input.status);
  }
  if (input.platform) {
    query = query.eq("platform", input.platform);
  }
  if (input.projectId) {
    query = query.eq("project_id", input.projectId);
  }

  const { data: posts, error } = await query.limit(100);

  if (error) {
    throw new Error(`Failed to fetch posts: ${error.message}`);
  }

  const count = posts?.length || 0;
  const modeFilter = input.mode ? ` in ${input.mode} mode` : "";
  const statusFilter = input.status ? ` with status ${input.status}` : "";

  return {
    output: `Found ${count} post(s)${modeFilter}${statusFilter}`,
    notes: {
      posts: posts || [],
      count,
      metadata: {
        agent: "jamal",
        timestamp: new Date().toISOString(),
      },
    },
  };
}

/**
 * Approve a post
 */
export async function approvePost(
  _: unknown,
  input: { postId: string; userId: string; notes?: string }
): Promise<AgentRunResult> {
  if (!input.postId || !input.userId) {
    throw new Error("postId and userId are required");
  }

  const supabase = getSupabaseClient();

  const { data: post, error: fetchError } = await supabase
    .from("posts")
    .select("id, approval_state, publishing_mode")
    .eq("id", input.postId)
    .eq("user_id", input.userId)
    .single();

  if (fetchError || !post) {
    throw new Error("Post not found");
  }

  const { error: updateError } = await supabase
    .from("posts")
    .update({
      approval_state: "approved",
      approved_by: input.userId,
      approved_at: new Date().toISOString(),
      approval_notes: input.notes || null,
    })
    .eq("id", input.postId);

  if (updateError) {
    throw new Error(`Failed to approve post: ${updateError.message}`);
  }

  // Route the post (will queue if ready)
  const routing = await routePost(input.postId, post.publishing_mode as "scheduled" | "reactive");

  return {
    output: `Post approved. ${routing.shouldQueue ? "Queued for publishing." : `Status: ${routing.reason}`}`,
    notes: {
      postId: input.postId,
      approved: true,
      queued: routing.shouldQueue,
      routingReason: routing.reason,
      metadata: {
        agent: "jamal",
        timestamp: new Date().toISOString(),
      },
    },
  };
}

/**
 * Get publishing settings
 */
export async function getSettings(
  _: unknown,
  input: { userId: string }
): Promise<AgentRunResult> {
  if (!input.userId) {
    throw new Error("userId is required");
  }

  const settings = await getPublishingSettings(input.userId);

  return {
    output: `Publishing settings: Approval required: ${settings.requireApproval}, Reactive mode: ${settings.reactiveModeEnabled && !settings.reactiveModeKillSwitch ? "enabled" : "disabled"}, Rate limits: ${settings.rateLimitEnabled ? "enabled" : "disabled"}`,
    notes: {
      settings,
      metadata: {
        agent: "jamal",
        timestamp: new Date().toISOString(),
      },
    },
  };
}

/**
 * Update publishing settings
 */
export async function updateSettings(
  _: unknown,
  input: ManageSettingsInput
): Promise<AgentRunResult> {
  if (!input.userId) {
    throw new Error("userId is required");
  }

  const updates: string[] = [];

  if (input.requireApproval !== undefined) {
    const result = await setRequireApproval(input.userId, input.requireApproval);
    if (result.success) {
      updates.push(`Approval requirement: ${input.requireApproval ? "enabled" : "disabled"}`);
    }
  }

  if (input.reactiveKillSwitch !== undefined) {
    const result = await setReactiveKillSwitch(input.userId, input.reactiveKillSwitch);
    if (result.success) {
      updates.push(`Reactive kill switch: ${input.reactiveKillSwitch ? "enabled" : "disabled"}`);
    }
  }

  return {
    output: updates.length > 0 ? `Settings updated: ${updates.join(", ")}` : "No settings updated",
    notes: {
      updates,
      metadata: {
        agent: "jamal",
        timestamp: new Date().toISOString(),
      },
    },
  };
}

/**
 * Handle file upload event (for reactive publishing)
 */
export async function handleFileUpload(
  _: unknown,
  input: { fileId: string; userId: string; contentItemId?: string }
): Promise<AgentRunResult> {
  if (!input.fileId || !input.userId) {
    throw new Error("fileId and userId are required");
  }

  const result = await handleFileUploadEvent(input.fileId, input.userId, input.contentItemId);

  return {
    output: result.triggered
      ? "File upload detected. Reactive publishing triggered."
      : "File upload detected. No reactive publishing (content item not enabled).",
    notes: {
      triggered: result.triggered,
      fileId: input.fileId,
      metadata: {
        agent: "jamal",
        timestamp: new Date().toISOString(),
      },
    },
  };
}




