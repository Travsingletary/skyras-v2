/**
 * Jamal Publishing Queue System
 * Unified job queue for both scheduled and reactive publishing modes
 */

import { getSupabaseClient } from "@/backend/supabaseClient";
import { createLogger } from "@/lib/logger";

const logger = createLogger("PublishingQueue");

export type PublishingMode = "scheduled" | "reactive";
export type JobStatus = "queued" | "processing" | "completed" | "failed" | "cancelled";
export type TriggerEvent = "file_upload" | "drop_flag" | "campaign_start" | "manual" | "trend_trigger";

export interface PublishingJob {
  id: string;
  postId: string;
  jobType: PublishingMode;
  status: JobStatus;
  priority: number;
  startedAt?: string;
  completedAt?: string;
  workerId?: string;
  attemptCount: number;
  maxAttempts: number;
  nextRetryAt?: string;
  errorMessage?: string;
  errorCode?: string;
  errorDetails?: Record<string, unknown>;
  rateLimitKey?: string;
  rateLimitUntil?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface QueueJobOptions {
  priority?: number; // 1-10, lower = higher priority
  maxAttempts?: number;
  rateLimitKey?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Queue a job for publishing
 */
export async function queuePublishingJob(
  postId: string,
  jobType: PublishingMode,
  options: QueueJobOptions = {}
): Promise<{ success: boolean; jobId?: string; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("publishing_jobs")
      .insert({
        post_id: postId,
        job_type: jobType,
        status: "queued",
        priority: options.priority ?? 5,
        max_attempts: options.maxAttempts ?? 3,
        rate_limit_key: options.rateLimitKey || null,
        metadata: options.metadata || {},
      })
      .select()
      .single();

    if (error) {
      logger.error("Failed to queue publishing job", { postId, error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }

    // Log job creation
    await logPublishingEvent(postId, data.id, "queued", {
      jobType,
      priority: options.priority ?? 5,
    });

    logger.info("Publishing job queued", { jobId: data.id, postId, jobType });

    return {
      success: true,
      jobId: data.id,
    };
  } catch (error) {
    logger.error("Error queuing publishing job", {
      postId,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to queue job",
    };
  }
}

/**
 * Get next job from queue (for workers)
 */
export async function getNextJob(
  workerId: string,
  jobType?: PublishingMode
): Promise<PublishingJob | null> {
  try {
    const supabase = getSupabaseClient();

    let query = supabase
      .from("publishing_jobs")
      .select("*")
      .eq("status", "queued")
      .order("priority", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(1);

    // Filter by job type if specified
    if (jobType) {
      query = query.eq("job_type", jobType);
    }

    // Check rate limits
    query = query.or("rate_limit_until.is.null,rate_limit_until.lte." + new Date().toISOString());

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      return null;
    }

    // Mark as processing
    const { error: updateError } = await supabase
      .from("publishing_jobs")
      .update({
        status: "processing",
        started_at: new Date().toISOString(),
        worker_id: workerId,
        attempt_count: data.attempt_count + 1,
      })
      .eq("id", data.id);

    if (updateError) {
      logger.error("Failed to mark job as processing", { jobId: data.id, error: updateError.message });
      return null;
    }

    return mapDbJobToPublishingJob(data);
  } catch (error) {
    logger.error("Error getting next job", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Mark job as completed
 */
export async function completeJob(
  jobId: string,
  success: boolean,
  error?: { message: string; code?: string; details?: Record<string, unknown> }
): Promise<void> {
  try {
    const supabase = getSupabaseClient();

    const updateData: Record<string, unknown> = {
      status: success ? "completed" : "failed",
      completed_at: new Date().toISOString(),
    };

    if (error) {
      updateData.error_message = error.message;
      updateData.error_code = error.code || null;
      updateData.error_details = error.details || null;
    }

    const { error: updateError } = await supabase
      .from("publishing_jobs")
      .update(updateData)
      .eq("id", jobId);

    if (updateError) {
      logger.error("Failed to complete job", { jobId, error: updateError.message });
      return;
    }

    // Log completion
    const job = await getJobById(jobId);
    if (job) {
      await logPublishingEvent(job.postId, jobId, success ? "completed" : "failed", {
        error: error ? { message: error.message, code: error.code } : undefined,
      });
    }
  } catch (error) {
    logger.error("Error completing job", {
      jobId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Schedule retry for failed job
 */
export async function scheduleJobRetry(
  jobId: string,
  delayMinutes: number
): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    const nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000);

    const { error } = await supabase
      .from("publishing_jobs")
      .update({
        status: "queued",
        next_retry_at: nextRetryAt.toISOString(),
        rate_limit_until: null, // Reset rate limit on retry
      })
      .eq("id", jobId);

    if (error) {
      logger.error("Failed to schedule job retry", { jobId, error: error.message });
      return;
    }

    const job = await getJobById(jobId);
    if (job) {
      await logPublishingEvent(job.postId, jobId, "retried", {
        nextRetryAt: nextRetryAt.toISOString(),
        delayMinutes,
      });
    }

    logger.info("Job retry scheduled", { jobId, nextRetryAt });
  } catch (error) {
    logger.error("Error scheduling job retry", {
      jobId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Apply rate limit cooldown to job
 */
export async function applyRateLimit(
  rateLimitKey: string,
  cooldownMinutes: number
): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    const rateLimitUntil = new Date(Date.now() + cooldownMinutes * 60 * 1000);

    // Update all queued jobs with this rate limit key
    const { error } = await supabase
      .from("publishing_jobs")
      .update({
        rate_limit_until: rateLimitUntil.toISOString(),
      })
      .eq("rate_limit_key", rateLimitKey)
      .eq("status", "queued");

    if (error) {
      logger.error("Failed to apply rate limit", { rateLimitKey, error: error.message });
      return;
    }

    logger.info("Rate limit applied", { rateLimitKey, cooldownMinutes, rateLimitUntil });
  } catch (error) {
    logger.error("Error applying rate limit", {
      rateLimitKey,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Get job by ID
 */
async function getJobById(jobId: string): Promise<PublishingJob | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("publishing_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (error || !data) {
      return null;
    }

    return mapDbJobToPublishingJob(data);
  } catch {
    return null;
  }
}

/**
 * Log publishing event
 */
async function logPublishingEvent(
  postId: string,
  jobId: string,
  eventType: string,
  eventData?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = getSupabaseClient();

    // Get post info for context
    const { data: post } = await supabase
      .from("posts")
      .select("user_id, platform, publishing_mode")
      .eq("id", postId)
      .single();

    await supabase.from("publishing_logs").insert({
      post_id: postId,
      job_id: jobId,
      event_type: eventType,
      event_data: eventData || {},
      user_id: post?.user_id || null,
      platform: post?.platform || null,
      publishing_mode: post?.publishing_mode || null,
    });
  } catch (error) {
    logger.error("Failed to log publishing event", {
      postId,
      jobId,
      eventType,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Map database row to PublishingJob
 */
function mapDbJobToPublishingJob(row: any): PublishingJob {
  return {
    id: row.id,
    postId: row.post_id,
    jobType: row.job_type,
    status: row.status,
    priority: row.priority,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    workerId: row.worker_id,
    attemptCount: row.attempt_count,
    maxAttempts: row.max_attempts,
    nextRetryAt: row.next_retry_at,
    errorMessage: row.error_message,
    errorCode: row.error_code,
    errorDetails: row.error_details,
    rateLimitKey: row.rate_limit_key,
    rateLimitUntil: row.rate_limit_until,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}






