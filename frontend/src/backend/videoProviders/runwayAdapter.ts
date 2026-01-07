// Runway ML video generation adapter

import type { VideoGenerationArgs, VideoProviderResult, VideoProvider } from './types';
import { createClient } from '@supabase/supabase-js';

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
    console.log(`[RunwayAdapter] Task ${taskId} status: ${task.status} (attempt ${attempts + 1}/${maxAttempts})`);

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
 * Download and store video in Supabase Storage
 */
async function storeVideoInSupabase(videoUrl: string, projectId?: string, model?: string): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return videoUrl; // Return original URL if Supabase not configured
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Download video from Runway
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error('Failed to download video from Runway');
    }

    const videoBuffer = await videoResponse.arrayBuffer();
    const fileName = `${projectId || 'video'}/${Date.now()}-${model || 'runway'}.mp4`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-uploads')
      .upload(fileName, videoBuffer, {
        contentType: 'video/mp4',
        upsert: false,
      });

    if (uploadError) {
      console.error('[RunwayAdapter] Supabase upload error:', uploadError);
      return videoUrl; // Return original URL if upload fails
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(uploadData.path);

    console.log('[RunwayAdapter] Video stored in Supabase:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('[RunwayAdapter] Failed to store in Supabase:', error);
    return videoUrl; // Return original URL if storage fails
  }
}

export const runwayAdapter: VideoProvider = {
  isConfigured(): boolean {
    return !!RUNWAY_API_KEY;
  },

  async executeCreate(args: VideoGenerationArgs): Promise<VideoProviderResult> {
    if (!this.isConfigured()) {
      throw new Error('Runway API key not configured');
    }

    const {
      prompt,
      imageUrl,
      duration = 5,
      aspectRatio = '16:9',
      model = 'gen3a_turbo',
    } = args;

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    console.log('[RunwayAdapter] Starting video generation:', {
      prompt: prompt.substring(0, 100),
      imageUrl: imageUrl ? 'provided' : 'none',
      duration,
      aspectRatio,
      model,
    });

    // Convert aspect ratio to Runway format
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
      console.error('[RunwayAdapter] Runway API error:', errorText);
      throw new Error(`Runway API error: ${taskResponse.status} - ${errorText}`);
    }

    const taskData: RunwayTask = await taskResponse.json();
    console.log('[RunwayAdapter] Task created:', taskData.id);

    // Poll for completion
    const result = await pollForCompletion(taskData.id);

    if (result.status !== 'SUCCEEDED' || !result.output || result.output.length === 0) {
      console.error('[RunwayAdapter] Task failed:', result.failure || 'No output');
      throw new Error(result.failure || 'Video generation failed');
    }

    const videoUrl = result.output[0];
    console.log('[RunwayAdapter] Video generated:', videoUrl);

    // Store in Supabase if configured
    const storedVideoUrl = await storeVideoInSupabase(videoUrl, args.projectId, model);

    return {
      videoUrl: storedVideoUrl,
      thumbnailUrl: '',
      taskId: taskData.id,
      modelName: model,
      providerName: 'runway',
      duration,
      prompt,
    };
  },
};
