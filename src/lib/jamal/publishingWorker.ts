/**
 * Publishing Worker
 * Processes jobs from the queue with guardrails, rate limiting, and retries
 */

import { getSupabaseClient } from "@/backend/supabaseClient";
import { createLogger } from "@/lib/logger";
import { getNextJob, completeJob, scheduleJobRetry, applyRateLimit, type PublishingJob } from "./publishingQueue";
import { checkRateLimit } from "./guardrails";
import { getPublishingSettings } from "./guardrails";

const logger = createLogger("PublishingWorker");

export interface WorkerConfig {
  workerId: string;
  batchSize?: number;
  pollIntervalMs?: number;
  enabled?: boolean;
}

/**
 * Process a single publishing job
 */
export async function processJob(job: PublishingJob): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    // Get post details
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("*")
      .eq("id", job.postId)
      .single();

    if (postError || !post) {
      logger.error("Post not found for job", { jobId: job.id, postId: job.postId });
      await completeJob(job.id, false, {
        message: "Post not found",
        code: "POST_NOT_FOUND",
      });
      return { success: false, error: "Post not found" };
    }

    // Check approval (double-check before publishing)
    if (post.approval_state !== "approved" && post.approval_state !== "auto_approved") {
      logger.warn("Post not approved, skipping", { jobId: job.id, postId: job.postId, approvalState: post.approval_state });
      await completeJob(job.id, false, {
        message: "Post not approved",
        code: "NOT_APPROVED",
      });
      
      // Update post state
      await supabase
        .from("posts")
        .update({ publish_state: "draft" })
        .eq("id", job.postId);

      return { success: false, error: "Post not approved" };
    }

    // Check rate limits
    const rateLimitKey = job.rateLimitKey || `${post.platform}_${post.user_id}`;
    const rateLimitResult = await checkRateLimit(post.user_id, post.platform, rateLimitKey);

    if (!rateLimitResult.allowed) {
      logger.info("Rate limit exceeded, applying cooldown", {
        jobId: job.id,
        platform: post.platform,
        cooldownMinutes: rateLimitResult.cooldownMinutes,
      });

      // Apply cooldown and reschedule
      await applyRateLimit(rateLimitKey, rateLimitResult.cooldownMinutes || 15);
      await scheduleJobRetry(job.id, rateLimitResult.cooldownMinutes || 15);

      return { success: false, error: `Rate limit exceeded. Cooldown: ${rateLimitResult.cooldownMinutes} minutes` };
    }

    // Update post state to publishing
    await supabase
      .from("posts")
      .update({ publish_state: "publishing" })
      .eq("id", job.postId);

    // TODO: Call platform-specific publishing function
    // This is where we'd integrate with Instagram API, TikTok API, etc.
    const publishResult = await publishToPlatform(post);

    if (publishResult.success) {
      // Success - update post
      await supabase
        .from("posts")
        .update({
          publish_state: "published",
          published_at: new Date().toISOString(),
          platform_post_id: publishResult.platformPostId || null,
          platform_post_url: publishResult.platformPostUrl || null,
          error_message: null,
          error_code: null,
        })
        .eq("id", job.postId);

      // Record rate limit usage
      await recordRateLimitUsage(post.user_id, post.platform, rateLimitKey);

      await completeJob(job.id, true);
      logger.info("Post published successfully", {
        jobId: job.id,
        postId: job.postId,
        platform: post.platform,
        platformPostId: publishResult.platformPostId,
      });

      return { success: true };
    } else {
      // Failure - handle retry
      const shouldRetry = job.attemptCount < job.maxAttempts;
      const retryDelay = calculateRetryDelay(job.attemptCount, post.user_id);

      if (shouldRetry) {
        logger.warn("Publishing failed, scheduling retry", {
          jobId: job.id,
          postId: job.postId,
          attempt: job.attemptCount + 1,
          maxAttempts: job.maxAttempts,
          retryDelayMinutes: retryDelay,
          error: publishResult.error,
        });

        await scheduleJobRetry(job.id, retryDelay);

        // Update post with error but keep in queued state for retry
        await supabase
          .from("posts")
          .update({
            publish_state: "queued",
            error_message: publishResult.error || "Unknown error",
            error_code: publishResult.errorCode || null,
            retry_count: (post.retry_count || 0) + 1,
            next_retry_at: new Date(Date.now() + retryDelay * 60 * 1000).toISOString(),
          })
          .eq("id", job.postId);
      } else {
        // Max retries exceeded
        logger.error("Publishing failed after max retries", {
          jobId: job.id,
          postId: job.postId,
          attempts: job.attemptCount,
          error: publishResult.error,
        });

        await completeJob(job.id, false, {
          message: publishResult.error || "Publishing failed",
          code: publishResult.errorCode || "PUBLISH_FAILED",
        });

        await supabase
          .from("posts")
          .update({
            publish_state: "failed",
            error_message: publishResult.error || "Publishing failed after max retries",
            error_code: publishResult.errorCode || null,
          })
          .eq("id", job.postId);
      }

      return { success: false, error: publishResult.error };
    }
  } catch (error) {
    logger.error("Error processing job", {
      jobId: job.id,
      error: error instanceof Error ? error.message : String(error),
    });

    await completeJob(job.id, false, {
      message: error instanceof Error ? error.message : "Unknown error",
      code: "PROCESSING_ERROR",
    });

    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Stub for platform publishing - to be implemented with actual API calls
 * TODO: Integrate with Instagram Graph API, TikTok API, etc.
 */
async function publishToPlatform(post: any): Promise<{
  success: boolean;
  platformPostId?: string;
  platformPostUrl?: string;
  error?: string;
  errorCode?: string;
}> {
  // TODO: Implement actual platform API calls
  // For now, return error indicating API integration needed
  logger.warn("Platform API not implemented", { platform: post.platform, postId: post.id });
  return {
    success: false,
    error: `${post.platform} API integration not yet implemented. Configure platform API credentials to enable publishing.`,
    errorCode: "API_NOT_IMPLEMENTED",
  };
}

/**
 * Record rate limit usage
 */
async function recordRateLimitUsage(userId: string, platform: string, rateLimitKey: string): Promise<void> {
  // TODO: Implement rate limit tracking
  // Could use Redis or a separate table to track usage per time window
  logger.debug("Rate limit usage recorded", { userId, platform, rateLimitKey });
}

/**
 * Calculate retry delay with exponential backoff
 */
async function calculateRetryDelay(attemptCount: number, userId: string): Promise<number> {
  try {
    const settings = await getPublishingSettings(userId);
    const baseDelay = settings.retryDelayMinutes || 15;
    const multiplier = settings.retryBackoffMultiplier || 2.0;

    // Exponential backoff: baseDelay * (multiplier ^ attemptCount)
    return Math.floor(baseDelay * Math.pow(multiplier, attemptCount));
  } catch {
    // Default exponential backoff
    return Math.floor(15 * Math.pow(2, attemptCount));
  }
}

/**
 * Worker loop - processes jobs continuously
 */
export async function runWorker(config: WorkerConfig): Promise<() => void> {
  const {
    workerId,
    batchSize = 10,
    pollIntervalMs = 5000, // 5 seconds
    enabled = true,
  } = config;

  if (!enabled) {
    logger.info("Worker disabled", { workerId });
    return () => {}; // No-op stop function
  }

  logger.info("Starting publishing worker", { workerId, batchSize, pollIntervalMs });

  let isRunning = true;
  let timeoutId: NodeJS.Timeout | null = null;

  const processBatch = async () => {
    if (!isRunning) return;

    try {
      for (let i = 0; i < batchSize; i++) {
        const job = await getNextJob(workerId);

        if (!job) {
          break; // No more jobs available
        }

        await processJob(job);

        // Small delay between jobs
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      logger.error("Error in worker batch", {
        workerId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    if (isRunning) {
      timeoutId = setTimeout(processBatch, pollIntervalMs);
    }
  };

  // Start processing
  processBatch();

  // Return stop function
  return () => {
    logger.info("Stopping publishing worker", { workerId });
    isRunning = false;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
}

