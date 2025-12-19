/**
 * Runway API Integration
 * 
 * Handles video generation using RunwayML's Gen-3 and Gen-4 models
 * 
 * Official API Documentation: https://docs.dev.runwayml.com/
 * 
 * NOTE: This implementation is based on common API patterns.
 * You may need to adjust endpoints/request format based on actual Runway API docs.
 * Check: https://docs.dev.runwayml.com/ for the latest API structure.
 */

export interface RunwayVideoRequest {
  prompt: string;
  imageUrl?: string; // Reference image for image-to-video (not used in text_to_video, use image_to_video endpoint)
  duration?: number; // Duration in seconds: 4, 6, or 8 (for veo3.1 models)
  aspectRatio?: '1280:720' | '720:1280' | '1080:1920' | '1920:1080';
  model?: 'veo3' | 'veo3.1' | 'veo3.1_fast';
  seed?: number;
  audio?: boolean; // Whether to generate audio (default: true)
}

export interface RunwayVideoResponse {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  error?: string;
}

export interface RunwayVideoStatus {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  progress?: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  error?: string;
}

/**
 * Generate a video using Runway API
 */
export async function generateRunwayVideo(
  request: RunwayVideoRequest
): Promise<RunwayVideoResponse> {
  const apiKey = process.env.RUNWAY_API_KEY;
  if (!apiKey) {
    throw new Error('RUNWAY_API_KEY environment variable is not set');
  }

  const baseUrl = process.env.RUNWAY_API_BASE_URL || 'https://api.dev.runwayml.com';
  
  // Determine model (veo3.1 is the latest, veo3.1_fast is faster)
  const model = request.model || 'veo3.1';
  const duration = request.duration || 8; // Default to 8 seconds (valid: 4, 6, 8)
  const aspectRatio = request.aspectRatio || '1280:720';

  // Build request body - Runway API uses promptText (not prompt)
  const requestBody: any = {
    promptText: request.prompt,
    ratio: aspectRatio, // Runway uses 'ratio' not 'aspect_ratio'
    model,
  };

  // Duration is required for veo3.1 models
  if (model === 'veo3.1' || model === 'veo3.1_fast') {
    requestBody.duration = duration;
  } else if (model === 'veo3') {
    // veo3 has fixed 8 second duration
    requestBody.duration = 8;
  }

  // Audio generation (default: true)
  if (request.audio !== undefined) {
    requestBody.audio = request.audio;
  }

  if (request.seed) {
    requestBody.seed = request.seed;
  }

  try {
    // Runway API endpoint: /v1/text_to_video (not /v1/video/generations)
    const endpoint = process.env.RUNWAY_API_ENDPOINT || `${baseUrl}/v1/text_to_video`;
    
    // Runway requires X-Runway-Version header - format is YYYY-MM-DD
    // Check https://docs.dev.runwayml.com/api-details/versioning for current version
    const apiVersion = process.env.RUNWAY_API_VERSION || '2024-11-06';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': apiVersion, // Required by Runway API
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Runway API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Runway returns a task object with an id field
    // The task needs to be polled using /v1/tasks/{id} to get the actual video
    return {
      id: data.id, // Task ID (UUID format)
      status: 'PENDING', // Initial status (Runway uses uppercase: PENDING, RUNNING, COMPLETED, FAILED)
      videoUrl: undefined, // Will be available after polling when status is COMPLETED
      thumbnailUrl: undefined,
      duration: duration,
    };
  } catch (error) {
    throw new Error(`Failed to generate Runway video: ${(error as Error).message}`);
  }
}

/**
 * Check the status of a video generation
 */
export async function getRunwayVideoStatus(
  videoId: string
): Promise<RunwayVideoStatus> {
  const apiKey = process.env.RUNWAY_API_KEY;
  if (!apiKey) {
    throw new Error('RUNWAY_API_KEY environment variable is not set');
  }

  // Runway API base URL - CORRECTED: Use api.dev.runwayml.com (not api.runwayml.com)
  const baseUrl = process.env.RUNWAY_API_BASE_URL || 'https://api.dev.runwayml.com';

  try {
    // Status endpoint: /v1/tasks/{id} (not /v1/video/generations/{id})
    const statusEndpoint = process.env.RUNWAY_STATUS_ENDPOINT 
      ? process.env.RUNWAY_STATUS_ENDPOINT.replace('{id}', videoId)
      : `${baseUrl}/v1/tasks/${videoId}`;
    
    // Runway requires X-Runway-Version header - format is YYYY-MM-DD
    const apiVersion = process.env.RUNWAY_API_VERSION || '2024-11-06';
    
    const response = await fetch(statusEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': apiVersion, // Required by Runway API
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Runway API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Runway task response structure
    // Status values: PENDING, RUNNING, COMPLETED, FAILED (uppercase)
    // When completed, the output contains the video URL
    const output = data.output || {};
    const videoUrl = output.videoUrl || output.video_url || output.uri || output.video?.uri;
    
    return {
      id: videoId,
      status: (data.status || 'PENDING') as 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED',
      progress: data.progress,
      videoUrl: videoUrl,
      thumbnailUrl: output.thumbnailUrl || output.thumbnail_url || output.thumbnail?.uri,
      duration: output.duration,
      error: data.error?.message || data.error,
    };
  } catch (error) {
    throw new Error(`Failed to get Runway video status: ${(error as Error).message}`);
  }
}

/**
 * Poll for video completion (with timeout)
 */
export async function pollRunwayVideo(
  videoId: string,
  maxAttempts = 60,
  intervalMs = 2000
): Promise<RunwayVideoStatus> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await getRunwayVideoStatus(videoId);
    
    if (status.status === 'COMPLETED') {
      return status;
    }
    
    if (status.status === 'FAILED') {
      throw new Error(`Video generation failed: ${status.error || 'Unknown error'}`);
    }
    
    // Wait before next poll (status is PENDING or RUNNING)
    if (attempt < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }
  
  throw new Error(`Video generation timed out after ${maxAttempts} attempts`);
}

