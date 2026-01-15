import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId, logAuthIdentity } from '@/lib/auth';
import { videoJobsDb } from '@/lib/database';
import { checkQuota, incrementQuota } from '@/lib/videoQuota';
import { filesDb } from '@/lib/database';
import { executeCreate } from '@/backend/videoProviders/router';
import { getSupabaseStorageClient } from '@/backend/supabaseClient';

export const runtime = 'nodejs';

const MAX_IMAGE_SIZE_MB = parseInt(process.env.VIDEO_MAX_IMAGE_MB || '10', 10);
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const DEFAULT_DURATION = parseInt(process.env.VIDEO_DEFAULT_DURATION || '4', 10);
const DEFAULT_RESOLUTION = process.env.VIDEO_DEFAULT_RESOLUTION || '720p';
const DEFAULT_MOTION = process.env.VIDEO_DEFAULT_MOTION || 'low';

interface AnimateRequest {
  sourceImagePath?: string;
  sourceImageUrl?: string;
  imageId?: string; // File ID from files table
  clientRequestId?: string; // UUID from client to prevent duplicate requests
  options?: {
    durationSec?: number;
    resolution?: string;
    motionStrength?: 'low' | 'medium' | 'high';
  };
}

/**
 * Validate image file type
 */
function isValidImageType(fileType: string, fileName: string): boolean {
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  const validExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
  
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return validTypes.includes(fileType.toLowerCase()) || validExtensions.includes(extension);
}

/**
 * Get image URL from various input formats
 */
async function getImageUrl(
  userId: string,
  input: AnimateRequest
): Promise<{ url: string; size?: number }> {
  // Option 1: Direct URL provided
  if (input.sourceImageUrl) {
    // Validate it's a valid URL
    try {
      new URL(input.sourceImageUrl);
      return { url: input.sourceImageUrl };
    } catch {
      throw new Error('Invalid sourceImageUrl: must be a valid URL');
    }
  }

  // Option 2: File ID from files table
  if (input.imageId) {
    const fileRecord = await filesDb.getById(input.imageId);
    if (!fileRecord) {
      throw new Error(`File not found: ${input.imageId}`);
    }

    // Verify ownership
    if (fileRecord.user_id !== userId) {
      throw new Error('File does not belong to user');
    }

    // Verify it's an image
    if (!isValidImageType(fileRecord.file_type, fileRecord.original_name)) {
      throw new Error(`File is not a valid image type: ${fileRecord.file_type}`);
    }

    // Check file size
    if (fileRecord.file_size > MAX_IMAGE_SIZE_BYTES) {
      throw new Error(`Image too large: ${fileRecord.file_size} bytes (max ${MAX_IMAGE_SIZE_BYTES})`);
    }

    return { url: fileRecord.public_url, size: fileRecord.file_size };
  }

  // Option 3: Storage path
  if (input.sourceImagePath) {
    // Validate path format and get signed URL
    const supabase = getSupabaseStorageClient();
    if (!supabase) {
      throw new Error('Supabase storage not configured');
    }

    // Generate signed URL for the path
    const { data, error } = await supabase.storage
      .from('source-images')
      .createSignedUrl(input.sourceImagePath, 3600); // 1 hour expiry

    if (error || !data?.signedUrl) {
      throw new Error(`Failed to generate signed URL for path: ${input.sourceImagePath}`);
    }

    return { url: data.signedUrl };
  }

  throw new Error('Must provide one of: sourceImageUrl, imageId, or sourceImagePath');
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await getAuthenticatedUserId(request);
    logAuthIdentity('/api/video/animate', userId);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: AnimateRequest = await request.json();

    // Get and validate image URL
    let imageUrl: string;
    try {
      const imageData = await getImageUrl(userId, body);
      imageUrl = imageData.url;

      // Validate file size if we have it
      if (imageData.size && imageData.size > MAX_IMAGE_SIZE_BYTES) {
        return NextResponse.json(
          {
            success: false,
            error: `Image too large: ${(imageData.size / 1024 / 1024).toFixed(2)}MB (max ${MAX_IMAGE_SIZE_MB}MB)`,
          },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Invalid image input',
        },
        { status: 400 }
      );
    }

    // Check for existing job with same client_request_id (duplicate prevention)
    if (body.clientRequestId) {
      const existingJob = await videoJobsDb.getByClientRequestId(userId, body.clientRequestId);
      if (existingJob) {
        console.log(`[VideoAnimate] Duplicate request detected (client_request_id: ${body.clientRequestId}), returning existing job: ${existingJob.id}`);
        return NextResponse.json({
          success: true,
          data: {
            jobId: existingJob.id,
            status: existingJob.status,
            provider: existingJob.provider,
            createdAt: existingJob.created_at,
            duplicate: true,
          },
        });
      }
    }

    // Check quota
    const quotaCheck = await checkQuota(userId);
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Daily quota exceeded',
          details: {
            limit: quotaCheck.limit,
            remaining: quotaCheck.remaining,
          },
        },
        { status: 429 }
      );
    }

    // Prepare options
    const options = {
      duration: body.options?.durationSec || DEFAULT_DURATION,
      resolution: body.options?.resolution || DEFAULT_RESOLUTION,
      motionStrength: body.options?.motionStrength || DEFAULT_MOTION,
    };

    // Create job record with status='queued'
    console.log(`[VideoAnimate] Creating job for user ${userId}, client_request_id: ${body.clientRequestId || 'none'}`);
    const job = await videoJobsDb.create({
      user_id: userId,
      source_image_url: imageUrl,
      provider: 'fal-pika', // Will be updated based on which provider succeeds
      status: 'queued',
      options,
      client_request_id: body.clientRequestId,
    });

    try {
      // Call provider (Fal.ai or Runway)
      console.log(`[VideoAnimate] Starting provider job for job ${job.id}, provider: fal-pika (will update if different)`);
      const providerResult = await executeCreate({
        prompt: 'Animate image', // Placeholder prompt for image-to-video
        imageUrl,
        duration: options.duration,
        aspectRatio: '16:9', // Default aspect ratio
        motionStrength: options.motionStrength as any,
      });

      console.log(`[VideoAnimate] Provider job started: ${providerResult.providerName}, taskId: ${providerResult.taskId}`);

      // Update job with provider info and status='running'
      await videoJobsDb.update(job.id, {
        provider: providerResult.providerName as 'fal-pika' | 'runway',
        provider_job_id: providerResult.taskId,
        status: 'running',
      });

      // Increment quota (only after successful provider call)
      await incrementQuota(userId);

      return NextResponse.json({
        success: true,
        data: {
          jobId: job.id,
          status: 'running',
          provider: providerResult.providerName,
          createdAt: job.created_at,
        },
      });
    } catch (providerError) {
      // Update job with error
      const errorMessage = providerError instanceof Error ? providerError.message : 'Provider error';
      console.error(`[VideoAnimate] Job ${job.id} failed: ${errorMessage}`);
      await videoJobsDb.update(job.id, {
        status: 'failed',
        error: errorMessage,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to start video animation',
          details: providerError instanceof Error ? providerError.message : String(providerError),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[/api/video/animate] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Animation request failed: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 }
    );
  }
}
