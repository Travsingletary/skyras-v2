# Runway ML Integration for Giorgio

Giorgio's video generation capabilities powered by Runway ML Gen-3 Alpha.

## Overview

Giorgio can now generate videos using Runway ML's API:
- **Text-to-Video**: Generate videos from text descriptions
- **Image-to-Video**: Animate static images with motion
- **Models**: Gen-3 Alpha Turbo (default), Gen-3 Alpha, and other Runway models
- **Duration**: 2-10 seconds per video
- **Aspect Ratios**: 16:9, 9:16, 1:1, 4:3, 3:4

## Setup

### 1. Get Runway API Key

1. Sign up at [runwayml.com](https://runwayml.com)
2. Navigate to [Account Settings → API Keys](https://app.runwayml.com/account)
3. Create a new API key
4. Copy the key

### 2. Configure Environment Variables

Add to your `.env` or `.env.local`:

```bash
RUNWAY_API_KEY=your-runway-api-key-here
RUNWAY_API_BASE_URL=https://api.dev.runwayml.com
RUNWAY_API_VERSION=2024-11-06
```

### 3. Add to Vercel (Production)

In Vercel dashboard → Settings → Environment Variables:
- `RUNWAY_API_KEY`: Your Runway API key
- `RUNWAY_API_BASE_URL`: https://api.dev.runwayml.com
- `RUNWAY_API_VERSION`: 2024-11-06

## Usage with Giorgio

### Text-to-Video

Ask Giorgio to generate a video:

```typescript
// Example prompt to Giorgio
"Create a 5-second video of a sunset over mountains with cinematic camera movement"
```

Giorgio's `generateRunwayVideo` action will:
1. Create a text-to-video generation task
2. Poll Runway API until video is ready (up to 5 minutes)
3. Download video and store in Supabase Storage
4. Return video URL

### Image-to-Video

Provide an image URL to Giorgio:

```typescript
await giorgio.run({
  metadata: {
    action: "generateRunwayVideo",
    payload: {
      project: "Summer Campaign",
      context: "Ocean waves crashing on beach",
      imageUrl: "https://storage.supabase.co/.../beach.jpg",
      duration: 5,
      aspectRatio: "16:9",
      model: "gen3a_turbo",
    },
  },
});
```

## API Reference

### POST /api/tools/generateVideo

Generate a video using Runway ML.

**Request Body:**
```typescript
{
  prompt: string;              // Video description (required)
  imageUrl?: string;           // Optional: Image to animate
  duration?: number;           // 2-10 seconds (default: 5)
  aspectRatio?: string;        // "16:9", "9:16", "1:1", "4:3", "3:4" (default: "16:9")
  model?: string;              // "gen3a_turbo", "gen3a" (default: "gen3a_turbo")
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
    id: string;           // Runway task ID
    videoUrl: string;     // Public URL to video (Supabase or Runway)
    thumbnailUrl: string; // Optional thumbnail
    duration: number;     // Video duration in seconds
    model: string;        // Model used
    prompt: string;       // Original prompt
  }
}
```

**Response (Error):**
```typescript
{
  success: false,
  error: string;
  failureCode?: string; // Runway error code if available
}
```

## Models

### Gen-3 Alpha Turbo (Recommended)
- **Model ID**: `gen3a_turbo`
- **Speed**: Fastest generation (~30-60 seconds)
- **Quality**: High quality, optimized for speed
- **Cost**: Most cost-effective

### Gen-3 Alpha
- **Model ID**: `gen3a`
- **Speed**: Slower (~2-5 minutes)
- **Quality**: Highest quality, best for final production
- **Cost**: Higher cost per video

## Aspect Ratios

The API accepts friendly aspect ratio names:
- `16:9` → 1280:720 (landscape, YouTube)
- `9:16` → 720:1280 (portrait, TikTok/Instagram Stories)
- `1:1` → 1024:1024 (square, Instagram feed)
- `4:3` → 1024:768 (classic landscape)
- `3:4` → 768:1024 (classic portrait)

## Video Storage

Generated videos are automatically:
1. Downloaded from Runway's temporary storage
2. Uploaded to Supabase Storage bucket `user-uploads`
3. Made publicly accessible
4. Organized by project: `{projectId}/{timestamp}-{model}.mp4`

## Error Handling

Common errors and solutions:

### "Runway API key not configured"
- Add `RUNWAY_API_KEY` to environment variables
- Redeploy application after adding key

### "Video generation timed out"
- Video took longer than 5 minutes (maxDuration)
- Try using `gen3a_turbo` instead of `gen3a` for faster generation
- Set `waitForCompletion: false` to get task ID immediately

### "Runway API error: 401"
- Invalid API key
- Verify key is correct in environment variables

### "Runway API error: 429"
- Rate limit exceeded
- Wait a few minutes before trying again
- Consider upgrading Runway plan

### "Failed to store in Supabase"
- Supabase credentials not configured
- Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Video will still be available at Runway URL (temporary)

## Pricing

Runway ML charges per second of generated video:
- Gen-3 Alpha Turbo: ~$0.05/second
- Gen-3 Alpha: ~$0.10/second

Example costs:
- 5-second video (Turbo): ~$0.25
- 5-second video (Alpha): ~$0.50
- 10-second video (Turbo): ~$0.50

Check [Runway pricing](https://runwayml.com/pricing) for current rates.

## Troubleshooting

### Video generation is slow
- Use `gen3a_turbo` model (faster)
- Shorter videos generate faster (2-5 seconds)
- Complex prompts may take longer

### Video quality is poor
- Use `gen3a` model for higher quality
- Be more specific and detailed in prompts
- Provide reference images when possible

### Videos stored but not accessible
- Check Supabase Storage bucket `user-uploads` is public
- Verify CORS settings allow video playback
- Test video URL directly in browser

## Resources

- [Runway API Documentation](https://docs.dev.runwayml.com/)
- [Runway API Reference](https://docs.dev.runwayml.com/api/)
- [Gen-3 Alpha Overview](https://runwayml.com/research/introducing-gen-3-alpha)
- [Runway Pricing](https://runwayml.com/pricing)

## Example Giorgio Actions

### Generate Social Media Video
```typescript
await giorgio.run({
  metadata: {
    action: "generateRunwayVideo",
    payload: {
      project: "Product Launch",
      context: "Sleek smartphone rotating in neon-lit environment",
      mood: "futuristic",
      style: "cyberpunk aesthetic",
      duration: 5,
      aspectRatio: "9:16",  // TikTok/Stories format
      model: "gen3a_turbo",
    },
  },
});
```

### Animate a Concept Art
```typescript
await giorgio.run({
  metadata: {
    action: "generateRunwayVideo",
    payload: {
      project: "Character Design",
      context: "Character comes to life with subtle breathing and eye movement",
      imageUrl: "https://storage.supabase.co/.../character.jpg",
      duration: 3,
      aspectRatio: "1:1",
      model: "gen3a",  // Higher quality for final output
    },
  },
});
```

## Next Steps

- Integrate video preview in Giorgio's UI
- Add thumbnail generation from first frame
- Support video editing and extending
- Batch video generation for campaigns
