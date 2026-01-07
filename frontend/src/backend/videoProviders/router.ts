// Video generation provider router
// Tries providers in order: Kling (if configured) -> Runway (fallback)

import type { VideoGenerationArgs, VideoProviderResult } from './types';
import { klingAdapter } from './klingAdapter';
import { runwayAdapter } from './runwayAdapter';

const PROVIDER_PRIORITY = process.env.VIDEO_PROVIDER_PRIORITY || 'kling,runway';
const providers = PROVIDER_PRIORITY.split(',').map((p) => p.trim());

/**
 * Try to generate a video using the configured providers in priority order
 */
export async function executeCreate(args: VideoGenerationArgs): Promise<VideoProviderResult> {
  const errors: Error[] = [];

  for (const provider of providers) {
    try {
      if (provider === 'kling' && klingAdapter.isConfigured()) {
        try {
          // Kling requires imageUrl, so check if we have one
          if (!args.imageUrl && args.klingModel) {
            // If Kling model is explicitly requested but no image, skip
            console.warn('[VideoRouter] Kling requires imageUrl, skipping');
            errors.push(new Error('Kling requires imageUrl for image-to-video generation'));
            continue;
          }
          // If we have imageUrl or no explicit provider preference, try Kling
          if (args.imageUrl || !(args as any).provider) {
            return await klingAdapter.executeCreate(args);
          }
        } catch (error) {
          console.warn(`[VideoRouter] Kling video generation failed: ${error instanceof Error ? error.message : String(error)}`);
          errors.push(error instanceof Error ? error : new Error(String(error)));
          continue;
        }
      }

      if (provider === 'runway' && runwayAdapter.isConfigured()) {
        try {
          return await runwayAdapter.executeCreate(args);
        } catch (error) {
          console.warn(`[VideoRouter] Runway video generation failed: ${error instanceof Error ? error.message : String(error)}`);
          errors.push(error instanceof Error ? error : new Error(String(error)));
          continue;
        }
      }
    } catch (error) {
      errors.push(error instanceof Error ? error : new Error(String(error)));
      // Continue to next provider
      continue;
    }
  }

  // If we get here, all providers failed
  const errorMessages = errors.map((e) => e.message).join('; ');
  throw new Error(
    `All video generation providers failed. Tried: ${providers.join(', ')}. Errors: ${errorMessages}`
  );
}
