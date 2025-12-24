/**
 * Feature Flags for Agent MVP
 * Controls optional features that shouldn't break core functionality
 */

export const FEATURE_FLAGS = {
  JAMAL_PUBLISH_ENABLED: process.env.JAMAL_PUBLISH_ENABLED === 'true',
  GIORGIO_IMAGE_ENABLED: Boolean(
    process.env.RUNWAY_API_KEY || process.env.REPLICATE_API_TOKEN
  ),
} as const;

export function isFeatureEnabled(flag: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[flag];
}

