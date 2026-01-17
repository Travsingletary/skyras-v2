// OpenTune image-to-video adapter

import type { VideoGenerationArgs, VideoProviderResult, VideoProvider } from './types';
import { createClient } from '@supabase/supabase-js';

const OPENTUNE_API_KEY = process.env.OPENTUNE_API_KEY || '';
const OPENTUNE_API_BASE_URL = process.env.OPENTUNE_API_BASE_URL || 'https://api.opentune.ai';
const OPENTUNE_IMAGE_TO_VIDEO_ENDPOINT =
  process.env.OPENTUNE_IMAGE_TO_VIDEO_ENDPOINT || '/v1/image-to-video';
const OPENTUNE_STATUS_ENDPOINT =
  process.env.OPENTUNE_STATUS_ENDPOINT || '/v1/video/jobs/{id}';
const OPENTUNE_DEFAULT_MODEL =
  process.env.OPENTUNE_DEFAULT_MODEL || 'opentune-image-to-video';

const DEFAULT_POLL_INTERVAL_MS = 2000;
const DEFAULT_POLL_MAX_ATTEMPTS = 120;

type OpenTuneStatus = 'RUNNING' | 'SUCCEEDED' | 'FAILED';

interface OpenTuneTaskStatus {
  status: OpenTuneStatus;
  videoUrl?: string;
  error?: string;
  rawStatus?: string;
}

type OpenTuneResponse = Record<string, unknown>;

function buildUrl(pathOrUrl: string): string {
  if (!pathOrUrl) {
    return OPENTUNE_API_BASE_URL;
  }
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  const base = OPENTUNE_API_BASE_URL.replace(/\/$/, '');
  const suffix = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${suffix}`;
}

function resolveStatusUrl(taskId: string): string {
  const template = OPENTUNE_STATUS_ENDPOINT;
  const normalized = template.includes('{id}')
    ? template.replace('{id}', taskId)
    : `${template.replace(/\/$/, '')}/${taskId}`;
  return buildUrl(normalized);
}

function getAuthHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${OPENTUNE_API_KEY}`,
    'X-Api-Key': OPENTUNE_API_KEY,
    'Content-Type': 'application/json',
  };
}

function extractTaskId(data: OpenTuneResponse): string | undefined {
  const candidates = ['id', 'job_id', 'request_id', 'task_id'];
  for (const key of candidates) {
    const value = data[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }
  return undefined;
}

function extractVideoUrl(data: OpenTuneResponse): string | undefined {
  const directCandidates = ['video_url', 'output_url', 'url'];
  for (const key of directCandidates) {
    const value = data[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  const nestedVideo = data.video;
  if (nestedVideo && typeof nestedVideo === 'object') {
    const value = (nestedVideo as Record<string, unknown>).url;
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  const output = data.output;
  if (Array.isArray(output) && output.length > 0 && typeof output[0] === 'string') {
    return output[0];
  }

  const result = data.result;
  if (result && typeof result === 'object') {
    const value = (result as Record<string, unknown>).video_url;
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return undefined;
}

function normalizeStatus(rawStatus?: string, videoUrl?: string): OpenTuneStatus {
  if (videoUrl) {
    return 'SUCCEEDED';
  }
  const normalized = rawStatus?.toLowerCase() || '';
  if (['succeeded', 'success', 'completed', 'done'].includes(normalized)) {
    return 'SUCCEEDED';
  }
  if (['failed', 'error', 'canceled', 'cancelled'].includes(normalized)) {
    return 'FAILED';
  }
  return 'RUNNING';
}

function getPollIntervalMs(): number {
  const parsed = Number.parseInt(process.env.OPENTUNE_POLL_INTERVAL_MS || '', 10);
  return Number.isFinite(parsed) ? parsed : DEFAULT_POLL_INTERVAL_MS;
}

function getPollMaxAttempts(): number {
  const parsed = Number.parseInt(process.env.OPENTUNE_POLL_MAX_ATTEMPTS || '', 10);
  return Number.isFinite(parsed) ? parsed : DEFAULT_POLL_MAX_ATTEMPTS;
}

async function pollForCompletion(taskId: string): Promise<OpenTuneTaskStatus> {
  const maxAttempts = getPollMaxAttempts();
  const intervalMs = getPollIntervalMs();
  let attempts = 0;

  while (attempts < maxAttempts) {
    const status = await pollOpenTuneTask(taskId);
    if (status.status === 'SUCCEEDED' || status.status === 'FAILED') {
      return status;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    attempts += 1;
  }

  return {
    status: 'FAILED',
    error: 'OpenTune video generation timed out',
  };
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

    // Download video from OpenTune
    const videoResponse = await fetch(videoUrl);
    if (!videoResponse.ok) {
      throw new Error('Failed to download video from OpenTune');
    }

    const videoBuffer = await videoResponse.arrayBuffer();
    const fileName = `${projectId || 'video'}/${Date.now()}-${model || 'opentune'}.mp4`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-uploads')
      .upload(fileName, videoBuffer, {
        contentType: 'video/mp4',
        upsert: false,
      });

    if (uploadError) {
      console.error('[OpenTuneAdapter] Supabase upload error:', uploadError);
      return videoUrl; // Return original URL if upload fails
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(uploadData.path);

    console.log('[OpenTuneAdapter] Video stored in Supabase:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('[OpenTuneAdapter] Failed to store in Supabase:', error);
    return videoUrl; // Return original URL if storage fails
  }
}

/**
 * Check if OpenTune is configured
 */
export function isConfigured(): boolean {
  return !!OPENTUNE_API_KEY;
}

/**
 * Poll OpenTune task status
 * This is called from the GET /api/video/jobs/:id endpoint
 */
export async function pollOpenTuneTask(taskId: string): Promise<OpenTuneTaskStatus> {
  if (!isConfigured()) {
    return { status: 'FAILED', error: 'OpenTune API key not configured' };
  }

  const response = await fetch(resolveStatusUrl(taskId), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenTune API error: ${response.status} - ${errorText}`);
  }

  const data = (await response.json()) as OpenTuneResponse;
  const videoUrl = extractVideoUrl(data);
  const rawStatus = typeof data.status === 'string' ? data.status : undefined;
  const status = normalizeStatus(rawStatus, videoUrl);

  return {
    status,
    videoUrl,
    error: typeof data.error === 'string' ? data.error : undefined,
    rawStatus,
  };
}

export const openTuneAdapter: VideoProvider = {
  isConfigured(): boolean {
    return isConfigured();
  },

  async executeCreate(args: VideoGenerationArgs): Promise<VideoProviderResult> {
    if (!this.isConfigured()) {
      throw new Error('OpenTune API key not configured');
    }

    const {
      prompt,
      imageUrl,
      duration = parseInt(process.env.VIDEO_DEFAULT_DURATION || '4', 10),
      aspectRatio = '16:9',
      model,
      waitForCompletion = true,
    } = args;

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    if (!imageUrl) {
      throw new Error('OpenTune requires an imageUrl for image-to-video generation');
    }

    const clampedDuration = Math.min(Math.max(duration, 1), 10);
    const modelName = model || OPENTUNE_DEFAULT_MODEL;

    const requestBody: Record<string, unknown> = {
      image_url: imageUrl,
      prompt,
      duration: clampedDuration,
      aspect_ratio: aspectRatio,
    };

    if (model) {
      requestBody.model = model;
    }

    const motionStrength = (args as { motionStrength?: string | number }).motionStrength;
    if (motionStrength !== undefined) {
      const motionValue =
        typeof motionStrength === 'number'
          ? motionStrength
          : motionStrength === 'high'
            ? 3
            : motionStrength === 'medium'
              ? 2
              : motionStrength === 'low'
                ? 1
                : motionStrength;
      requestBody.motion_strength = motionValue;
    }

    console.log('[OpenTuneAdapter] Starting image-to-video:', {
      imageUrl: imageUrl.substring(0, 100),
      duration: clampedDuration,
      aspectRatio,
      model: modelName,
      waitForCompletion,
    });

    const response = await fetch(buildUrl(OPENTUNE_IMAGE_TO_VIDEO_ENDPOINT), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[OpenTuneAdapter] OpenTune API error:', errorText);
      throw new Error(`OpenTune API error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as OpenTuneResponse;
    const directVideoUrl = extractVideoUrl(data);
    const taskId = extractTaskId(data);

    if (directVideoUrl) {
      const storedVideoUrl = await storeVideoInSupabase(directVideoUrl, args.projectId, modelName);
      return {
        videoUrl: storedVideoUrl,
        thumbnailUrl: '',
        taskId: taskId,
        modelName,
        providerName: 'opentune',
        duration: clampedDuration,
        prompt,
      };
    }

    if (!taskId) {
      throw new Error('OpenTune response missing task id');
    }

    if (!waitForCompletion) {
      return {
        videoUrl: '',
        thumbnailUrl: '',
        taskId,
        modelName,
        providerName: 'opentune',
        duration: clampedDuration,
        prompt,
      };
    }

    const status = await pollForCompletion(taskId);
    if (status.status !== 'SUCCEEDED' || !status.videoUrl) {
      throw new Error(status.error || 'OpenTune video generation failed');
    }

    const storedVideoUrl = await storeVideoInSupabase(status.videoUrl, args.projectId, modelName);

    return {
      videoUrl: storedVideoUrl,
      thumbnailUrl: '',
      taskId,
      modelName,
      providerName: 'opentune',
      duration: clampedDuration,
      prompt,
    };
  },
};
