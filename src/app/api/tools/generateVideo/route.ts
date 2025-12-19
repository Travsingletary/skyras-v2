/**
 * Video Generation API Route
 * 
 * Generates videos using RunwayML API
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateRunwayVideo, pollRunwayVideo, type RunwayVideoRequest } from '@/lib/runway';
import { filesDb } from '@/lib/database';

export interface GenerateVideoRequest {
  prompt: string;
  imageUrl?: string; // Note: For image-to-video, use /v1/image_to_video endpoint instead
  duration?: number; // 4, 6, or 8 seconds (for veo3.1 models)
  aspectRatio?: '1280:720' | '720:1280' | '1080:1920' | '1920:1080';
  model?: 'veo3' | 'veo3.1' | 'veo3.1_fast';
  seed?: number;
  audio?: boolean; // Whether to generate audio (default: true)
  projectId?: string;
  agentName?: string;
  waitForCompletion?: boolean; // If true, polls until video is ready
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateVideoRequest;

    if (!body || !body.prompt) {
      return NextResponse.json(
        { error: 'prompt is required' },
        { status: 400 }
      );
    }

    // Check if Runway API key is configured
    if (!process.env.RUNWAY_API_KEY) {
      return NextResponse.json(
        {
          error: 'Runway API not configured. Please set RUNWAY_API_KEY environment variable.',
        },
        { status: 503 }
      );
    }

    // Generate video
    const videoRequest: RunwayVideoRequest = {
      prompt: body.prompt,
      imageUrl: body.imageUrl, // Note: text_to_video doesn't use imageUrl, use image_to_video endpoint for that
      duration: body.duration,
      aspectRatio: body.aspectRatio,
      model: body.model,
      seed: body.seed,
      audio: body.audio,
    };

    let videoResult;
    if (body.waitForCompletion) {
      // Start generation and poll until complete
      const initialResponse = await generateRunwayVideo(videoRequest);
      videoResult = await pollRunwayVideo(initialResponse.id);
    } else {
      // Just start generation, return immediately
      videoResult = await generateRunwayVideo(videoRequest);
    }

    // Save video to database if projectId provided
    let fileRecord = null;
    if (body.projectId && videoResult.videoUrl) {
      try {
        fileRecord = await filesDb.create({
          user_id: 'public',
          project_id: body.projectId,
          original_name: `runway_video_${videoResult.id}.mp4`,
          storage_path: videoResult.videoUrl,
          public_url: videoResult.videoUrl,
          file_type: 'video',
          file_size: 0, // Runway doesn't provide size upfront
          file_extension: '.mp4',
          processing_status: 'completed',
          processing_results: {
            runway_video_id: videoResult.id,
            prompt: body.prompt,
            model: body.model || 'gen3a_turbo',
            duration: videoResult.duration,
            generated_by: body.agentName || 'giorgio',
          },
          storage_provider: 'supabase',
          is_public: true,
          metadata: {
            runway_video_id: videoResult.id,
            prompt: body.prompt,
            model: body.model || 'gen3a_turbo',
            duration: videoResult.duration,
            generated_by: body.agentName || 'giorgio',
          },
        });
      } catch (error) {
        console.error('[generateVideo] Failed to save file record:', error);
        // Don't fail the request if file save fails
      }
    }

    return NextResponse.json({
      success: true,
      video: {
        id: videoResult.id,
        status: videoResult.status,
        videoUrl: videoResult.videoUrl,
        thumbnailUrl: videoResult.thumbnailUrl,
        duration: videoResult.duration,
      },
      file: fileRecord ? {
        id: fileRecord.id,
        url: fileRecord.public_url,
      } : null,
    });
  } catch (error) {
    console.error('[generateVideo] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Video generation failed',
      },
      { status: 500 }
    );
  }
}

