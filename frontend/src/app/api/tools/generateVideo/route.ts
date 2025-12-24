/**
 * Video Generation API Route
 *
 * Generates videos using Runway ML API (Gen-3 Alpha Turbo or other models)
 * Supports text-to-video and image-to-video generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for video generation

const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY || '';
const RUNWAY_API_BASE_URL = process.env.RUNWAY_API_BASE_URL || 'https://api.dev.runwayml.com';
const RUNWAY_API_VERSION = '2024-11-06';

interface RunwayTask {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
  output?: string[];
  failure?: string;
  failureCode?: string;
}

interface VideoGenerationRequest {
  prompt: string;
  imageUrl?: string;
  duration?: number;
  aspectRatio?: string;
  model?: string;
  projectId?: string;
  agentName?: string;
  waitForCompletion?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Verify Runway API key
    if (!RUNWAY_API_KEY) {
      console.error('[VideoGen] RUNWAY_API_KEY not configured');
      return NextResponse.json(
        { success: false, error: 'Runway API key not configured' },
        { status: 503 }
      );
    }

    const body: VideoGenerationRequest = await request.json();
    const {
      prompt,
      imageUrl,
      duration = 5,
      aspectRatio = '16:9',
      model = 'gen3a_turbo',
      projectId,
      agentName = 'giorgio',
      waitForCompletion = true,
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
      model,
    });

    // Convert aspect ratio to Runway format (width:height)
    const ratio = convertAspectRatio(aspectRatio);

    // Choose endpoint based on whether we have an image
    const endpoint = imageUrl ? '/v1/image_to_video' : '/v1/text_to_video';
    const requestBody = imageUrl
      ? {
          model,
          promptImage: imageUrl,
          promptText: prompt,
          duration,
          ratio,
        }
      : {
          model,
          promptText: prompt,
          duration,
          ratio,
        };

    // Create video generation task
    const taskResponse = await fetch(`${RUNWAY_API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RUNWAY_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': RUNWAY_API_VERSION,
      },
      body: JSON.stringify(requestBody),
    });

    if (!taskResponse.ok) {
      const errorText = await taskResponse.text();
      console.error('[VideoGen] Runway API error:', errorText);
      return NextResponse.json(
        { success: false, error: `Runway API error: ${taskResponse.status}` },
        { status: 500 }
      );
    }

    const taskData: RunwayTask = await taskResponse.json();
    console.log('[VideoGen] Task created:', taskData.id);

    // If waitForCompletion is false, return task ID immediately
    if (!waitForCompletion) {
      return NextResponse.json({
        success: true,
        taskId: taskData.id,
        status: 'PENDING',
      });
    }

    // Poll for completion
    const result = await pollForCompletion(taskData.id);

    if (result.status !== 'SUCCEEDED' || !result.output || result.output.length === 0) {
      console.error('[VideoGen] Task failed:', result.failure || 'No output');
      return NextResponse.json(
        {
          success: false,
          error: result.failure || 'Video generation failed',
          failureCode: result.failureCode,
        },
        { status: 500 }
      );
    }

    const videoUrl = result.output[0];
    console.log('[VideoGen] Video generated:', videoUrl);

    // Download and store video in Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    // Support both old and new env var names for the service key
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

    let storedVideoUrl = videoUrl;
    let thumbnailUrl = '';

    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Download video from Runway
        const videoResponse = await fetch(videoUrl);
        if (!videoResponse.ok) {
          throw new Error('Failed to download video from Runway');
        }

        const videoBuffer = await videoResponse.arrayBuffer();
        const fileName = `${projectId || 'video'}/${Date.now()}-${model}.mp4`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('user-uploads')
          .upload(fileName, videoBuffer, {
            contentType: 'video/mp4',
            upsert: false,
          });

        if (uploadError) {
          console.error('[VideoGen] Supabase upload error:', uploadError);
        } else {
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('user-uploads')
            .getPublicUrl(uploadData.path);

          storedVideoUrl = urlData.publicUrl;
          console.log('[VideoGen] Video stored in Supabase:', storedVideoUrl);
        }
      } catch (error) {
        console.error('[VideoGen] Failed to store in Supabase:', error);
        // Continue with Runway URL if storage fails
      }
    }

    return NextResponse.json({
      success: true,
      video: {
        id: taskData.id,
        videoUrl: storedVideoUrl,
        thumbnailUrl,
        duration,
        model,
        prompt,
      },
    });

  } catch (error) {
    console.error('[VideoGen] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate video' },
      { status: 500 }
    );
  }
}

/**
 * Poll Runway task until completion
 */
async function pollForCompletion(taskId: string, maxAttempts = 120): Promise<RunwayTask> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const response = await fetch(`${RUNWAY_API_BASE_URL}/v1/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${RUNWAY_API_KEY}`,
        'X-Runway-Version': RUNWAY_API_VERSION,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get task status: ${response.status}`);
    }

    const task: RunwayTask = await response.json();
    console.log(`[VideoGen] Task ${taskId} status: ${task.status} (attempt ${attempts + 1}/${maxAttempts})`);

    if (task.status === 'SUCCEEDED' || task.status === 'FAILED' || task.status === 'CANCELLED') {
      return task;
    }

    // Wait 2 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 2000));
    attempts++;
  }

  throw new Error('Video generation timed out');
}

/**
 * Convert aspect ratio string to Runway format
 */
function convertAspectRatio(ratio: string): string {
  const ratioMap: Record<string, string> = {
    '16:9': '1280:720',
    '9:16': '720:1280',
    '1:1': '1024:1024',
    '4:3': '1024:768',
    '3:4': '768:1024',
  };

  return ratioMap[ratio] || '1280:720'; // Default to 16:9
}
