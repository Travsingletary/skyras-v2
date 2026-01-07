/**
 * Suno Music Generation API Route
 *
 * Generates music from lyrics using Suno API
 * Saves audio files to QNAP storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { requestSunoTrack } from '@/agentkit/integrations/sunoClient';
import {
  saveAssetFromUrl,
  updateManifestWithAsset,
  isQnapAvailable,
} from '@/backend/storage/qnapStorage';
import { applyRateLimit, addRateLimitHeaders } from '@/lib/withRateLimit';
import { RATE_LIMITS } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for music generation

interface SunoRequest {
  prompt: string;
  lyrics?: string;
  style?: string;
  mood?: string;
  durationSeconds?: number;
  projectId?: string;
  workflowId?: string;
  agentName?: string;
}

export async function POST(request: NextRequest) {
  // Apply rate limiting: 10 requests per 5 minutes
  const rateLimitResult = applyRateLimit(request, RATE_LIMITS.AI_GENERATION);
  if (!rateLimitResult.success) {
    return rateLimitResult.response;
  }

  try {
    const body: SunoRequest = await request.json();
    const {
      prompt,
      lyrics,
      style = 'pop',
      mood,
      durationSeconds = 60,
      projectId,
      workflowId,
      agentName = 'giorgio',
    } = body;

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    console.log('[Suno] Starting music generation:', {
      prompt: prompt.substring(0, 100),
      hasLyrics: !!lyrics,
      style,
      mood,
      duration: durationSeconds,
    });

    // Generate music using Suno
    const result = await requestSunoTrack({
      prompt,
      lyrics,
      style,
      mood,
      durationSeconds,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Music generation failed' },
        { status: 500 }
      );
    }

    // Save to QNAP if configured and workflowId provided
    let qnapPath: string | undefined;
    if (projectId && workflowId && result.audioUrl) {
      try {
        const qnapAvailable = await isQnapAvailable();
        if (qnapAvailable) {
          const sanitizedPrompt = prompt.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
          const savedAsset = await saveAssetFromUrl(result.audioUrl, {
            project: projectId,
            workflowId,
            assetType: 'audio',
            filename: `music_${sanitizedPrompt}_${style}_${Date.now()}.mp3`,
            metadata: {
              prompt,
              lyrics,
              style,
              mood,
              duration: durationSeconds,
              hasLyrics: !!lyrics,
            },
          });
          await updateManifestWithAsset(projectId, workflowId, savedAsset);
          qnapPath = savedAsset.relativePath;
        }
      } catch (error) {
        console.error('[Suno] Failed to save to QNAP:', error);
        // Don't fail the request if QNAP save fails
      }
    }

    const response = NextResponse.json({
      success: true,
      music: {
        fileUrl: result.fileUrl || result.audioUrl,
        audioUrl: result.audioUrl,
        metadata: result.metadata,
        qnapPath,
      },
    });

    return addRateLimitHeaders(response, rateLimitResult.headers);
  } catch (error) {
    console.error('[Suno] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate music',
      },
      { status: 500 }
    );
  }
}
