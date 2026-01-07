# Kling AI Integration for Giorgio

Giorgio's video generation capabilities powered by Kling AI with multiple models and post-production editing.

## Overview

Kling AI provides advanced video generation with three specialized models:
- **Kling 2.5 Turbo**: Fast motion-only shots
- **Kling 1.0**: Advanced editing power (lighting, weather, outfits)
- **Kling 2.6**: Baked-in voices + sound design

## Setup

### 1. Get Kling AI API Key

1. Sign up at [klingai.com](https://klingai.com)
2. Navigate to API settings
3. Create a new API key
4. Copy the key

### 2. Configure Environment Variables

Add to your `.env` or `.env.local`:

```bash
KLING_API_KEY=your-kling-api-key-here
KLING_API_BASE_URL=https://api.klingai.com
VIDEO_PROVIDER_PRIORITY=kling,runway
```

### 3. Add to Vercel (Production)

In Vercel dashboard → Settings → Environment Variables:
- `KLING_API_KEY`: Your Kling API key
- `KLING_API_BASE_URL`: https://api.klingai.com (or your custom endpoint)
- `VIDEO_PROVIDER_PRIORITY`: kling,runway (or runway,kling to prefer Runway)

## Usage with Giorgio

### Basic Video Generation

Ask Giorgio to generate a video using Kling:

```typescript
// Example prompt to Giorgio
"Create a 5-second video from this image using Kling 2.5 Turbo"
```

### Model Selection

Choose the right model for your needs:

- **2.5 Turbo**: Fast generation, best for motion-only shots
- **1.0**: Best for post-production editing (lighting, weather changes)
- **2.6**: Includes audio generation (voices + sound design)

### Post-Production Editing

Kling 1.0 and 2.6 support in-model editing:

- Lighting adjustments
- Weather changes
- Camera angle modifications
- Watermark removal
- Character replacement

## API Reference

### POST /api/tools/generateVideo

Generate a video using Kling AI (or Runway as fallback).

**Request Body:**
```typescript
{
  prompt: string;              // Video description (required)
  imageUrl: string;            // Image to animate (required for Kling)
  duration?: number;           // 2-10 seconds (default: 5)
  aspectRatio?: string;        // "16:9", "9:16", "1:1", "4:3", "3:4" (default: "16:9")
  provider?: "kling" | "runway"; // Explicit provider selection (optional)
  klingModel?: "2.5-turbo" | "1.0" | "2.6"; // Kling model selection
  editOptions?: {              // Post-production editing (Kling 1.0/2.6)
    lighting?: string;
    weather?: string;
    cameraAngle?: string;
    removeWatermark?: boolean;
    replaceCharacter?: string;
  };
  projectId?: string;          // Optional: Project for organization
  agentName?: string;          // Optional: Agent name (default: "giorgio")
  waitForCompletion?: boolean; // Wait for video or return task ID (default: true)
}
```

**Response (Success):**
```typescript
{
  success: true,
  video: {
    id: string;           // Task ID
    videoUrl: string;     // Public URL to video (Supabase or Kling)
    thumbnailUrl: string; // Optional thumbnail
    duration: number;     // Video duration in seconds
    model: string;        // Model used (e.g., "kling-2.5-turbo")
    prompt: string;       // Original prompt
    provider: string;     // Provider used ("kling" or "runway")
  }
}
```

**Response (Error):**
```typescript
{
  success: false,
  error: string;
}
```

## Provider Fallback

The system automatically falls back to Runway if:
- Kling API key is not configured
- Kling API returns an error
- Kling is not in the provider priority list

Configure fallback order via `VIDEO_PROVIDER_PRIORITY`:
- `kling,runway` - Try Kling first, fallback to Runway
- `runway,kling` - Try Runway first, fallback to Kling
- `kling` - Only use Kling (will fail if not configured)

## Models Comparison

| Model | Speed | Best For | Audio |
|-------|-------|----------|-------|
| 2.5 Turbo | Fastest | Motion shots | No |
| 1.0 | Medium | Editing/Post-production | No |
| 2.6 | Slower | Complete videos with audio | Yes |

## Video Storage

Generated videos are automatically:
1. Downloaded from Kling's temporary storage
2. Uploaded to Supabase Storage bucket `user-uploads`
3. Public URL returned for use in workflows

## Integration with Workflow

Kling AI integrates seamlessly with the NanoBanana Pro + Kling workflow:
1. Generate storyboard frames with NanoBanana Pro
2. Upscale selected frames
3. Generate videos from upscaled frames using Kling
4. Apply post-production editing if needed

See `docs/END_TO_END_VIDEO_WORKFLOW.md` for complete workflow documentation.
