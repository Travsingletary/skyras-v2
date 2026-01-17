/**
 * Video Generation API Route
 *
 * Generates videos using multiple providers (Kling AI, Runway ML)
 * Supports text-to-video and image-to-video generation
 * Uses provider router for automatic fallback
 */

import { NextRequest, NextResponse } from 'next/server';
import { executeCreate } from '@/backend/videoProviders/router';
import type { VideoGenerationArgs } from '@/backend/videoProviders/types';
import {
  saveAssetFromUrl,
  updateManifestWithAsset,
  isQnapAvailable,
} from '@/backend/storage/qnapStorage';
import { applyRateLimit } from '@/lib/withRateLimit';
import { RATE_LIMITS } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for video generation

interface VideoGenerationRequest {
  prompt: string;
  imageUrl?: string;
  duration?: number;
  aspectRatio?: string;
  model?: string;
  projectId?: string;
  workflowId?: string;
  agentName?: string;
  waitForCompletion?: boolean;
  // Provider selection
  provider?: 'kling' | 'runway' | 'fal-pika' | 'opentune';
  // Kling-specific options
  klingModel?: '2.5-turbo' | '1.0' | '2.6';
  motionStrength?: 'low' | 'medium' | 'high' | number;
  editOptions?: {
    lighting?: string;
    weather?: string;
    cameraAngle?: string;
    removeWatermark?: boolean;
    replaceCharacter?: string;
  };
}

export async function POST(request: NextRequest) {
  // Apply rate limiting: 10 requests per 5 minutes
  const rateLimitResult = applyRateLimit(request, RATE_LIMITS.AI_GENERATION);
  if (!rateLimitResult.success) {
    return rateLimitResult.response;
  }

  try {
    const body: VideoGenerationRequest = await request.json();
    const {
      prompt,
      imageUrl,
      duration = 5,
      aspectRatio = '16:9',
      model,
      projectId,
      workflowId,
      agentName = 'giorgio',
      waitForCompletion = true,
      provider,
      klingModel,
      motionStrength,
      editOptions,
    } = body;

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log('[VideoGen] Starting video generation:', {
      prompt: prompt.substring(0, 100),
      imageUrl: imageUrl ? 'provided' : 'none',
      duration,
      aspectRatio,
      model: model || 'default',
      provider: provider || 'auto',
      klingModel,
    });

    // Build video generation args
    const videoArgs: VideoGenerationArgs = {
      prompt,
      imageUrl,
      duration,
      aspectRatio,
      model,
      projectId,
      provider,
      klingModel,
      waitForCompletion,
      motionStrength,
      editOptions,
    };

    // Use provider router to generate video
    const result = await executeCreate(videoArgs);

    // If waitForCompletion is false, return task ID immediately (if available)
    if (!waitForCompletion && result.taskId) {
      return NextResponse.json({
        success: true,
        taskId: result.taskId,
        status: 'PENDING',
        provider: result.providerName,
      });
    }

    // Save to QNAP if configured and workflowId provided
    let qnapPath: string | undefined;
    if (projectId && workflowId && result.videoUrl) {
      try {
        const qnapAvailable = await isQnapAvailable();
        if (qnapAvailable) {
          const providerName = result.providerName || 'video';
          const modelName = result.modelName.replace(/[^a-zA-Z0-9_-]/g, '_');
          const savedAsset = await saveAssetFromUrl(result.videoUrl, {
            project: projectId,
            workflowId,
            assetType: 'video',
            filename: `video_${providerName}_${modelName}_${Date.now()}.mp4`,
            metadata: {
              provider: result.providerName,
              model: result.modelName,
              duration: result.duration,
              prompt: result.prompt,
              aspectRatio,
              klingModel,
              editOptions,
            },
          });
          await updateManifestWithAsset(projectId, workflowId, savedAsset);
          qnapPath = savedAsset.relativePath;
        }
      } catch (error) {
        console.error('[VideoGen] Failed to save to QNAP:', error);
        // Don't fail the request if QNAP save fails
      }
    }

    return NextResponse.json({
      success: true,
      video: {
        id: result.taskId || 'unknown',
        videoUrl: result.videoUrl,
        thumbnailUrl: result.thumbnailUrl,
        duration: result.duration,
        model: result.modelName,
        prompt: result.prompt,
        provider: result.providerName,
        qnapPath,
      },
    });

  } catch (error) {
    console.error('[VideoGen] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate video';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

