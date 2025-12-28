/**
 * Social Post Scheduler Service
 * Polls for scheduled posts that are due and publishes them
 * Run this as a background job/cron task
 */

import { getPostsDueForPublishing, publishScheduledPost } from "@/lib/socialPostingClient";
import { createLogger } from "@/lib/logger";

const logger = createLogger("SocialPostScheduler");

interface SchedulerOptions {
  intervalMs?: number; // How often to check for due posts (default: 1 minute)
  batchSize?: number; // How many posts to process per run (default: 10)
  enabled?: boolean; // Whether the scheduler is enabled (default: true)
}

/**
 * Process posts that are due for publishing
 */
export async function processDuePosts(batchSize = 10): Promise<{
  processed: number;
  successful: number;
  failed: number;
}> {
  logger.info("Checking for posts due for publishing...");

  const duePosts = await getPostsDueForPublishing(batchSize);
  
  if (duePosts.length === 0) {
    logger.debug("No posts due for publishing");
    return { processed: 0, successful: 0, failed: 0 };
  }

  logger.info(`Found ${duePosts.length} post(s) due for publishing`);

  let successful = 0;
  let failed = 0;

  // Process posts sequentially to avoid rate limits
  for (const post of duePosts) {
    try {
      logger.info(`Publishing post ${post.id} to ${post.platform}`, {
        postId: post.id,
        platform: post.platform,
        scheduledAt: post.scheduledAt,
      });

      const result = await publishScheduledPost(post.id);

      if (result.success) {
        successful++;
        logger.info(`Successfully published post ${post.id}`, {
          postId: post.id,
          platformPostId: result.platformPostId,
          platformPostUrl: result.platformPostUrl,
        });
      } else {
        failed++;
        logger.error(`Failed to publish post ${post.id}`, {
          postId: post.id,
          error: result.error,
        });
      }

      // Small delay between posts to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      failed++;
      logger.error(`Error publishing post ${post.id}`, {
        postId: post.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  logger.info(`Completed processing ${duePosts.length} post(s)`, {
    successful,
    failed,
  });

  return {
    processed: duePosts.length,
    successful,
    failed,
  };
}

/**
 * Start the scheduler loop
 */
export function startScheduler(options: SchedulerOptions = {}): () => void {
  const {
    intervalMs = 60 * 1000, // 1 minute default
    batchSize = 10,
    enabled = true,
  } = options;

  if (!enabled) {
    logger.info("Social post scheduler is disabled");
    return () => {}; // No-op stop function
  }

  logger.info("Starting social post scheduler", {
    intervalMs,
    batchSize,
  });

  let isRunning = true;
  let timeoutId: NodeJS.Timeout | null = null;

  const run = async () => {
    if (!isRunning) return;

    try {
      await processDuePosts(batchSize);
    } catch (error) {
      logger.error("Error in scheduler run", {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    if (isRunning) {
      timeoutId = setTimeout(run, intervalMs);
    }
  };

  // Start the first run immediately
  run();

  // Return stop function
  return () => {
    logger.info("Stopping social post scheduler");
    isRunning = false;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
}

/**
 * Run scheduler once (useful for cron jobs)
 */
export async function runSchedulerOnce(batchSize = 10): Promise<void> {
  await processDuePosts(batchSize);
}









