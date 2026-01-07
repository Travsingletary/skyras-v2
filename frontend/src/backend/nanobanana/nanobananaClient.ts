// NanoBanana Pro API client

const NANOBANANA_API_KEY = process.env.NANOBANANA_API_KEY || '';
const NANOBANANA_API_BASE_URL = process.env.NANOBANANA_API_BASE_URL || 'https://api.nanobanana.com';

export interface CharacterSheetRequest {
  prompt: string;
  characterDescription?: string;
  referenceImages?: string[]; // URLs of reference images
  style?: string;
}

export interface CharacterSheetResponse {
  success: boolean;
  characterSheetUrl?: string;
  portraitUrl?: string;
  fullBodyUrl?: string;
  error?: string;
}

export interface StoryboardRequest {
  prompt: string;
  characterSheetUrl?: string; // Reference to character sheet
  referenceImages?: string[]; // Props, character references
  frameCount?: number; // Default 9, can be 9-12
  resolution?: '4k' | '2k' | '1080p'; // Default 4k
  style?: string;
}

export interface StoryboardResponse {
  success: boolean;
  storyboardUrl?: string;
  frames?: Array<{
    index: number;
    imageUrl: string;
    description?: string;
  }>;
  error?: string;
}

export interface UpscaleRequest {
  imageUrl: string;
  frameIndex?: number; // If upscaling from storyboard
  targetResolution?: '4k' | '8k';
}

export interface UpscaleResponse {
  success: boolean;
  upscaledUrl?: string;
  error?: string;
}

export interface FixDriftRequest {
  imageUrl: string;
  characterSheetUrl: string;
  issue?: 'face' | 'props' | 'style';
  description?: string;
}

export interface FixDriftResponse {
  success: boolean;
  fixedUrl?: string;
  error?: string;
}

/**
 * Check if NanoBanana Pro is configured
 */
export function isConfigured(): boolean {
  return !!NANOBANANA_API_KEY;
}

/**
 * Generate character pose sheet
 */
export async function generateCharacterSheet(
  request: CharacterSheetRequest
): Promise<CharacterSheetResponse> {
  if (!isConfigured()) {
    return { success: false, error: 'NanoBanana API key not configured' };
  }

  try {
    const response = await fetch(`${NANOBANANA_API_BASE_URL}/v1/character/sheet`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NANOBANANA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: request.prompt,
        character_description: request.characterDescription,
        reference_images: request.referenceImages,
        style: request.style,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `API error: ${response.status} - ${errorText}` };
    }

    const data = await response.json();
    return {
      success: true,
      characterSheetUrl: data.character_sheet_url,
      portraitUrl: data.portrait_url,
      fullBodyUrl: data.full_body_url,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate storyboard contact sheet (9-12 frames)
 */
export async function generateStoryboard(
  request: StoryboardRequest
): Promise<StoryboardResponse> {
  if (!isConfigured()) {
    return { success: false, error: 'NanoBanana API key not configured' };
  }

  try {
    const response = await fetch(`${NANOBANANA_API_BASE_URL}/v1/storyboard/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NANOBANANA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: request.prompt,
        character_sheet_url: request.characterSheetUrl,
        reference_images: request.referenceImages,
        frame_count: request.frameCount || 9,
        resolution: request.resolution || '4k',
        style: request.style,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `API error: ${response.status} - ${errorText}` };
    }

    const data = await response.json();
    return {
      success: true,
      storyboardUrl: data.storyboard_url,
      frames: data.frames || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Upscale specific frame
 */
export async function upscaleFrame(request: UpscaleRequest): Promise<UpscaleResponse> {
  if (!isConfigured()) {
    return { success: false, error: 'NanoBanana API key not configured' };
  }

  try {
    const response = await fetch(`${NANOBANANA_API_BASE_URL}/v1/upscale`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NANOBANANA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: request.imageUrl,
        frame_index: request.frameIndex,
        target_resolution: request.targetResolution || '4k',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `API error: ${response.status} - ${errorText}` };
    }

    const data = await response.json();
    return {
      success: true,
      upscaledUrl: data.upscaled_url,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fix character/prop drift
 */
export async function fixDrift(request: FixDriftRequest): Promise<FixDriftResponse> {
  if (!isConfigured()) {
    return { success: false, error: 'NanoBanana API key not configured' };
  }

  try {
    const response = await fetch(`${NANOBANANA_API_BASE_URL}/v1/fix/drift`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NANOBANANA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: request.imageUrl,
        character_sheet_url: request.characterSheetUrl,
        issue: request.issue,
        description: request.description,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `API error: ${response.status} - ${errorText}` };
    }

    const data = await response.json();
    return {
      success: true,
      fixedUrl: data.fixed_url,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
