# Runway Integration Guide

## Overview
RunwayML video generation has been integrated into the agent system. Giorgio can now generate videos using Runway's Veo 3 models (veo3, veo3.1, veo3.1_fast).

## Setup

### 1. Get Runway API Key
1. Sign up at https://dev.runwayml.com/
2. Navigate to API settings
3. Generate an API key
4. Add it to your environment variables

### 2. Environment Variables
Add to your `.env.local` or environment:

```bash
RUNWAY_API_KEY=your_runway_api_key_here
RUNWAY_API_BASE_URL=https://api.dev.runwayml.com  # Default (corrected from api.runwayml.com)
RUNWAY_API_VERSION=2024-11-06  # API version in YYYY-MM-DD format (default: 2024-11-06)
```

**Verified API Structure** (as of 2024-12-19):
- Base URL: `https://api.dev.runwayml.com` (NOT `api.runwayml.com`)
- Text-to-Video Endpoint: `POST /v1/text_to_video`
- Task Status Endpoint: `GET /v1/tasks/{id}`
- Required Header: `X-Runway-Version: 2024-11-06` (date format)
- Models: `veo3`, `veo3.1`, `veo3.1_fast`
- Aspect Ratios: `1280:720`, `720:1280`, `1080:1920`, `1920:1080`
- Duration: 4, 6, or 8 seconds (for veo3.1 models)

## Usage

### Via Marcus (Automatic)
Marcus automatically detects video requests and delegates to Giorgio:

**Examples:**
- "Make a video for my project"
- "Generate a cinematic video"
- "Create a video using Runway"
- "Film a short clip about..."

### Via Giorgio Directly
Giorgio can generate videos with the `generateRunwayVideo` action:

```typescript
{
  action: "generateRunwayVideo",
  payload: {
    project: "MyProject",
    context: "A futuristic cityscape",
    mood: "dramatic",
    style: "cinematic",
    duration: 5,
    aspectRatio: "16:9",
    model: "gen3a_turbo"
  }
}
```

### Via API Endpoint
Direct API call to `/api/tools/generateVideo`:

```bash
curl -X POST http://localhost:3000/api/tools/generateVideo \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A cinematic shot of a futuristic city",
    "duration": 5,
    "aspectRatio": "16:9",
    "model": "gen3a_turbo",
    "projectId": "project-123",
    "waitForCompletion": true
  }'
```

## Features

### Supported Models
- `gen3a_turbo` - Fast generation (default)
- `gen3a` - Standard quality
- `gen4` - Highest quality (if available)

### Video Options
- **Duration**: 1-10 seconds (default: 5)
- **Aspect Ratios**: `16:9`, `9:16`, `1:1`, `4:5`
- **Image-to-Video**: Provide `imageUrl` for image-to-video generation
- **Seed**: Optional seed for reproducible results

### Polling
The system automatically polls for video completion when `waitForCompletion: true`:
- Polls every 2 seconds
- Maximum 60 attempts (2 minutes)
- Returns video URL when ready

## File Storage
Generated videos are automatically saved to:
- **Database**: `files` table with metadata
- **Storage**: Video URL stored in `public_url` field
- **Metadata**: Includes Runway video ID, prompt, model, duration

## Integration Points

### 1. Auto-Execution
When Marcus delegates video work, it:
1. Creates workflow and task
2. Triggers Giorgio to generate video
3. Saves video to database
4. Returns video URL in response

### 2. Agent Actions
Giorgio's `generateRunwayVideo` action:
- Calls `/api/tools/generateVideo`
- Waits for completion
- Returns video URL and metadata

### 3. API Route
`/api/tools/generateVideo`:
- Validates Runway API key
- Generates video via Runway API
- Optionally polls for completion
- Saves to database
- Returns video details

## Error Handling
- Missing API key: Returns 503 with helpful message
- API errors: Logged and returned to user
- Timeout: Returns error after max polling attempts
- File save failures: Logged but don't fail request

## Next Steps
1. Add `RUNWAY_API_KEY` to your environment
2. Test with: "Make a video for my project"
3. Check `/workflows` to see generated videos
4. Videos appear in project files

## API Reference

### Runway Library (`src/lib/runway.ts`)
- `generateRunwayVideo(request)` - Start video generation
- `getRunwayVideoStatus(videoId)` - Check generation status
- `pollRunwayVideo(videoId)` - Poll until complete

### API Route (`src/app/api/tools/generateVideo/route.ts`)
- `POST /api/tools/generateVideo` - Generate video endpoint

### Giorgio Action (`src/agents/giorgio/giorgioActions.ts`)
- `generateRunwayVideo(context, input)` - Agent action for video generation

