/**
 * NanoBanana Pro API Route
 *
 * Handles character sheet generation, storyboard creation, upscaling, and drift fixing
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateCharacterSheet,
  generateStoryboard,
  upscaleFrame,
  fixDrift,
  type CharacterSheetRequest,
  type StoryboardRequest,
  type UpscaleRequest,
  type FixDriftRequest,
} from '@/backend/nanobanana/nanobananaClient';
import {
  saveAssetFromUrl,
  updateManifestWithAsset,
  isQnapAvailable,
} from '@/backend/storage/qnapStorage';
import { getAuthenticatedUserId } from '@/lib/auth';
import { storyboardFramesDb } from '@/lib/database';
import type { StoryboardFrameInsert } from '@/types/database';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for generation

interface NanoBananaRequest {
  action?: 'characterSheet' | 'storyboard' | 'upscale' | 'fixDrift';
  operation?: 'character_sheet' | 'characterSheet' | 'storyboard' | 'upscale' | 'fix_drift' | 'fixDrift';
  // Character sheet params
  prompt?: string;
  characterDescription?: string;
  referenceImages?: string[];
  style?: string;
  // Storyboard params
  characterSheetUrl?: string;
  frameCount?: number;
  resolution?: '4k' | '2k' | '1080p';
  // Upscale params
  imageUrl?: string;
  frameIndex?: number;
  targetResolution?: '4k' | '8k';
  // Fix drift params
  issue?: 'face' | 'props' | 'style';
  description?: string;
  // Common
  projectId?: string;
  workflowId?: string;
  agentName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: NanoBananaRequest = await request.json();
    // Support both 'action' and 'operation' for compatibility
    const action = body.action || (body.operation === 'character_sheet' ? 'characterSheet' : 
                                   body.operation === 'fix_drift' ? 'fixDrift' : 
                                   body.operation);
    const { projectId, workflowId, agentName } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action/operation is required (characterSheet, storyboard, upscale, fixDrift)' },
        { status: 400 }
      );
    }

    console.log('[NanoBanana] Processing action:', action);

    switch (action) {
      case 'characterSheet': {
        if (!body.prompt) {
          return NextResponse.json(
            { success: false, error: 'Prompt is required for character sheet generation' },
            { status: 400 }
          );
        }

        const charRequest: CharacterSheetRequest = {
          prompt: body.prompt,
          characterDescription: body.characterDescription,
          referenceImages: body.referenceImages,
          style: body.style,
        };

        const result = await generateCharacterSheet(charRequest);
        
        // Save to QNAP if configured and workflowId provided
        if (result.success && result.characterSheetUrl && projectId && workflowId) {
          try {
            const qnapAvailable = await isQnapAvailable();
            if (qnapAvailable) {
              const savedAsset = await saveAssetFromUrl(result.characterSheetUrl, {
                project: projectId,
                workflowId,
                assetType: 'character_sheet',
                filename: `character_sheet_${Date.now()}.png`,
                metadata: {
                  action: 'characterSheet',
                  prompt: body.prompt,
                  characterDescription: body.characterDescription,
                  style: body.style,
                },
              });
              await updateManifestWithAsset(projectId, workflowId, savedAsset);
              result.qnapPath = savedAsset.relativePath;
            }
          } catch (error) {
            console.error('[NanoBanana] Failed to save to QNAP:', error);
            // Don't fail the request if QNAP save fails
          }
        }
        
        return NextResponse.json(result);
      }

      case 'storyboard': {
        if (!body.prompt) {
          return NextResponse.json(
            { success: false, error: 'Prompt is required for storyboard generation' },
            { status: 400 }
          );
        }

        const storyboardRequest: StoryboardRequest = {
          prompt: body.prompt,
          characterSheetUrl: body.characterSheetUrl,
          referenceImages: body.referenceImages,
          frameCount: body.frameCount || 9,
          resolution: body.resolution || '4k',
          style: body.style,
        };

        const result = await generateStoryboard(storyboardRequest);
        
        // Save storyboard frames to database if projectId is provided
        if (result.success && result.frames && Array.isArray(result.frames) && projectId) {
          try {
            const userId = await getAuthenticatedUserId(request);
            if (!userId) {
              console.warn('[NanoBanana] No userId found, skipping database save for frames');
            } else {
              console.log(`[NanoBanana] Saving ${result.frames.length} frames to database for project ${projectId}, user ${userId}`);
              
              const framesToInsert: StoryboardFrameInsert[] = result.frames.map((frame: any, index: number) => {
                const frameNumber = frame.index !== undefined ? frame.index + 1 : index + 1;
                const imageUrl = frame.imageUrl || frame.image_url;
                
                console.log(`[NanoBanana] Frame ${frameNumber}: imageUrl=${imageUrl}, description=${frame.description || 'none'}`);
                
                return {
                  project_id: projectId,
                  user_id: userId,
                  frame_number: frameNumber,
                  prompt: body.prompt || '',
                  image_url: imageUrl || undefined,
                  thumbnail_url: frame.thumbnailUrl || frame.thumbnail_url || undefined,
                  description: frame.description || undefined,
                  approval_status: 'pending',
                  reference_ids: [],
                  metadata: {
                    resolution: body.resolution || '4k',
                    frameCount: body.frameCount || 9,
                    characterSheetUrl: body.characterSheetUrl || undefined,
                  },
                };
              });
              
              const savedFrames = await storyboardFramesDb.createMany(framesToInsert);
              console.log(`[NanoBanana] Successfully saved ${savedFrames.length} storyboard frames to database for project ${projectId}`);
            }
          } catch (error) {
            console.error('[NanoBanana] Failed to save storyboard frames to database:', error);
            console.error('[NanoBanana] Error details:', error instanceof Error ? error.stack : error);
            // Don't fail the request if database save fails, but log the error
          }
        } else {
          console.log('[NanoBanana] Skipping database save:', {
            success: result.success,
            hasFrames: !!result.frames,
            isArray: Array.isArray(result.frames),
            frameCount: result.frames?.length,
            hasProjectId: !!projectId,
          });
        }
        
        // Save to QNAP if configured and workflowId provided
        if (result.success && result.storyboardUrl && projectId && workflowId) {
          try {
            const qnapAvailable = await isQnapAvailable();
            if (qnapAvailable) {
              const savedAsset = await saveAssetFromUrl(result.storyboardUrl, {
                project: projectId,
                workflowId,
                assetType: 'storyboard',
                filename: `storyboard_${body.frameCount || 9}frames_${Date.now()}.png`,
                metadata: {
                  action: 'storyboard',
                  prompt: body.prompt,
                  frameCount: body.frameCount || 9,
                  resolution: body.resolution || '4k',
                  style: body.style,
                },
              });
              await updateManifestWithAsset(projectId, workflowId, savedAsset);
              result.qnapPath = savedAsset.relativePath;
              
              // Also save individual frames if available
              if (result.frames && Array.isArray(result.frames)) {
                for (const frame of result.frames) {
                  if (frame.imageUrl) {
                    try {
                      const frameAsset = await saveAssetFromUrl(frame.imageUrl, {
                        project: projectId,
                        workflowId,
                        assetType: 'storyboard',
                        filename: `frame_${frame.index}_${Date.now()}.png`,
                        metadata: {
                          action: 'storyboard',
                          frameIndex: frame.index,
                          description: frame.description,
                        },
                      });
                      await updateManifestWithAsset(projectId, workflowId, frameAsset);
                    } catch (error) {
                      console.error(`[NanoBanana] Failed to save frame ${frame.index} to QNAP:`, error);
                    }
                  }
                }
              }
            }
          } catch (error) {
            console.error('[NanoBanana] Failed to save to QNAP:', error);
            // Don't fail the request if QNAP save fails
          }
        }
        
        return NextResponse.json(result);
      }

      case 'upscale': {
        if (!body.imageUrl) {
          return NextResponse.json(
            { success: false, error: 'imageUrl is required for upscaling' },
            { status: 400 }
          );
        }

        const upscaleRequest: UpscaleRequest = {
          imageUrl: body.imageUrl,
          frameIndex: body.frameIndex,
          targetResolution: body.targetResolution || '4k',
        };

        const result = await upscaleFrame(upscaleRequest);
        
        // Save to QNAP if configured and workflowId provided
        if (result.success && result.upscaledUrl && projectId && workflowId) {
          try {
            const qnapAvailable = await isQnapAvailable();
            if (qnapAvailable) {
              const savedAsset = await saveAssetFromUrl(result.upscaledUrl, {
                project: projectId,
                workflowId,
                assetType: 'upscaled_frame',
                filename: `upscaled_frame_${body.frameIndex || 'unknown'}_${body.targetResolution || '4k'}_${Date.now()}.png`,
                metadata: {
                  action: 'upscale',
                  originalUrl: body.imageUrl,
                  frameIndex: body.frameIndex,
                  targetResolution: body.targetResolution || '4k',
                },
              });
              await updateManifestWithAsset(projectId, workflowId, savedAsset);
              result.qnapPath = savedAsset.relativePath;
            }
          } catch (error) {
            console.error('[NanoBanana] Failed to save to QNAP:', error);
            // Don't fail the request if QNAP save fails
          }
        }
        
        return NextResponse.json(result);
      }

      case 'fixDrift': {
        if (!body.imageUrl || !body.characterSheetUrl) {
          return NextResponse.json(
            { success: false, error: 'imageUrl and characterSheetUrl are required for drift fixing' },
            { status: 400 }
          );
        }

        const fixRequest: FixDriftRequest = {
          imageUrl: body.imageUrl,
          characterSheetUrl: body.characterSheetUrl,
          issue: body.issue,
          description: body.description,
        };

        const result = await fixDrift(fixRequest);
        
        // Save to QNAP if configured and workflowId provided
        if (result.success && result.fixedUrl && projectId && workflowId) {
          try {
            const qnapAvailable = await isQnapAvailable();
            if (qnapAvailable) {
              const savedAsset = await saveAssetFromUrl(result.fixedUrl, {
                project: projectId,
                workflowId,
                assetType: 'image',
                filename: `fixed_drift_${body.issue || 'unknown'}_${Date.now()}.png`,
                metadata: {
                  action: 'fixDrift',
                  originalUrl: body.imageUrl,
                  characterSheetUrl: body.characterSheetUrl,
                  issue: body.issue,
                  description: body.description,
                },
              });
              await updateManifestWithAsset(projectId, workflowId, savedAsset);
              result.qnapPath = savedAsset.relativePath;
            }
          } catch (error) {
            console.error('[NanoBanana] Failed to save to QNAP:', error);
            // Don't fail the request if QNAP save fails
          }
        }
        
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[NanoBanana] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process NanoBanana request',
      },
      { status: 500 }
    );
  }
}
