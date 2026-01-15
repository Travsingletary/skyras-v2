# Video Animation Feature Setup Guide

## Overview

The IMAGE→VIDEO "Animate Image" feature allows users to animate existing images using Fal.ai Pika (preferred) or Runway (fallback).

## Prerequisites

1. Supabase project with database and storage configured
2. Fal.ai API key (or Runway API key as fallback)
3. Environment variables configured

## Setup Steps

### 1. Apply Database Migration

Run the migration in Supabase SQL Editor:

```sql
-- File: frontend/supabase/migrations/0014_video_animation.sql
```

This creates:
- `video_jobs` table - tracks animation jobs
- `video_quota` table - daily quota tracking per user
- RLS policies for user isolation

### 2. Create Storage Buckets

In Supabase Dashboard → Storage:

1. **Create `source-images` bucket:**
   - Name: `source-images`
   - Public: No (private)
   - File size limit: 10MB
   - Allowed MIME types: `image/png, image/jpeg, image/jpg, image/webp`

2. **Create `generated-videos` bucket:**
   - Name: `generated-videos`
   - Public: No (private)
   - File size limit: 100MB
   - Allowed MIME types: `video/mp4`

3. **Set RLS Policies for buckets:**
   - Users can upload to their own paths: `{user_id}/source-images/*` and `{user_id}/generated-videos/*`
   - Users can read their own files only

### 3. Configure Environment Variables

Add to your `.env.local` (or Vercel environment variables):

```bash
# Fal.ai API Key (required for primary provider)
FAL_KEY=your-fal-api-key-here

# Video Animation Settings (optional, defaults shown)
VIDEO_DAILY_LIMIT=20          # Daily animations per user
VIDEO_MAX_IMAGE_MB=10          # Max image size in MB
VIDEO_DEFAULT_DURATION=4       # Default video duration in seconds
VIDEO_DEFAULT_RESOLUTION=720p  # Default resolution
VIDEO_DEFAULT_MOTION=low       # Default motion strength (low/medium/high)

# Video Provider Priority (optional)
VIDEO_PROVIDER_PRIORITY=fal-pika,kling,runway
```

### 4. Get Fal.ai API Key

1. Sign up at https://fal.ai
2. Navigate to API Keys section
3. Create a new API key
4. Copy the key to `FAL_KEY` environment variable

## Usage

### For Users

1. Navigate to Asset Library (`/library`)
2. Select an image asset
3. Click "Animate" button
4. Wait for animation to complete (status shown inline)
5. Video will play automatically when ready

### API Endpoints

**POST `/api/video/animate`**
- Creates a new animation job
- Requires: `imageId`, `sourceImageUrl`, or `sourceImagePath`
- Returns: `{ jobId, status, provider, createdAt }`

**GET `/api/video/jobs/:id`**
- Gets job status and video URL
- Polls provider if job is still running
- Returns: `{ id, status, signedVideoUrl, ... }`

## Architecture

- **Backend**: Next.js API routes (not Edge Functions)
- **Provider**: Fal.ai Pika (primary), Runway (fallback)
- **Storage**: Supabase Storage (private buckets with signed URLs)
- **Database**: PostgreSQL with RLS policies
- **Quota**: DB-backed daily limit per user

## Troubleshooting

### Quota Exceeded (429)
- User has reached daily limit (default: 20)
- Check `video_quota` table for current count
- Reset quota: `UPDATE video_quota SET count = 0 WHERE user_id = '...' AND date = CURRENT_DATE;`

### Provider Errors
- Check Fal.ai API key is valid
- Verify image URL is accessible
- Check provider status page for outages

### Storage Errors
- Verify buckets exist in Supabase
- Check RLS policies allow user access
- Verify service role key has storage permissions

### Job Stuck in "Running"
- Check provider job status manually
- May need to update job status manually in database
- Consider implementing webhook support for real-time updates

## Cost Considerations

- Fal.ai Pika: ~$0.05-0.10 per animation (varies by duration/resolution)
- Storage: Monitor `generated-videos` bucket size
- Defaults optimized for cost: 4s duration, 720p, low motion

## Future Enhancements

- Webhook support for real-time job updates
- Batch animation support
- Custom motion controls
- Video editing/trimming
- Export to different formats
