/**
 * Clip Generator
 * Generates video clips from shot list items
 */

import { videoClipsDb, shotListsDb } from '@/lib/database';
import type { VideoClipInsert, ShotList } from '@/types/database';

interface ClipGenerationOptions {
  provider?: 'kling' | 'runway';
  klingModel?: '2.5-turbo' | '1.0' | '2.6';
  aspectRatio?: string;
  duration?: number;
  waitForCompletion?: boolean;
}

interface ClipGenerationResult {
  success: boolean;
  clips: Array<{
    id: string;
    shot_list_id: string;
    clip_number: number;
    status: string;
    video_url?: string;
    error_message?: string;
  }>;
  errors?: Array<{
    shot_list_id: string;
    error: string;
  }>;
}

/**
 * Generate video clips from shot list items
 * Creates clips in parallel (up to 5 concurrent generations)
 */
export async function generateClipsFromShotList(
  shotListId: string,
  projectId: string,
  userId: string,
  options: ClipGenerationOptions = {}
): Promise<ClipGenerationResult> {
  const {
    provider = 'kling',
    klingModel = '2.5-turbo',
    aspectRatio = '16:9',
    duration = 5,
    waitForCompletion = true,
  } = options;

  try {
    // Get shot list items
    const shotList = await shotListsDb.getByProjectId(projectId);
    const shotListItems = shotList.filter(s => s.id === shotListId);
    
    if (shotListItems.length === 0) {
      throw new Error(`Shot list ${shotListId} not found`);
    }

    const shotItems = shotListItems[0];
    
    // Get all shot list items for this project (sorted by shot_number)
    const allShotLists = await shotListsDb.getByProjectId(projectId);
    const relevantShots = allShotLists.filter(s => s.shot_number >= shotItems.shot_number);
    
    if (relevantShots.length === 0) {
      throw new Error('No shot list items found for generation');
    }

    // Create video clip records first (with pending status)
    const clipInserts: VideoClipInsert[] = relevantShots.map((shot, index) => ({
      project_id: projectId,
      shot_list_id: shot.id,
      clip_number: shot.shot_number,
      status: 'pending',
      provider,
      metadata: {
        generatedAt: new Date().toISOString(),
        shotNumber: shot.shot_number,
      },
    }));

    const createdClips = await videoClipsDb.createMany(clipInserts);

    // Generate videos for each clip (in batches to avoid rate limits)
    const batchSize = 3; // Generate 3 clips at a time
    const results: Array<{ id: string; success: boolean; videoUrl?: string; error?: string }> = [];

    for (let i = 0; i < createdClips.length; i += batchSize) {
      const batch = createdClips.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (clip) => {
        const shot = relevantShots.find(s => s.shot_number === clip.clip_number);
        if (!shot) {
          await videoClipsDb.update(clip.id, {
            status: 'failed',
            error_message: 'Shot list item not found',
          });
          return { id: clip.id, success: false, error: 'Shot list item not found' };
        }

        try {
          // Update clip status to generating
          await videoClipsDb.update(clip.id, {
            status: 'generating',
          });

          // Call video generation API
          const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
          const videoUrl = apiBaseUrl 
            ? `${apiBaseUrl}/api/tools/generateVideo`
            : '/api/tools/generateVideo';

          const response = await fetch(videoUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: shot.prompt || shot.intent || `Shot ${shot.shot_number}`,
              imageUrl: shot.image_url,
              duration: shot.duration_seconds || duration,
              aspectRatio,
              provider,
              klingModel,
              projectId,
              agentName: 'giorgio',
              waitForCompletion,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            await videoClipsDb.update(clip.id, {
              status: 'failed',
              error_message: `Video generation failed: HTTP ${response.status} - ${errorText}`,
            });
            return { id: clip.id, success: false, error: errorText };
          }

          const result = await response.json();

          if (!result.success || !result.video?.videoUrl) {
            await videoClipsDb.update(clip.id, {
              status: 'failed',
              error_message: result.error || 'Video generation failed',
            });
            return { id: clip.id, success: false, error: result.error || 'Video generation failed' };
          }

          // Update clip with video URL
          await videoClipsDb.update(clip.id, {
            status: 'completed',
            video_url: result.video.videoUrl,
            duration_seconds: result.video.duration || shot.duration_seconds || duration,
          });

          return { id: clip.id, success: true, videoUrl: result.video.videoUrl };
        } catch (error) {
          await videoClipsDb.update(clip.id, {
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
          });
          return { 
            id: clip.id, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay between batches to avoid rate limits
      if (i + batchSize < createdClips.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const successfulClips = results.filter(r => r.success);
    const failedClips = results.filter(r => !r.success);

    return {
      success: failedClips.length === 0,
      clips: createdClips.map(clip => {
        const result = results.find(r => r.id === clip.id);
        return {
          id: clip.id,
          shot_list_id: clip.shot_list_id,
          clip_number: clip.clip_number,
          status: result?.success ? 'completed' : (result ? 'failed' : 'pending'),
          video_url: result?.videoUrl,
          error_message: result?.error,
        };
      }),
      errors: failedClips.length > 0 ? failedClips.map(r => ({
        shot_list_id: createdClips.find(c => c.id === r.id)?.shot_list_id || '',
        error: r.error || 'Unknown error',
      })) : undefined,
    };
  } catch (error) {
    return {
      success: false,
      clips: [],
      errors: [{
        shot_list_id: shotListId,
        error: error instanceof Error ? error.message : 'Unknown error',
      }],
    };
  }
}

/**
 * Track clip generation status
 */
export async function trackClipGenerationStatus(clipId: string): Promise<{
  status: string;
  video_url?: string;
  error_message?: string;
}> {
  const clip = await videoClipsDb.getById(clipId);
  if (!clip) {
    throw new Error(`Clip ${clipId} not found`);
  }

  return {
    status: clip.status,
    video_url: clip.video_url,
    error_message: clip.error_message,
  };
}

/**
 * Retry failed clips
 */
export async function retryFailedClips(shotListId: string, projectId: string, userId: string, options: ClipGenerationOptions = {}): Promise<ClipGenerationResult> {
  const clips = await videoClipsDb.getByShotListId(shotListId);
  const failedClips = clips.filter(c => c.status === 'failed');

  if (failedClips.length === 0) {
    return {
      success: true,
      clips: [],
    };
  }

  // Delete failed clips and regenerate
  // Note: We can't delete via the wrapper, so we'll just update them
  // and regenerate by calling generateClipsFromShotList again
  
  return generateClipsFromShotList(shotListId, projectId, userId, options);
}
