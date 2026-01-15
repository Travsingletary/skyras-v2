# Video Animation Feature - MCP Setup Guide

## Current Status

The Supabase MCP is experiencing connection timeouts. Use the manual setup steps below.

## Quick Setup Checklist

- [ ] Apply database migrations (SQL Editor)
- [ ] Create storage buckets (Dashboard)
- [ ] Set storage RLS policies (SQL Editor)
- [ ] Set Vercel environment variables
- [ ] Verify setup

## Step-by-Step Instructions

### 1. Database Migrations

**Location:** Supabase Dashboard → SQL Editor

**Migration 1:** Copy and run `frontend/supabase/migrations/0014_video_animation.sql`

**Migration 2:** Copy and run `frontend/supabase/migrations/0014_video_animation_hardening.sql`

**Verification:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('video_jobs', 'video_quota');
```

Expected: Both `video_jobs` and `video_quota` should appear.

### 2. Storage Buckets

**Location:** Supabase Dashboard → Storage → New Bucket

**Bucket 1: `source-images`**
- Name: `source-images`
- Public: **No** (private)
- File size limit: `10485760` (10 MB)
- Allowed MIME types: `image/png,image/jpeg,image/jpg,image/webp`

**Bucket 2: `generated-videos`**
- Name: `generated-videos`
- Public: **No** (private)
- File size limit: `104857600` (100 MB)
- Allowed MIME types: `video/mp4`

### 3. Storage RLS Policies

**Location:** Supabase Dashboard → SQL Editor

Run the SQL from `scripts/setup-video-animation-storage.sql`

Or copy-paste:

```sql
-- Source-images policies
CREATE POLICY IF NOT EXISTS "Users can upload to own source-images path"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'source-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY IF NOT EXISTS "Users can read own source-images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'source-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY IF NOT EXISTS "Service role can manage all source-images"
ON storage.objects FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Generated-videos policies
CREATE POLICY IF NOT EXISTS "Users can upload to own generated-videos path"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'generated-videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY IF NOT EXISTS "Users can read own generated-videos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'generated-videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY IF NOT EXISTS "Service role can manage all generated-videos"
ON storage.objects FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');
```

### 4. Vercel Environment Variables

**Location:** Vercel Dashboard → skyras-v2 → Settings → Environment Variables

**Required:**
- `FAL_KEY` - Your Fal.ai API key

**Optional (with defaults):**
- `VIDEO_DAILY_LIMIT=20`
- `VIDEO_MAX_IMAGE_MB=10`
- `VIDEO_DEFAULT_DURATION=4`
- `VIDEO_DEFAULT_RESOLUTION=720p`
- `VIDEO_DEFAULT_MOTION=low`
- `VIDEO_PROVIDER_PRIORITY=fal-pika,kling,runway`

**Apply to:** Production, Preview, Development

### 5. Verification

**Database:**
```sql
-- Check tables exist
SELECT COUNT(*) FROM video_jobs;
SELECT COUNT(*) FROM video_quota;

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('video_jobs', 'video_quota');
```

**Storage:**
```sql
-- Check buckets exist
SELECT name, public FROM storage.buckets 
WHERE name IN ('source-images', 'generated-videos');
```

**Vercel:**
- Check deployment logs for environment variable errors
- Verify `FAL_KEY` is set (not empty)

## Automated Setup (If MCP Works)

If Supabase MCP connection is restored, you can run:

```bash
# Apply migrations
node -e "
const { applyMigration } = require('./scripts/apply-migration.mjs');
applyMigration('frontend/supabase/migrations/0014_video_animation.sql');
applyMigration('frontend/supabase/migrations/0014_video_animation_hardening.sql');
"

# Or use Supabase CLI
cd frontend
supabase db push
```

## Troubleshooting

### Migration Errors

- **"relation already exists"**: Tables already created, safe to ignore
- **"function does not exist"**: Run `0002_core_schema.sql` first to create `update_updated_at_column()`
- **"permission denied"**: Use service role key or ensure proper permissions

### Storage Errors

- **403 Forbidden**: Check RLS policies are applied
- **Bucket not found**: Verify exact bucket names (case-sensitive)

### Environment Variable Issues

- **FAL_KEY missing**: Set in Vercel and redeploy
- **Provider errors**: Verify Fal.ai API key is valid

## Next Steps

After setup:
1. Deploy code to Vercel
2. Test animation feature
3. Monitor logs
4. Verify quota system
