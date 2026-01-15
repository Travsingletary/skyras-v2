# Video Animation Feature - Prerequisites Setup

## Status: Manual Setup Required

The Supabase MCP connection is experiencing timeouts. Please complete these steps manually:

## Step 1: Apply Database Migrations

### Option A: Via Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard
2. Select project: `zzxedixpbvivpsnztjsc`
3. Click **SQL Editor** → **+ New query**
4. Copy and paste the contents of `frontend/supabase/migrations/0014_video_animation.sql`
5. Click **Run**
6. Copy and paste the contents of `frontend/supabase/migrations/0014_video_animation_hardening.sql`
7. Click **Run**

### Option B: Via Supabase CLI

```bash
cd frontend
supabase db push
```

## Step 2: Create Storage Buckets

1. Go to Supabase Dashboard → **Storage**
2. Click **New bucket**
3. Create bucket: `source-images`
   - **Public**: No (private)
   - **File size limit**: 10 MB
   - **Allowed MIME types**: `image/png, image/jpeg, image/jpg, image/webp`
4. Click **New bucket** again
5. Create bucket: `generated-videos`
   - **Public**: No (private)
   - **File size limit**: 100 MB
   - **Allowed MIME types**: `video/mp4`

### Storage RLS Policies

After creating buckets, set RLS policies:

**For `source-images` bucket:**
```sql
-- Allow users to upload to their own paths
CREATE POLICY "Users can upload to own source-images path"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'source-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read their own files
CREATE POLICY "Users can read own source-images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'source-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**For `generated-videos` bucket:**
```sql
-- Allow users to upload to their own paths
CREATE POLICY "Users can upload to own generated-videos path"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'generated-videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read their own files
CREATE POLICY "Users can read own generated-videos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'generated-videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Service role can manage all files
CREATE POLICY "Service role can manage all generated-videos"
ON storage.objects FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');
```

## Step 3: Set Vercel Environment Variables

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Add the following variables for **Production**, **Preview**, and **Development**:

```bash
# Fal.ai API Key (required)
FAL_KEY=your-fal-api-key-here

# Video Animation Settings (optional, defaults shown)
VIDEO_DAILY_LIMIT=20
VIDEO_MAX_IMAGE_MB=10
VIDEO_DEFAULT_DURATION=4
VIDEO_DEFAULT_RESOLUTION=720p
VIDEO_DEFAULT_MOTION=low

# Video Provider Priority (optional)
VIDEO_PROVIDER_PRIORITY=fal-pika,kling,runway
```

3. Click **Save** for each environment

## Step 4: Get Fal.ai API Key

1. Sign up at https://fal.ai
2. Navigate to **API Keys** section
3. Create a new API key
4. Copy the key to `FAL_KEY` in Vercel

## Step 5: Verify Setup

### Verify Database Tables

Run in Supabase SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('video_jobs', 'video_quota');
```

Expected: Both tables should exist.

### Verify Storage Buckets

1. Go to Supabase Dashboard → **Storage**
2. Verify `source-images` and `generated-videos` buckets exist
3. Verify they are marked as **Private**

### Verify Environment Variables

Check Vercel deployment logs or use:
```bash
# In your local .env.local
echo $FAL_KEY  # Should show your key (not empty)
```

## Troubleshooting

### Migration Errors

- **"relation already exists"**: Migration already applied, safe to ignore
- **"function update_updated_at_column does not exist"**: Run migration `0002_core_schema.sql` first
- **"permission denied"**: Ensure you're using service role key or have proper permissions

### Storage Bucket Errors

- **403 Forbidden**: Check RLS policies are set correctly
- **Bucket not found**: Verify bucket names match exactly: `source-images` and `generated-videos`

### Environment Variable Issues

- **FAL_KEY not found**: Ensure variable is set in Vercel and redeployed
- **Provider errors**: Check Fal.ai API key is valid and has credits

## Next Steps

After completing prerequisites:
1. Deploy code changes to Vercel
2. Test animation feature in production
3. Monitor logs for any errors
4. Verify quota system works correctly
