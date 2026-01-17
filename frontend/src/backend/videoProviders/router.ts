// Video generation provider router
// Tries providers in order: OpenTune -> Fal.ai Pika -> Kling -> Runway (fallback)

import type { VideoGenerationArgs, VideoProviderResult } from './types';
import { falPikaAdapter } from './falPikaAdapter';
import { klingAdapter } from './klingAdapter';
import { openTuneAdapter } from './openTuneAdapter';
import { runwayAdapter } from './runwayAdapter';

const PROVIDER_PRIORITY = process.env.VIDEO_PROVIDER_PRIORITY || 'opentune,fal-pika,kling,runway';
const providers = PROVIDER_PRIORITY.split(',').map((p) => p.trim()).filter(Boolean);

/**
 * Try to generate a video using the configured providers in priority order
 */
export async function executeCreate(args: VideoGenerationArgs): Promise<VideoProviderResult> {
  const errors: Error[] = [];
  const providerPreference = args.provider?.toLowerCase();
  const providerQueue = providerPreference ? [providerPreference] : providers;

  for (const provider of providerQueue) {
    try {
      const isPreferred = Boolean(providerPreference);

      if (provider === 'opentune') {
        if (!openTuneAdapter.isConfigured()) {
          if (isPreferred) {
            errors.push(new Error('OpenTune API key not configured'));
          }
          continue;
        }
        // OpenTune requires imageUrl for image-to-video
        if (!args.imageUrl) {
          console.warn('[VideoRouter] OpenTune requires imageUrl, skipping');
          errors.push(new Error('OpenTune requires imageUrl for image-to-video generation'));
          continue;
        }
        return await openTuneAdapter.executeCreate(args);
      }

      // Fal.ai Pika (image-to-video only)
      if (provider === 'fal-pika' && falPikaAdapter.isConfigured()) {
        try {
          // Fal.ai requires imageUrl for image-to-video
          if (!args.imageUrl) {
            console.warn('[VideoRouter] Fal.ai Pika requires imageUrl, skipping');
            errors.push(new Error('Fal.ai Pika requires imageUrl for image-to-video generation'));
            continue;
          }
          return await falPikaAdapter.executeCreate(args);
        } catch (error) {
          console.warn(`[VideoRouter] Fal.ai Pika video generation failed: ${error instanceof Error ? error.message : String(error)}`);
          errors.push(error instanceof Error ? error : new Error(String(error)));
          continue;
        }
      }
      if (provider === 'fal-pika' && !falPikaAdapter.isConfigured() && isPreferred) {
        errors.push(new Error('Fal.ai API key not configured'));
        continue;
      }

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
          if (args.imageUrl || !providerPreference) {
            return await klingAdapter.executeCreate(args);
          }
        } catch (error) {
          console.warn(`[VideoRouter] Kling video generation failed: ${error instanceof Error ? error.message : String(error)}`);
          errors.push(error instanceof Error ? error : new Error(String(error)));
          continue;
        }
      }
      if (provider === 'kling' && !klingAdapter.isConfigured() && isPreferred) {
        errors.push(new Error('Kling API key not configured'));
        continue;
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
      if (provider === 'runway' && !runwayAdapter.isConfigured() && isPreferred) {
        errors.push(new Error('Runway API key not configured'));
        continue;
      }

      if (!['opentune', 'fal-pika', 'kling', 'runway'].includes(provider)) {
        errors.push(new Error(`Unknown video provider: ${provider}`));
      }
    } catch (error) {
      errors.push(error instanceof Error ? error : new Error(String(error)));
      // Continue to next provider
      continue;
    }
  }

  // If we get here, all providers failed
  const errorMessages = errors.map((e) => e.message).join('; ');
  const triedProviders = providerPreference ? providerPreference : providers.join(', ');
  throw new Error(
    `All video generation providers failed. Tried: ${triedProviders}. Errors: ${errorMessages}`
  );
}
