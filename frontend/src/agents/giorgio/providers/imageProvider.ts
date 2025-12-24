/**
 * Giorgio Image Provider
 * Simplified provider adapter for Giorgio's image generation
 * Uses Replicate (Stable Diffusion) as the primary provider
 */

import { executeCreate } from '@/backend/imageProviders/stableDiffusionAdapter';
import type { CreateImageArgs } from '@/backend/imageProviders/types';

export interface ImageGenerationParams {
  prompt: string;
  aspectRatio?: 'square' | 'landscape' | 'portrait';
  stylePreset?: string;
  seed?: number;
}

export interface ImageGenerationResult {
  imageUrl?: string;
  imageBase64?: string;
  provider: string;
  model: string;
  prompt: string;
  params: ImageGenerationParams;
  error?: string;
}

/**
 * Generate an image using the configured provider
 * Returns a result with imageUrl if successful, or error message if failed
 */
export async function generateImage(
  params: ImageGenerationParams
): Promise<ImageGenerationResult> {
  try {
    // Convert aspectRatio to size
    const size = getSizeFromAspectRatio(params.aspectRatio);
    
    // Build provider args
    const providerArgs: CreateImageArgs = {
      prompt: params.prompt,
      style: params.stylePreset,
      size,
    };

    // Call the provider adapter
    const result = await executeCreate(providerArgs);

    // Convert base64 to data URL for display
    const imageUrl = result.imageBase64
      ? `data:image/png;base64,${result.imageBase64}`
      : undefined;

    return {
      imageUrl,
      imageBase64: result.imageBase64,
      provider: result.providerName || 'replicate',
      model: result.modelName,
      prompt: params.prompt,
      params,
    };
  } catch (error) {
    return {
      provider: 'replicate',
      model: 'unknown',
      prompt: params.prompt,
      params,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Convert aspect ratio to size string
 */
function getSizeFromAspectRatio(aspectRatio?: 'square' | 'landscape' | 'portrait'): '512x512' | '1024x1024' | '1536x1536' {
  switch (aspectRatio) {
    case 'landscape':
      return '1536x1536'; // Use square for now, can be extended
    case 'portrait':
      return '1024x1024'; // Use square for now, can be extended
    case 'square':
    default:
      return '1024x1024';
  }
}

/**
 * Check if image generation is configured
 */
export function isImageProviderConfigured(): boolean {
  return Boolean(process.env.REPLICATE_API_TOKEN);
}

