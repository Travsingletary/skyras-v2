/**
 * Minimal Social Media Posting Client
 * Self-hosted service for scheduling and publishing posts to social platforms
 * No external SaaS dependencies - direct platform API integration
 */

import { getSupabaseClient } from "@/backend/supabaseClient";

export type SocialPlatform = "instagram" | "tiktok" | "linkedin" | "twitter" | "facebook" | "youtube";

export interface ScheduledPost {
  id: string;
  userId: string;
  projectId?: string;
  platform: SocialPlatform;
  caption: string;
  mediaUrl?: string;
  mediaUrls?: string[];
  scheduledAt: string;
  publishedAt?: string;
  status: "scheduled" | "publishing" | "published" | "failed" | "cancelled";
  errorMessage?: string;
  accountId?: string;
  platformPostId?: string;
  platformPostUrl?: string;
  hashtags?: string[];
  mentions?: string[];
  metadata?: Record<string, unknown>;
  campaignName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SocialAccount {
  id: string;
  userId: string;
  platform: SocialPlatform;
  platformAccountId: string;
  username: string;
  displayName?: string;
  profilePictureUrl?: string;
  isConnected: boolean;
  connectedAt?: string;
  lastSyncAt?: string;
  metadata?: Record<string, unknown>;
}

export interface SchedulePostInput {
  userId: string;
  projectId?: string;
  platform: SocialPlatform;
  caption: string;
  mediaUrl?: string;
  mediaUrls?: string[];
  scheduledAt: string;
  accountId?: string;
  hashtags?: string[];
  mentions?: string[];
  metadata?: Record<string, unknown>;
  campaignName?: string;
  notes?: string;
}

export interface SchedulePostResult {
  success: boolean;
  postId?: string;
  error?: string;
  post?: ScheduledPost;
}

export interface PublishPostResult {
  success: boolean;
  postId?: string;
  platformPostId?: string;
  platformPostUrl?: string;
  error?: string;
}

/**
 * Schedule a post for later publication
 */
export async function schedulePost(input: SchedulePostInput): Promise<SchedulePostResult> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("scheduled_posts")
      .insert({
        user_id: input.userId,
        project_id: input.projectId || null,
        platform: input.platform,
        caption: input.caption,
        media_url: input.mediaUrl || null,
        media_urls: input.mediaUrls || null,
        scheduled_at: input.scheduledAt,
        account_id: input.accountId || null,
        hashtags: input.hashtags || null,
        mentions: input.mentions || null,
        metadata: input.metadata || {},
        campaign_name: input.campaignName || null,
        notes: input.notes || null,
        status: "scheduled",
      })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      postId: data.id,
      post: mapDbPostToScheduledPost(data),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to schedule post",
    };
  }
}

/**
 * Publish a post immediately (sets scheduled_at to now)
 */
export async function publishPostNow(input: Omit<SchedulePostInput, "scheduledAt">): Promise<PublishPostResult> {
  try {
    const now = new Date().toISOString();
    
    const scheduleResult = await schedulePost({
      ...input,
      scheduledAt: now,
    });

    if (!scheduleResult.success || !scheduleResult.postId) {
      return {
        success: false,
        error: scheduleResult.error || "Failed to create post",
      };
    }

    // Immediately try to publish
    return await publishScheduledPost(scheduleResult.postId);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to publish post",
    };
  }
}

/**
 * Publish a scheduled post (called by scheduler)
 */
export async function publishScheduledPost(postId: string): Promise<PublishPostResult> {
  try {
    const supabase = getSupabaseClient();

    // Get the post
    const { data: post, error: fetchError } = await supabase
      .from("scheduled_posts")
      .select("*")
      .eq("id", postId)
      .single();

    if (fetchError || !post) {
      return {
        success: false,
        error: fetchError?.message || "Post not found",
      };
    }

    if (post.status !== "scheduled") {
      return {
        success: false,
        error: `Post is in ${post.status} status, cannot publish`,
      };
    }

    // Update status to publishing
    await supabase
      .from("scheduled_posts")
      .update({ status: "publishing" })
      .eq("id", postId);

    // TODO: Call platform-specific publishing function
    // For now, this is a stub - actual implementation will be in platform adapters
    const platformAdapter = getPlatformAdapter(post.platform);
    const publishResult = await platformAdapter.publish(post);

    if (publishResult.success) {
      // Update post with published status
      await supabase
        .from("scheduled_posts")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
          platform_post_id: publishResult.platformPostId || null,
          platform_post_url: publishResult.platformPostUrl || null,
          error_message: null,
        })
        .eq("id", postId);

      return {
        success: true,
        postId,
        platformPostId: publishResult.platformPostId,
        platformPostUrl: publishResult.platformPostUrl,
      };
    } else {
      // Update post with failed status
      await supabase
        .from("scheduled_posts")
        .update({
          status: "failed",
          error_message: publishResult.error || "Unknown error",
        })
        .eq("id", postId);

      return {
        success: false,
        error: publishResult.error,
      };
    }
  } catch (error) {
    const supabase = getSupabaseClient();
    await supabase
      .from("scheduled_posts")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
      })
      .eq("id", postId);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to publish post",
    };
  }
}

/**
 * Get scheduled posts
 */
export async function getScheduledPosts(
  userId: string,
  filters?: {
    platform?: SocialPlatform;
    status?: string;
    projectId?: string;
  }
): Promise<{ success: boolean; posts?: ScheduledPost[]; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    let query = supabase
      .from("scheduled_posts")
      .select("*")
      .eq("user_id", userId)
      .order("scheduled_at", { ascending: true });

    if (filters?.platform) {
      query = query.eq("platform", filters.platform);
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.projectId) {
      query = query.eq("project_id", filters.projectId);
    }

    const { data, error } = await query;

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      posts: data?.map(mapDbPostToScheduledPost) || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch scheduled posts",
    };
  }
}

/**
 * Get social media accounts
 */
export async function getSocialAccounts(
  userId: string,
  platform?: SocialPlatform
): Promise<{ success: boolean; accounts?: SocialAccount[]; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    let query = supabase
      .from("social_accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("is_connected", true);

    if (platform) {
      query = query.eq("platform", platform);
    }

    const { data, error } = await query;

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      accounts: data?.map(mapDbAccountToSocialAccount) || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch accounts",
    };
  }
}

/**
 * Delete a scheduled post
 */
export async function deleteScheduledPost(postId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("scheduled_posts")
      .delete()
      .eq("id", postId);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete post",
    };
  }
}

/**
 * Get posts that are due for publishing (used by scheduler)
 */
export async function getPostsDueForPublishing(limit = 10): Promise<ScheduledPost[]> {
  try {
    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("scheduled_posts")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_at", now)
      .order("scheduled_at", { ascending: true })
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return data.map(mapDbPostToScheduledPost);
  } catch {
    return [];
  }
}

// Platform adapter interface
interface PlatformAdapter {
  publish(post: any): Promise<PublishPostResult>;
}

// Stub platform adapters - to be implemented with actual API calls
function getPlatformAdapter(platform: SocialPlatform): PlatformAdapter {
  // TODO: Implement actual platform integrations
  // For now, return stub adapters that will need API credentials
  return {
    publish: async (post: any) => {
      // Stub implementation - returns success but logs that API integration is needed
      console.warn(`[${platform}] Publishing stub - API integration needed`);
      return {
        success: false,
        error: `${platform} API integration not yet implemented. Configure platform API credentials to enable publishing.`,
      };
    },
  };
}

// Helper functions to map database rows to TypeScript types
function mapDbPostToScheduledPost(row: any): ScheduledPost {
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    platform: row.platform,
    caption: row.caption,
    mediaUrl: row.media_url,
    mediaUrls: row.media_urls,
    scheduledAt: row.scheduled_at,
    publishedAt: row.published_at,
    status: row.status,
    errorMessage: row.error_message,
    accountId: row.account_id,
    platformPostId: row.platform_post_id,
    platformPostUrl: row.platform_post_url,
    hashtags: row.hashtags,
    mentions: row.mentions,
    metadata: row.metadata,
    campaignName: row.campaign_name,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDbAccountToSocialAccount(row: any): SocialAccount {
  return {
    id: row.id,
    userId: row.user_id,
    platform: row.platform,
    platformAccountId: row.platform_account_id,
    username: row.username,
    displayName: row.display_name,
    profilePictureUrl: row.profile_picture_url,
    isConnected: row.is_connected,
    connectedAt: row.connected_at,
    lastSyncAt: row.last_sync_at,
    metadata: row.metadata,
  };
}









