/**
 * Jamal Scheduler Service
 * Processes scheduled posts that are due for publishing
 */

import { processScheduledPosts } from "@/lib/jamal/scheduledPublishing";
import { createLogger } from "@/lib/logger";

const logger = createLogger("JamalScheduler");

/**
 * Run scheduler once (processes due scheduled posts)
 */
export async function runSchedulerOnce(): Promise<void> {
  logger.info("Running scheduled posts processor");
  const result = await processScheduledPosts();
  logger.info("Scheduled posts processed", result);
}

/**
 * Start scheduler loop
 */
export function startScheduler(options: { intervalMs?: number; enabled?: boolean } = {}): () => void {
  const { intervalMs = 60 * 1000, enabled = true } = options;

  if (!enabled) {
    logger.info("Scheduler disabled");
    return () => {};
  }

  logger.info("Starting Jamal scheduler", { intervalMs });

  let isRunning = true;
  let timeoutId: NodeJS.Timeout | null = null;

  const run = async () => {
    if (!isRunning) return;

    try {
      await runSchedulerOnce();
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
    logger.info("Stopping Jamal scheduler");
    isRunning = false;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
}




