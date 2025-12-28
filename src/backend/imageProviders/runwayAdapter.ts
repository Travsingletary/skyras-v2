// Runway image generation adapter
// Note: Runway currently focuses on video generation. This adapter is prepared
// for future image generation capabilities or can be used with Runway's image-to-video
// by extracting a frame. For now, it will gracefully fall back if not configured.

import type { CreateImageArgs, EditImageArgs, ProviderResult } from "./types";

const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY || "";
const RUNWAY_API_BASE_URL = process.env.RUNWAY_API_BASE_URL || "https://api.dev.runwayml.com";
const RUNWAY_API_VERSION = process.env.RUNWAY_API_VERSION || "2024-11-06";

function requireEnv(name: string, value: string) {
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
}

function validateConfig() {
  requireEnv("RUNWAY_API_KEY", RUNWAY_API_KEY);
}

function getDims(size?: string): { width: number; height: number } {
  switch (size) {
    case "512x512":
      return { width: 512, height: 512 };
    case "1536x1536":
      return { width: 1536, height: 1536 };
    case "1024x1024":
    default:
      return { width: 1024, height: 1024 };
  }
}

function buildPrompt(prompt: string, style?: string): string {
  if (!style) return prompt;
  return `${prompt}, ${style}`;
}

async function fetchImageAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Image download failed ${res.status}: ${text}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer).toString("base64");
}

/**
 * Generate an image using Runway API
 * Note: Runway's primary focus is video. This implementation attempts to use
 * Runway's API for image generation if available, or falls back gracefully.
 */
export async function executeCreate(args: CreateImageArgs): Promise<ProviderResult> {
  validateConfig();
  
  const { width, height } = getDims(args.size);
  const prompt = buildPrompt(args.prompt, args.style);
  
  try {
    // Runway doesn't currently have a text-to-image endpoint
    // This is a placeholder for future API support
    // For now, we'll throw a clear error that Runway image generation isn't available
    throw new Error(
      "Runway API does not currently support text-to-image generation. " +
      "Runway focuses on video generation. Please use Stable Diffusion as the image provider."
    );
    
    // Future implementation when Runway adds image generation:
    // const response = await fetch(`${RUNWAY_API_BASE_URL}/v1/text_to_image`, {
    //   method: "POST",
    //   headers: {
    //     "Authorization": `Bearer ${RUNWAY_API_KEY}`,
    //     "Content-Type": "application/json",
    //     "X-Runway-Version": RUNWAY_API_VERSION,
    //   },
    //   body: JSON.stringify({
    //     promptText: prompt,
    //     width,
    //     height,
    //   }),
    // });
    //
    // if (!response.ok) {
    //   const errorText = await response.text();
    //   throw new Error(`Runway API error: ${response.status} - ${errorText}`);
    // }
    //
    // const data = await response.json();
    // const imageUrl = data.image_url || data.output?.url;
    // if (!imageUrl) {
    //   throw new Error("Runway did not return an image URL");
    // }
    //
    // const imageBase64 = await fetchImageAsBase64(imageUrl);
    //
    // return {
    //   imageBase64,
    //   modelName: "runway-gen-image",
    //   providerName: "runway",
    // };
  } catch (error) {
    // Re-throw with context
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Runway image generation failed: ${String(error)}`);
  }
}

/**
 * Edit an image using Runway API
 * Note: Not currently supported by Runway
 */
export async function executeEdit(args: EditImageArgs): Promise<ProviderResult> {
  validateConfig();
  throw new Error(
    "Runway API does not currently support image editing. " +
    "Please use Stable Diffusion as the image provider."
  );
}

export function isConfigured(): boolean {
  return !!RUNWAY_API_KEY;
}









