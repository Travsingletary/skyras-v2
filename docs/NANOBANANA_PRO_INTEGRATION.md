# NanoBanana Pro Integration for Giorgio

Giorgio's storyboard and character generation capabilities powered by NanoBanana Pro.

## Overview

NanoBanana Pro provides:
- **Character Pose Sheets**: Side-by-side character references (portrait + full body)
- **Storyboard Generation**: Contact sheets with 9-12 consistent frames at once
- **Image Upscaling**: High-resolution upscaling of selected frames
- **Drift Fixing**: Re-apply character consistency to fix generation drift

## Setup

### 1. Get NanoBanana Pro API Key

1. Sign up at [nanobanana.com](https://nanobanana.com)
2. Navigate to API settings
3. Create a new API key
4. Copy the key

### 2. Configure Environment Variables

Add to your `.env` or `.env.local`:

```bash
NANOBANANA_API_KEY=your-nanobanana-api-key-here
NANOBANANA_API_BASE_URL=https://api.nanobanana.com
```

### 3. Add to Vercel (Production)

In Vercel dashboard → Settings → Environment Variables:
- `NANOBANANA_API_KEY`: Your NanoBanana Pro API key
- `NANOBANANA_API_BASE_URL`: https://api.nanobanana.com (or your custom endpoint)

## Usage with Giorgio

### Character Sheet Generation

Generate a character pose sheet to lock in character consistency:

```typescript
// Example prompt to Giorgio
"Generate a character pose sheet for my protagonist with Shaq-inspired style"
```

### Storyboard Generation

Generate a storyboard contact sheet with 9-12 frames:

```typescript
// Example prompt to Giorgio
"Generate a 9-frame storyboard for my video project"
```

### Frame Upscaling

Upscale specific frames from the storyboard:

```typescript
// Example prompt to Giorgio
"Upscale frame #5 from the storyboard to 4K"
```

### Drift Fixing

Fix character or prop drift in generated images:

```typescript
// Example prompt to Giorgio
"Fix the character drift in this image using the character sheet"
```

## API Reference

### POST /api/tools/nanobanana

Handle all NanoBanana Pro operations.

**Request Body:**
```typescript
{
  action: "characterSheet" | "storyboard" | "upscale" | "fixDrift";
  
  // Character sheet params
  prompt?: string;
  characterDescription?: string;
  referenceImages?: string[];
  style?: string;
  
  // Storyboard params
  characterSheetUrl?: string;
  frameCount?: number; // 9-12 (default: 9)
  resolution?: "4k" | "2k" | "1080p"; // Default: 4k
  
  // Upscale params
  imageUrl?: string;
  frameIndex?: number;
  targetResolution?: "4k" | "8k";
  
  // Fix drift params
  issue?: "face" | "props" | "style";
  description?: string;
  
  // Common
  projectId?: string;
  agentName?: string;
}
```

**Response (Success):**
```typescript
{
  success: true,
  // Character sheet response
  characterSheetUrl?: string;
  portraitUrl?: string;
  fullBodyUrl?: string;
  
  // Storyboard response
  storyboardUrl?: string;
  frames?: Array<{
    index: number;
    imageUrl: string;
    description?: string;
  }>;
  
  // Upscale response
  upscaledUrl?: string;
  
  // Fix drift response
  fixedUrl?: string;
}
```

**Response (Error):**
```typescript
{
  success: false,
  error: string;
}
```

## Workflow Integration

NanoBanana Pro is designed to work in the complete video production pipeline:

1. **Character Lock-In**: Generate character sheet first
2. **Storyboard Generation**: Use character sheet to generate consistent storyboard
3. **Frame Selection**: Select best frames from storyboard
4. **Upscaling**: Upscale selected frames to production quality
5. **Video Generation**: Use upscaled frames for video generation (Kling/Runway)

## Key Features

### Character Consistency

Character sheets ensure:
- Same character appearance across all shots
- Consistent facial features
- Matching wardrobe and props
- Style consistency

### Batch Generation

Storyboard generation produces:
- 9-12 frames at once (configurable)
- All frames maintain character consistency
- Different angles, poses, lighting automatically
- 4K resolution by default

### Production Quality

Upscaling ensures:
- High-resolution frames ready for video
- No artifacts from low-res source images
- Production-ready quality
- Maintains character consistency

## Best Practices

1. **Generate character sheet first** - Lock in character design before storyboard
2. **Use 4K resolution** - Essential for video generation quality
3. **Select frames carefully** - Choose frames that work best for motion
4. **Fix drift early** - Address consistency issues before upscaling
5. **Reference images** - Use reference images for props and style

## Integration with Kling AI

NanoBanana Pro storyboards are designed to work with Kling AI:
1. Generate storyboard with NanoBanana Pro
2. Upscale selected frames
3. Generate videos from upscaled frames using Kling
4. Apply post-production editing in Kling if needed

See `docs/END_TO_END_VIDEO_WORKFLOW.md` for complete workflow documentation.
