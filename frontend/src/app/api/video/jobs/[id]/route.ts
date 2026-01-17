import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId, logAuthIdentity } from '@/lib/auth';
import { videoJobsDb } from '@/lib/database';
import { getSupabaseStorageClient } from '@/backend/supabaseClient';
import { pollFalRequest } from '@/backend/videoProviders/falPikaAdapter';
import { pollOpenTuneTask } from '@/backend/videoProviders/openTuneAdapter';
import { runwayAdapter } from '@/backend/videoProviders/runwayAdapter';

export const runtime = 'nodejs';

/**
 * Poll Runway task status (reuse from runwayAdapter)
 */
async function pollRunwayTask(taskId: string): Promise<{ status: string; output?: string[]; failure?: string }> {
  const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY || '';
  const RUNWAY_API_BASE_URL = process.env.RUNWAY_API_BASE_URL || 'https://api.dev.runwayml.com';
  const RUNWAY_API_VERSION = '2024-11-06';

  const response = await fetch(`${RUNWAY_API_BASE_URL}/v1/tasks/${taskId}`, {
    headers: {
      'Authorization': `Bearer ${RUNWAY_API_KEY}`,
      'X-Runway-Version': RUNWAY_API_VERSION,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get Runway task status: ${response.status}`);
  }

  return await response.json();
}

/**
 * Download video from URL and upload to Supabase Storage
 */
async function storeVideoInSupabase(
  videoUrl: string,
  userId: string,
  jobId: string
): Promise<string> {
  const supabase = getSupabaseStorageClient();
  if (!supabase) {
    throw new Error('Supabase storage not configured');
  }

  // Download video from provider
  const videoResponse = await fetch(videoUrl);
  if (!videoResponse.ok) {
    throw new Error(`Failed to download video: ${videoResponse.status}`);
  }

  const videoBuffer = await videoResponse.arrayBuffer();
  const storagePath = `${userId}/generated-videos/${jobId}.mp4`;

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('generated-videos')
    .upload(storagePath, videoBuffer, {
      contentType: 'video/mp4',
      upsert: true, // Allow overwriting if job is retried
    });

  if (uploadError) {
    console.error('[VideoJobs] Supabase upload error:', uploadError);
    throw new Error(`Failed to upload video to storage: ${uploadError.message}`);
  }

  return storagePath;
}

/**
 * Generate signed URL for video playback
 */
async function getSignedVideoUrl(storagePath: string): Promise<string> {
  const supabase = getSupabaseStorageClient();
  if (!supabase) {
    throw new Error('Supabase storage not configured');
  }

  const { data, error } = await supabase.storage
    .from('generated-videos')
    .createSignedUrl(storagePath, 3600); // 1 hour expiry

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to generate signed URL: ${error?.message || 'Unknown error'}`);
  }

  return data.signedUrl;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const userId = await getAuthenticatedUserId(request);
    logAuthIdentity('/api/video/jobs/[id]', userId);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const jobId = params.id;

    // Get job and verify ownership
    const job = await videoJobsDb.getById(jobId, userId);
    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found or access denied' },
        { status: 404 }
      );
    }

    // If job is running, poll provider for status
    if (job.status === 'running' && job.provider_job_id) {
      try {
        let providerStatus: { status: string; video?: { url: string }; error?: string };
        let videoUrl: string | null = null;

        if (job.provider === 'fal-pika') {
          // Poll Fal.ai
          console.log(`[VideoJobs] Polling Fal.ai status for job ${jobId}, provider_job_id: ${job.provider_job_id}`);
          const falStatus = await pollFalRequest(job.provider_job_id);
          console.log(`[VideoJobs] Fal.ai status mapped: ${falStatus.status} -> ${falStatus.status === 'COMPLETED' ? 'succeeded' : falStatus.status === 'FAILED' ? 'failed' : 'running'}`);
          
          if (falStatus.status === 'COMPLETED' && falStatus.video?.url) {
            videoUrl = falStatus.video.url;
            providerStatus = { status: 'succeeded' };
          } else if (falStatus.status === 'FAILED') {
            providerStatus = { status: 'failed', error: falStatus.error || 'Video generation failed' };
          } else {
            // Still in progress
            return NextResponse.json({
              success: true,
              data: {
                ...job,
                status: 'running',
              },
            });
          }
        } else if (job.provider === 'runway') {
          // Poll Runway
          console.log(`[VideoJobs] Polling Runway status for job ${jobId}, provider_job_id: ${job.provider_job_id}`);
          const runwayStatus = await pollRunwayTask(job.provider_job_id);
          console.log(`[VideoJobs] Runway status mapped: ${runwayStatus.status} -> ${runwayStatus.status === 'SUCCEEDED' ? 'succeeded' : runwayStatus.status === 'FAILED' ? 'failed' : 'running'}`);
          
          if (runwayStatus.status === 'SUCCEEDED' && runwayStatus.output && runwayStatus.output.length > 0) {
            videoUrl = runwayStatus.output[0];
            providerStatus = { status: 'succeeded' };
          } else if (runwayStatus.status === 'FAILED' || runwayStatus.status === 'CANCELLED') {
            providerStatus = { status: 'failed', error: runwayStatus.failure || 'Video generation failed' };
          } else {
            // Still in progress
            return NextResponse.json({
              success: true,
              data: {
                ...job,
                status: 'running',
              },
            });
          }
        } else if (job.provider === 'opentune') {
          console.log(`[VideoJobs] Polling OpenTune status for job ${jobId}, provider_job_id: ${job.provider_job_id}`);
          const openTuneStatus = await pollOpenTuneTask(job.provider_job_id);
          console.log(`[VideoJobs] OpenTune status mapped: ${openTuneStatus.rawStatus || openTuneStatus.status} -> ${openTuneStatus.status === 'SUCCEEDED' ? 'succeeded' : openTuneStatus.status === 'FAILED' ? 'failed' : 'running'}`);

          if (openTuneStatus.status === 'SUCCEEDED' && openTuneStatus.videoUrl) {
            videoUrl = openTuneStatus.videoUrl;
            providerStatus = { status: 'succeeded' };
          } else if (openTuneStatus.status === 'FAILED') {
            providerStatus = { status: 'failed', error: openTuneStatus.error || 'Video generation failed' };
          } else {
            return NextResponse.json({
              success: true,
              data: {
                ...job,
                status: 'running',
              },
            });
          }
        } else {
          // Unknown provider
          return NextResponse.json({
            success: true,
            data: job,
          });
        }

        // If provider says complete, download and store video (idempotent: check if already uploaded)
        if (providerStatus.status === 'succeeded' && videoUrl) {
          // Idempotency check: if output_video_url already exists, skip upload
          if (job.output_video_url) {
            console.log(`[VideoJobs] Job ${jobId} already has output_video_url, skipping upload (idempotent)`);
            const signedUrl = await getSignedVideoUrl(job.output_video_url);
            return NextResponse.json({
              success: true,
              data: {
                ...job,
                signedVideoUrl: signedUrl,
              },
            });
          }

          try {
            console.log(`[VideoJobs] Starting upload to storage for job ${jobId}`);
            const storagePath = await storeVideoInSupabase(videoUrl, userId, jobId);
            console.log(`[VideoJobs] Upload completed for job ${jobId}, storage path: ${storagePath}`);
            
            // Update job with success
            await videoJobsDb.update(jobId, {
              status: 'succeeded',
              output_video_url: storagePath,
            });

            // Get updated job
            const updatedJob = await videoJobsDb.getById(jobId, userId);
            
            // Generate signed URL for playback
            const signedUrl = await getSignedVideoUrl(storagePath);

            return NextResponse.json({
              success: true,
              data: {
                ...updatedJob!,
                signedVideoUrl: signedUrl,
              },
            });
          } catch (storageError) {
            const errorMessage = storageError instanceof Error ? storageError.message : String(storageError);
            console.error(`[VideoJobs] Job ${jobId} failed to store video: ${errorMessage}`);
            await videoJobsDb.update(jobId, {
              status: 'failed',
              error: `Failed to store video: ${errorMessage}`,
            });

            return NextResponse.json({
              success: true,
              data: {
                ...job,
                status: 'failed',
                error: `Failed to store video: ${storageError instanceof Error ? storageError.message : String(storageError)}`,
              },
            });
          }
        } else if (providerStatus.status === 'failed') {
          // Update job with failure
          const errorMessage = providerStatus.error || 'Video generation failed';
          console.error(`[VideoJobs] Job ${jobId} failed: ${errorMessage}`);
          await videoJobsDb.update(jobId, {
            status: 'failed',
            error: errorMessage,
          });

          const updatedJob = await videoJobsDb.getById(jobId, userId);
          return NextResponse.json({
            success: true,
            data: updatedJob,
          });
        }
      } catch (pollError) {
        console.error('[VideoJobs] Error polling provider:', pollError);
        // Don't update job status on polling error - might be temporary
        return NextResponse.json({
          success: true,
          data: job,
        });
      }
    }

    // If job is succeeded, generate signed URL if not already provided
    if (job.status === 'succeeded' && job.output_video_url) {
      try {
        const signedUrl = await getSignedVideoUrl(job.output_video_url);
        return NextResponse.json({
          success: true,
          data: {
            ...job,
            signedVideoUrl: signedUrl,
          },
        });
      } catch (urlError) {
        console.error('[VideoJobs] Error generating signed URL:', urlError);
        // Return job without signed URL if generation fails
        return NextResponse.json({
          success: true,
          data: job,
        });
      }
    }

    // Return job as-is for other statuses
    return NextResponse.json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error('[/api/video/jobs/[id]] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to get job: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 }
    );
  }
}
