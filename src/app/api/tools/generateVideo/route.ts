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

const VIDEO_PROVIDER_NAME = process.env.VIDEO_PROVIDER_NAME || 'runway';

const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY || '';
const RUNWAY_API_BASE_URL = process.env.RUNWAY_API_BASE_URL || 'https://api.dev.runwayml.com';
const RUNWAY_API_VERSION = '2024-11-06';

const POLLO_API_KEY = process.env.POLLO_API_KEY || '';
const POLLO_API_BASE_URL = process.env.POLLO_API_BASE_URL || 'https://pollo.ai/api/platform';
const POLLO_VIDEO_MODEL = process.env.POLLO_VIDEO_MODEL || 'pollo-v1-6';
const POLLO_VIDEO_RESOLUTION = process.env.POLLO_VIDEO_RESOLUTION || '480p';
const POLLO_VIDEO_MODE = process.env.POLLO_VIDEO_MODE || 'basic';

interface RunwayTask {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
  output?: string[];
  failure?: string;
  failureCode?: string;
}

type PolloTaskStatus = 'waiting' | 'processing' | 'succeed' | 'failed';

interface PolloGenerationStatus {
  id: string;
  status: PolloTaskStatus;
  failMsg: string | null;
  url: string | null;
  mediaType: 'image' | 'video' | 'text' | 'audio';
  createdDate?: string | null;
  updatedDate?: string | null;
}

interface PolloStatusResponse {
  taskId: string;
  generations: PolloGenerationStatus[];
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
  provider?: 'runway' | 'pollo';
}

export async function POST(request: NextRequest) {
  try {
    const body: VideoGenerationRequest = await request.json();
    const {
      prompt,
      imageUrl,
      duration = 5,
      aspectRatio = '16:9',
      model,
      projectId,
      agentName = 'giorgio',
      waitForCompletion = true,
      provider,
    } = body;

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const chosenProvider = provider || (VIDEO_PROVIDER_NAME as VideoGenerationRequest['provider']) || 'runway';

    console.log('[VideoGen] Starting video generation:', {
      prompt: prompt.substring(0, 100),
      imageUrl: imageUrl ? 'provided' : 'none',
      duration,
      aspectRatio,
      model: model || '(default)',
      provider: chosenProvider,
    });

    let taskId: string;
    let providerModel: string;
    let videoUrl: string;

    if (chosenProvider === 'pollo') {
      if (!POLLO_API_KEY) {
        console.error('[VideoGen] POLLO_API_KEY not configured');
        return NextResponse.json(
          { success: false, error: 'Pollo API key not configured' },
          { status: 503 }
        );
      }

      const polloModel = model || POLLO_VIDEO_MODEL;
      providerModel = polloModel;
      const pollo = await createPolloVideoTask({
        prompt,
        imageUrl,
        duration,
        model: polloModel,
        waitForCompletion,
      });

      taskId = pollo.taskId;

      if (!waitForCompletion) {
        return NextResponse.json({
          success: true,
          taskId,
          status: 'waiting',
          provider: 'pollo',
          model: providerModel,
        });
      }

      videoUrl = pollo.videoUrl;
    } else {
      // Default: Runway
      if (!RUNWAY_API_KEY) {
        console.error('[VideoGen] RUNWAY_API_KEY not configured');
        return NextResponse.json(
          { success: false, error: 'Runway API key not configured' },
          { status: 503 }
        );
      }

      const runwayModel = model || 'gen3a_turbo';
      providerModel = runwayModel;
      const runway = await createRunwayVideoTask({
        prompt,
        imageUrl,
        duration,
        aspectRatio,
        model: runwayModel,
        waitForCompletion,
      });

      taskId = runway.taskId;

      if (!waitForCompletion) {
        return NextResponse.json({
          success: true,
          taskId,
          status: 'PENDING',
          provider: 'runway',
          model: providerModel,
        });
      }

      videoUrl = runway.videoUrl;
    }

    console.log('[VideoGen] Video generated:', { provider: chosenProvider, taskId });

    // Download and store video in Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
        const fileName = `${projectId || 'video'}/${Date.now()}-${chosenProvider}-${providerModel}.mp4`;

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
        id: taskId,
        videoUrl: storedVideoUrl,
        thumbnailUrl,
        duration,
        model: providerModel,
        prompt,
        provider: chosenProvider,
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

async function createRunwayVideoTask(params: {
  prompt: string;
  imageUrl?: string;
  duration: number;
  aspectRatio: string;
  model: string;
  waitForCompletion: boolean;
}): Promise<{ taskId: string; videoUrl: string }> {
  // Convert aspect ratio to Runway format (width:height)
  const ratio = convertAspectRatio(params.aspectRatio);

  // Choose endpoint based on whether we have an image
  const endpoint = params.imageUrl ? '/v1/image_to_video' : '/v1/text_to_video';
  const requestBody = params.imageUrl
    ? {
        model: params.model,
        promptImage: params.imageUrl,
        promptText: params.prompt,
        duration: params.duration,
        ratio,
      }
    : {
        model: params.model,
        promptText: params.prompt,
        duration: params.duration,
        ratio,
      };

  // Create video generation task
  const taskResponse = await fetch(`${RUNWAY_API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RUNWAY_API_KEY}`,
      'Content-Type': 'application/json',
      'X-Runway-Version': RUNWAY_API_VERSION,
    },
    body: JSON.stringify(requestBody),
  });

  if (!taskResponse.ok) {
    const errorText = await taskResponse.text();
    console.error('[VideoGen] Runway API error:', errorText);
    throw new Error(`Runway API error: ${taskResponse.status}`);
  }

  const taskData: RunwayTask = await taskResponse.json();
  console.log('[VideoGen] Runway task created:', taskData.id);

  if (!params.waitForCompletion) {
    return { taskId: taskData.id, videoUrl: '' };
  }

  const result = await pollRunwayForCompletion(taskData.id);

  if (result.status !== 'SUCCEEDED' || !result.output || result.output.length === 0) {
    throw new Error(result.failure || 'Runway video generation failed');
  }

  return { taskId: taskData.id, videoUrl: result.output[0] };
}

async function createPolloVideoTask(params: {
  prompt: string;
  imageUrl?: string;
  duration: number;
  model: string;
  waitForCompletion: boolean;
}): Promise<{ taskId: string; videoUrl: string }> {
  const input: Record<string, unknown> = {
    prompt: params.prompt,
    resolution: POLLO_VIDEO_RESOLUTION,
    mode: POLLO_VIDEO_MODE,
    length: params.duration,
  };

  if (params.imageUrl) {
    input.image = params.imageUrl;
  }

  const taskResponse = await fetch(`${POLLO_API_BASE_URL}/generation/pollo/${params.model}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': POLLO_API_KEY,
    },
    body: JSON.stringify({ input }),
  });

  if (!taskResponse.ok) {
    const errorText = await taskResponse.text();
    console.error('[VideoGen] Pollo API error:', errorText);
    throw new Error(`Pollo API error: ${taskResponse.status}`);
  }

  const taskData = (await taskResponse.json()) as { taskId?: string; status?: string };
  const taskId = taskData.taskId;
  if (!taskId) {
    throw new Error('Pollo API did not return taskId');
  }

  console.log('[VideoGen] Pollo task created:', taskId);

  if (!params.waitForCompletion) {
    return { taskId, videoUrl: '' };
  }

  const status = await pollPolloForCompletion(taskId);
  const video = status.generations.find(
    (g) => g.mediaType === 'video' && g.status === 'succeed' && typeof g.url === 'string' && g.url.length > 0
  );

  if (!video?.url) {
    const failed = status.generations.find((g) => g.mediaType === 'video' && g.status === 'failed');
    throw new Error(failed?.failMsg || 'Pollo video generation failed');
  }

  return { taskId, videoUrl: video.url };
}

/**
 * Poll Runway task until completion
 */
async function pollRunwayForCompletion(taskId: string, maxAttempts = 120): Promise<RunwayTask> {
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

async function pollPolloForCompletion(taskId: string, maxAttempts = 150): Promise<PolloStatusResponse> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const response = await fetch(`${POLLO_API_BASE_URL}/generation/${taskId}/status`, {
      headers: {
        'x-api-key': POLLO_API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[VideoGen] Pollo status error:', errorText);
      throw new Error(`Failed to get Pollo task status: ${response.status}`);
    }

    const status = (await response.json()) as PolloStatusResponse;
    const videoGen = status.generations?.find((g) => g.mediaType === 'video');
    const state = videoGen?.status || 'waiting';

    console.log(`[VideoGen] Pollo task ${taskId} status: ${state} (attempt ${attempts + 1}/${maxAttempts})`);

    if (status.generations?.some((g) => g.mediaType === 'video' && g.status === 'succeed' && g.url)) {
      return status;
    }

    if (status.generations?.some((g) => g.mediaType === 'video' && g.status === 'failed')) {
      return status;
    }

    // Wait 2 seconds before next poll
    await new Promise((resolve) => setTimeout(resolve, 2000));
    attempts++;
  }

  throw new Error('Pollo video generation timed out');
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
