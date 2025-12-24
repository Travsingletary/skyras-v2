import { AgentRunResult } from "@/agents/core/BaseAgent";
import {
  schedulePost as scheduleSocialPost,
  publishPostNow,
  getScheduledPosts,
  getSocialAccounts,
  deleteScheduledPost,
  type SchedulePostInput as SocialSchedulePostInput,
  type SocialPlatform,
} from "@/lib/socialPostingClient";

export interface PostingPlanInput {
  project: string;
  campaignName?: string;
  platforms?: string[];
  slots?: number;
  mood?: string;
  notes?: string;
}

export interface SchedulePostInput {
  project: string;
  userId: string;
  projectId?: string;
  caption: string;
  mediaUrl?: string;
  mediaUrls?: string[];
  platform: SocialPlatform;
  scheduledAt: string;
  accountId?: string;
  hashtags?: string[];
  mentions?: string[];
  metadata?: Record<string, unknown>;
  campaignName?: string;
  notes?: string;
}

export interface PublishPostInput {
  project: string;
  userId: string;
  projectId?: string;
  caption: string;
  mediaUrl?: string;
  mediaUrls?: string[];
  platform: SocialPlatform;
  accountId?: string;
  hashtags?: string[];
  mentions?: string[];
  metadata?: Record<string, unknown>;
  campaignName?: string;
  notes?: string;
}

function baseMetadata(project: string) {
  return {
    agent: "jamal",
    project,
    timestamp: new Date().toISOString(),
  };
}

function createSlots(platforms: string[], slots: number, campaign: string) {
  const now = new Date();
  return Array.from({ length: slots }).map((_, idx) => {
    const when = new Date(now.getTime() + idx * 60 * 60 * 1000).toISOString();
    const platform = platforms[idx % platforms.length];
    return {
      platform,
      time: when,
      contentType: idx % 2 === 0 ? "clip" : "story",
      note: `Campaign ${campaign} slot ${idx + 1}`,
    };
  });
}

export async function generatePostingPlan(_: unknown, input: PostingPlanInput): Promise<AgentRunResult> {
  if (!input.project) {
    throw new Error("project is required for posting plan");
  }
  const platforms = input.platforms?.length ? input.platforms : ["instagram", "tiktok"];
  const slots = input.slots ?? 3;
  const campaign = input.campaignName ?? `${input.project} Launch`;
  const plan = {
    campaignName: campaign,
    project: input.project,
    platforms,
    slots: createSlots(platforms, slots, campaign),
    mood: input.mood ?? "upbeat",
    notes: input.notes,
  };

  return {
    output: `Posting plan drafted for ${input.project} across ${platforms.join(", ")} with ${slots} slots.`,
    notes: {
      plan,
      metadata: baseMetadata(input.project),
    },
  };
}

/**
 * Schedule a post for later publication
 */
export async function schedulePost(
  _: unknown,
  input: SchedulePostInput
): Promise<AgentRunResult> {
  if (!input.project || !input.userId || !input.caption || !input.platform || !input.scheduledAt) {
    throw new Error("project, userId, caption, platform, and scheduledAt are required for scheduling");
  }

  const scheduleInput: SocialSchedulePostInput = {
    userId: input.userId,
    projectId: input.projectId,
    platform: input.platform,
    caption: input.caption,
    mediaUrl: input.mediaUrl,
    mediaUrls: input.mediaUrls,
    scheduledAt: input.scheduledAt,
    accountId: input.accountId,
    hashtags: input.hashtags,
    mentions: input.mentions,
    metadata: {
      ...input.metadata,
      project: input.project,
    },
    campaignName: input.campaignName,
    notes: input.notes,
  };

  const result = await scheduleSocialPost(scheduleInput);

  if (!result.success) {
    throw new Error(`Failed to schedule post: ${result.error}`);
  }

  return {
    output: `Post scheduled for ${input.platform} on ${input.scheduledAt}. Post ID: ${result.postId}`,
    notes: {
      postId: result.postId,
      scheduledAt: input.scheduledAt,
      platform: input.platform,
      metadata: {
        ...baseMetadata(input.project),
        postId: result.postId,
      },
    },
  };
}

/**
 * Publish a post immediately
 */
export async function publishPost(
  _: unknown,
  input: PublishPostInput
): Promise<AgentRunResult> {
  if (!input.project || !input.userId || !input.caption || !input.platform) {
    throw new Error("project, userId, caption, and platform are required for publishing");
  }

  const publishInput: Omit<SocialSchedulePostInput, "scheduledAt"> = {
    userId: input.userId,
    projectId: input.projectId,
    platform: input.platform,
    caption: input.caption,
    mediaUrl: input.mediaUrl,
    mediaUrls: input.mediaUrls,
    accountId: input.accountId,
    hashtags: input.hashtags,
    mentions: input.mentions,
    metadata: {
      ...input.metadata,
      project: input.project,
    },
    campaignName: input.campaignName,
    notes: input.notes,
  };

  const result = await publishPostNow(publishInput);

  if (!result.success) {
    throw new Error(`Failed to publish post: ${result.error}`);
  }

  return {
    output: `Post published to ${input.platform}${result.platformPostUrl ? `: ${result.platformPostUrl}` : ""}. Post ID: ${result.postId}`,
    notes: {
      postId: result.postId,
      platformPostId: result.platformPostId,
      platformPostUrl: result.platformPostUrl,
      platform: input.platform,
      metadata: {
        ...baseMetadata(input.project),
        postId: result.postId,
      },
    },
  };
}

/**
 * Get available social media accounts
 */
export async function getAccounts(_: unknown, input?: { userId: string; platform?: SocialPlatform }): Promise<AgentRunResult> {
  if (!input?.userId) {
    throw new Error("userId is required to fetch accounts");
  }

  const result = await getSocialAccounts(input.userId, input.platform);

  if (!result.success) {
    throw new Error(`Failed to fetch accounts: ${result.error}`);
  }

  const accountSummary = result.accounts
    ?.map((acc) => `${acc.platform} (@${acc.username})`)
    .join(", ") || "No accounts connected";

  return {
    output: `Connected accounts: ${accountSummary}`,
    notes: {
      accounts: result.accounts,
      metadata: {
        agent: "jamal",
        timestamp: new Date().toISOString(),
      },
    },
  };
}

/**
 * Get scheduled posts
 */
export async function getScheduled(
  _: unknown,
  input: { userId: string; platform?: SocialPlatform; status?: string; projectId?: string }
): Promise<AgentRunResult> {
  if (!input.userId) {
    throw new Error("userId is required to fetch scheduled posts");
  }

  const result = await getScheduledPosts(input.userId, {
    platform: input.platform,
    status: input.status,
    projectId: input.projectId,
  });

  if (!result.success) {
    throw new Error(`Failed to fetch scheduled posts: ${result.error}`);
  }

  const count = result.posts?.length || 0;
  const platformFilter = input.platform ? ` on ${input.platform}` : "";
  const statusFilter = input.status ? ` with status ${input.status}` : "";

  return {
    output: `Found ${count} scheduled post${count !== 1 ? "s" : ""}${platformFilter}${statusFilter}`,
    notes: {
      posts: result.posts,
      count,
      metadata: {
        agent: "jamal",
        timestamp: new Date().toISOString(),
      },
    },
  };
}

/**
 * Delete a scheduled post
 */
export async function deletePost(_: unknown, input: { postId: string }): Promise<AgentRunResult> {
  if (!input.postId) {
    throw new Error("postId is required for deletion");
  }

  const result = await deleteScheduledPost(input.postId);

  if (!result.success) {
    throw new Error(`Failed to delete post: ${result.error}`);
  }

  return {
    output: `Post ${input.postId} deleted successfully`,
    notes: {
      postId: input.postId,
      metadata: {
        agent: "jamal",
        timestamp: new Date().toISOString(),
      },
    },
  };
}
