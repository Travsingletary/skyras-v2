/**
 * Timeline Sequencer
 * Automatically sequences video clips on timeline based on shot list order
 */

import { timelineSequencesDb, videoClipsDb, shotListsDb } from '@/lib/database';
import type { TimelineSequenceInsert, VideoClip, ShotList } from '@/types/database';

interface TimelineSequencingOptions {
  timelineName?: string;
}

interface TimelineSequencingResult {
  success: boolean;
  sequenceId: string;
  clipCount: number;
  totalDuration?: number;
  sequenceOrder: string[];
  error?: string;
}

/**
 * Automatically sequence clips on timeline based on shot list order
 */
export async function sequenceClipsOnTimeline(
  projectId: string,
  userId: string,
  shotListId?: string,
  options: TimelineSequencingOptions = {}
): Promise<TimelineSequencingResult> {
  try {
    // Get shot list items
    let shotListItems: ShotList[];
    
    if (shotListId) {
      // Get specific shot list
      const allShots = await shotListsDb.getByProjectId(projectId);
      const shotList = allShots.find(s => s.id === shotListId);
      if (!shotList) {
        throw new Error(`Shot list ${shotListId} not found`);
      }
      shotListItems = allShots.filter(s => s.shot_number >= shotList.shot_number);
    } else {
      // Get all shot list items for the project
      shotListItems = await shotListsDb.getByProjectId(projectId);
    }

    if (shotListItems.length === 0) {
      throw new Error('No shot list items found');
    }

    // Get all video clips for the project (or shot list)
    const allClips = await videoClipsDb.getByProjectId(projectId);
    
    // Filter clips by shot list if specified
    const relevantClips = shotListId
      ? allClips.filter(c => shotListItems.some(s => s.id === c.shot_list_id))
      : allClips;

    // Filter to only completed clips
    const completedClips = relevantClips.filter(c => c.status === 'completed');

    if (completedClips.length === 0) {
      throw new Error('No completed video clips found. Please generate clips first.');
    }

    // Sort clips by shot number (which corresponds to the order in shot list)
    const sortedClips = completedClips.sort((a, b) => a.clip_number - b.clip_number);

    // Create sequence order array (clip IDs in order)
    const sequenceOrder = sortedClips.map(c => c.id);

    // Calculate total duration
    const totalDuration = sortedClips.reduce((sum, clip) => {
      return sum + (clip.duration_seconds || 0);
    }, 0);

    // Create timeline name if not provided
    const timelineName = options.timelineName || `Timeline_${projectId.slice(0, 8)}_${new Date().toISOString().split('T')[0]}`;

    // Create timeline sequence record
    const sequenceInsert: TimelineSequenceInsert = {
      project_id: projectId,
      user_id: userId,
      sequence_order: sequenceOrder,
      timeline_name: timelineName,
      duration_seconds: totalDuration,
      metadata: {
        shotListId: shotListId || null,
        clipCount: sortedClips.length,
        createdFrom: 'automatic_sequencing',
      },
    };

    const sequence = await timelineSequencesDb.create(sequenceInsert);

    return {
      success: true,
      sequenceId: sequence.id,
      clipCount: sortedClips.length,
      totalDuration,
      sequenceOrder,
    };
  } catch (error) {
    return {
      success: false,
      sequenceId: '',
      clipCount: 0,
      sequenceOrder: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create timeline from clips
 * Legacy function name for compatibility
 */
export async function createTimelineFromClips(
  projectId: string,
  userId: string,
  clipIds: string[],
  options: TimelineSequencingOptions = {}
): Promise<TimelineSequencingResult> {
  try {
    // Get clips in the specified order
    const clips: VideoClip[] = [];
    for (const clipId of clipIds) {
      const clip = await videoClipsDb.getById(clipId);
      if (clip) {
        clips.push(clip);
      }
    }

    if (clips.length === 0) {
      throw new Error('No valid clips found');
    }

    // Calculate total duration
    const totalDuration = clips.reduce((sum, clip) => {
      return sum + (clip.duration_seconds || 0);
    }, 0);

    // Create timeline name if not provided
    const timelineName = options.timelineName || `Timeline_${projectId.slice(0, 8)}_${new Date().toISOString().split('T')[0]}`;

    // Create timeline sequence record
    const sequenceInsert: TimelineSequenceInsert = {
      project_id: projectId,
      user_id: userId,
      sequence_order: clipIds,
      timeline_name: timelineName,
      duration_seconds: totalDuration,
      metadata: {
        clipCount: clips.length,
        createdFrom: 'manual_clip_selection',
      },
    };

    const sequence = await timelineSequencesDb.create(sequenceInsert);

    return {
      success: true,
      sequenceId: sequence.id,
      clipCount: clips.length,
      totalDuration,
      sequenceOrder: clipIds,
    };
  } catch (error) {
    return {
      success: false,
      sequenceId: '',
      clipCount: 0,
      sequenceOrder: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
