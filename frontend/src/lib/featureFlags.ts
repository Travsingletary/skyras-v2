/**
 * Feature Flags for Agent MVP
 * Controls optional features that shouldn't break core functionality
 */

export const FEATURE_FLAGS = {
  JAMAL_PUBLISH_ENABLED: process.env.JAMAL_PUBLISH_ENABLED === 'true',
  GIORGIO_IMAGE_ENABLED: process.env.GIORGIO_IMAGE_ENABLED === 'true',
} as const;

export const IMAGE_PROVIDER = (process.env.IMAGE_PROVIDER || 'replicate').toLowerCase();

export function isFeatureEnabled(flag: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[flag];
}

/**
 * Check if image generation is enabled and provider is configured
 */
export function isImageGenerationAvailable(): boolean {
  if (!FEATURE_FLAGS.GIORGIO_IMAGE_ENABLED) {
    return false;
  }
  
  if (IMAGE_PROVIDER === 'replicate') {
    return Boolean(process.env.REPLICATE_API_TOKEN);
  }
  
  if (IMAGE_PROVIDER === 'runway') {
    return Boolean(process.env.RUNWAY_API_KEY);
  }
  
  return false;
}

