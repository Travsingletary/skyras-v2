// Kling AI video generation adapter

import type { VideoGenerationArgs, VideoProviderResult, VideoProvider } from './types';
import { createClient } from '@supabase/supabase-js';

const KLING_API_KEY = process.env.KLING_API_KEY || '';
const KLING_API_BASE_URL = process.env.KLING_API_BASE_URL || 'https://api.klingai.com';

export type KlingModel = '2.5-turbo' | '1.0' | '2.6';

interface KlingTask {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  thumbnail_url?: string;
  error?: string;
}

/**
 * Map Kling model names to API model identifiers
 */
function getKlingModelId(model: KlingModel): string {
  const modelMap: Record<KlingModel, string> = {
    '2.5-turbo': 'kling-2.5-turbo',
    '1.0': 'kling-1.0',
    '2.6': 'kling-2.6',
  };
  return modelMap[model] || 'kling-2.5-turbo';
}

/**
 * Convert aspect ratio to Kling format
 */
function convertAspectRatio(ratio: string): string {
  // Kling uses similar format to Runway
  const ratioMap: Record<string, string> = {
    '16:9': '1280:720',
    '9:16': '720:1280',
    '1:1': '1024:1024',
    '4:3': '1024:768',
    '3:4': '768:1024',
  };
  return ratioMap[ratio] || '1280:720';
}

/**
 * Poll Kling task until completion
 */
async function pollForCompletion(taskId: string, maxAttempts = 120): Promise<KlingTask> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const response = await fetch(`${KLING_API_BASE_URL}/v1/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${KLING_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get task status: ${response.status}`);
    }

    const task: KlingTask = await response.json();
    console.log(`[KlingAdapter] Task ${taskId} status: ${task.status} (attempt ${attempts + 1}/${maxAttempts})`);

    if (task.status === 'completed' || task.status === 'failed') {
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

    // Download video from Kling
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error('Failed to download video from Kling');
    }

    const videoBuffer = await videoResponse.arrayBuffer();
    const fileName = `${projectId || 'video'}/${Date.now()}-${model || 'kling'}.mp4`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-uploads')
      .upload(fileName, videoBuffer, {
        contentType: 'video/mp4',
        upsert: false,
      });

    if (uploadError) {
      console.error('[KlingAdapter] Supabase upload error:', uploadError);
      return videoUrl; // Return original URL if upload fails
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(uploadData.path);

    console.log('[KlingAdapter] Video stored in Supabase:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('[KlingAdapter] Failed to store in Supabase:', error);
    return videoUrl; // Return original URL if storage fails
  }
}

export const klingAdapter: VideoProvider = {
  isConfigured(): boolean {
    return !!KLING_API_KEY;
  },

  async executeCreate(args: VideoGenerationArgs): Promise<VideoProviderResult> {
    if (!this.isConfigured()) {
      throw new Error('Kling API key not configured');
    }

    const {
      prompt,
      imageUrl,
      duration = 5,
      aspectRatio = '16:9',
      klingModel = '2.5-turbo',
      editOptions,
    } = args;

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    // Kling primarily supports image-to-video
    if (!imageUrl) {
      throw new Error('Kling AI requires an imageUrl for image-to-video generation');
    }

    console.log('[KlingAdapter] Starting video generation:', {
      prompt: prompt.substring(0, 100),
      imageUrl,
      duration,
      aspectRatio,
      model: klingModel,
      hasEditOptions: !!editOptions,
    });

    const modelId = getKlingModelId(klingModel);
    const ratio = convertAspectRatio(aspectRatio);

    // Build request body
    const requestBody: any = {
      model: modelId,
      image_url: imageUrl,
      prompt: prompt,
      duration,
      aspect_ratio: ratio,
    };

    // Add post-production editing options if provided
    if (editOptions) {
      if (editOptions.lighting) {
        requestBody.lighting = editOptions.lighting;
      }
      if (editOptions.weather) {
        requestBody.weather = editOptions.weather;
      }
      if (editOptions.cameraAngle) {
        requestBody.camera_angle = editOptions.cameraAngle;
      }
      if (editOptions.removeWatermark) {
        requestBody.remove_watermark = true;
      }
      if (editOptions.replaceCharacter) {
        requestBody.replace_character = editOptions.replaceCharacter;
      }
    }

    // Create video generation task
    const taskResponse = await fetch(`${KLING_API_BASE_URL}/v1/video/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KLING_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!taskResponse.ok) {
      const errorText = await taskResponse.text();
      console.error('[KlingAdapter] Kling API error:', errorText);
      throw new Error(`Kling API error: ${taskResponse.status} - ${errorText}`);
    }

    const taskData: KlingTask = await taskResponse.json();
    console.log('[KlingAdapter] Task created:', taskData.id);

    // Poll for completion
    const result = await pollForCompletion(taskData.id);

    if (result.status !== 'completed' || !result.video_url) {
      console.error('[KlingAdapter] Task failed:', result.error || 'No video URL');
      throw new Error(result.error || 'Video generation failed');
    }

    const videoUrl = result.video_url;
    console.log('[KlingAdapter] Video generated:', videoUrl);

    // Store in Supabase if configured
    const storedVideoUrl = await storeVideoInSupabase(videoUrl, args.projectId, klingModel);

    return {
      videoUrl: storedVideoUrl,
      thumbnailUrl: result.thumbnail_url,
      taskId: taskData.id,
      modelName: modelId,
      providerName: 'kling',
      duration,
      prompt,
    };
  },
};
