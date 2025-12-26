// Image generation provider router
// Tries providers in order: Runway (if configured) -> Stable Diffusion (fallback)

import type { CreateImageArgs, EditImageArgs, ProviderResult } from "./types";
import * as runwayAdapter from "./runwayAdapter";
import * as stableDiffusionAdapter from "./stableDiffusionAdapter";

const PROVIDER_PRIORITY = process.env.IMAGE_PROVIDER_PRIORITY || "runway,stable-diffusion";
const providers = PROVIDER_PRIORITY.split(",").map((p) => p.trim());

/**
 * Try to generate an image using the configured providers in priority order
 */
export async function executeCreate(args: CreateImageArgs): Promise<ProviderResult> {
  const errors: Error[] = [];

  for (const provider of providers) {
    try {
      if (provider === "runway" && runwayAdapter.isConfigured()) {
        try {
          return await runwayAdapter.executeCreate(args);
        } catch (error) {
          // Runway doesn't support images yet, so this will fail gracefully
          // Log and continue to next provider
          console.warn(`Runway image generation not available: ${error instanceof Error ? error.message : String(error)}`);
          errors.push(error instanceof Error ? error : new Error(String(error)));
          continue;
        }
      }

      if (provider === "stable-diffusion" && stableDiffusionAdapter.isConfigured()) {
        return await stableDiffusionAdapter.executeCreate(args);
      }
    } catch (error) {
      errors.push(error instanceof Error ? error : new Error(String(error)));
      // Continue to next provider
      continue;
    }
  }

  // If we get here, all providers failed
  const errorMessages = errors.map((e) => e.message).join("; ");
  throw new Error(
    `All image generation providers failed. Tried: ${providers.join(", ")}. Errors: ${errorMessages}`
  );
}

/**
 * Try to edit an image using the configured providers in priority order
 */
export async function executeEdit(args: EditImageArgs): Promise<ProviderResult> {
  const errors: Error[] = [];

  for (const provider of providers) {
    try {
      if (provider === "runway" && runwayAdapter.isConfigured()) {
        try {
          return await runwayAdapter.executeEdit(args);
        } catch (error) {
          console.warn(`Runway image editing not available: ${error instanceof Error ? error.message : String(error)}`);
          errors.push(error instanceof Error ? error : new Error(String(error)));
          continue;
        }
      }

      if (provider === "stable-diffusion" && stableDiffusionAdapter.isConfigured()) {
        return await stableDiffusionAdapter.executeEdit(args);
      }
    } catch (error) {
      errors.push(error instanceof Error ? error : new Error(String(error)));
      continue;
    }
  }

  const errorMessages = errors.map((e) => e.message).join("; ");
  throw new Error(
    `All image editing providers failed. Tried: ${providers.join(", ")}. Errors: ${errorMessages}`
  );
}







