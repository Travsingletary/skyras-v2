// Fal.ai Pika image-to-video adapter
// Uses Fal.ai developer API for image-to-video animation

import type { VideoGenerationArgs, VideoProviderResult, VideoProvider } from './types';

const FAL_KEY = process.env.FAL_KEY || '';
const FAL_API_BASE_URL = 'https://fal.run/fal-ai/pika/image-to-video';

interface FalRequestResponse {
  request_id: string;
  status?: string;
}

interface FalStatusResponse {
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  video?: {
    url: string;
  };
  error?: string;
}

/**
 * Check if Fal.ai is configured
 */
export function isConfigured(): boolean {
  return !!FAL_KEY;
}

/**
 * Poll Fal.ai request status
 * This is called from the GET /api/video/jobs/:id endpoint
 */
export async function pollFalRequest(requestId: string): Promise<FalStatusResponse> {
  const response = await fetch(`${FAL_API_BASE_URL}/${requestId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Key ${FAL_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fal.ai API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Fal.ai Pika adapter for image-to-video
 * 
 * Note: This adapter returns immediately with a request_id.
 * The actual video is fetched via polling in the GET /api/video/jobs/:id endpoint.
 */
export const falPikaAdapter: VideoProvider = {
  isConfigured(): boolean {
    return isConfigured();
  },

  async executeCreate(args: VideoGenerationArgs): Promise<VideoProviderResult> {
    if (!this.isConfigured()) {
      throw new Error('Fal.ai API key not configured');
    }

    // Fal.ai Pika requires an image URL for image-to-video
    if (!args.imageUrl) {
      throw new Error('imageUrl is required for Fal.ai Pika image-to-video');
    }

    const {
      imageUrl,
      duration = parseInt(process.env.VIDEO_DEFAULT_DURATION || '4', 10),
      aspectRatio = '16:9',
    } = args;

    // Convert motion strength (low/medium/high) to Fal.ai motion_bucket parameter
    // Default to low motion for cost savings
    const motionStrength = (args as any).motionStrength || process.env.VIDEO_DEFAULT_MOTION || 'low';
    const motionBucket = motionStrength === 'high' ? 3 : motionStrength === 'medium' ? 2 : 1;

    console.log('[FalPikaAdapter] Starting image-to-video:', {
      imageUrl: imageUrl.substring(0, 100),
      duration,
      aspectRatio,
      motionBucket,
    });

    // Call Fal.ai Pika API
    // TODO: Verify exact endpoint and payload format with Fal.ai documentation
    // Current implementation based on typical Fal.ai patterns
    const requestBody = {
      image_url: imageUrl,
      duration: Math.min(Math.max(duration, 1), 10), // Clamp between 1-10 seconds
      motion_bucket: motionBucket,
      aspect_ratio: aspectRatio,
    };

    const response = await fetch(FAL_API_BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[FalPikaAdapter] Fal.ai API error:', errorText);
      throw new Error(`Fal.ai API error: ${response.status} - ${errorText}`);
    }

    const data: FalRequestResponse = await response.json();
    const requestId = data.request_id;

    if (!requestId) {
      throw new Error('Fal.ai did not return a request_id');
    }

    console.log('[FalPikaAdapter] Request created:', requestId);

    // Return immediately with request_id
    // The actual video URL will be fetched via polling in GET /api/video/jobs/:id
    return {
      videoUrl: '', // Will be populated after polling
      thumbnailUrl: '',
      taskId: requestId, // Use request_id as taskId
      modelName: 'pika-image-to-video',
      providerName: 'fal-pika',
      duration,
      prompt: args.prompt || 'Image animation',
    };
  },
};
