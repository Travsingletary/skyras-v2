-- Storage Bucket Setup SQL
-- Run this in Supabase SQL Editor after creating buckets manually
-- OR use Supabase Dashboard → Storage → New Bucket

-- ============================================================================
-- STORAGE BUCKET RLS POLICIES
-- ============================================================================
-- These policies assume buckets 'source-images' and 'generated-videos' exist
-- Create buckets first via Dashboard: Storage → New Bucket

-- ============================================================================
-- SOURCE-IMAGES BUCKET POLICIES
-- ============================================================================

-- Allow users to upload to their own paths
-- Path format: {user_id}/source-images/{file_id}.{ext}
CREATE POLICY IF NOT EXISTS "Users can upload to own source-images path"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'source-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read their own files
CREATE POLICY IF NOT EXISTS "Users can read own source-images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'source-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Service role can manage all files
CREATE POLICY IF NOT EXISTS "Service role can manage all source-images"
ON storage.objects FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- GENERATED-VIDEOS BUCKET POLICIES
-- ============================================================================

-- Allow users to upload to their own paths
-- Path format: {user_id}/generated-videos/{job_id}.mp4
CREATE POLICY IF NOT EXISTS "Users can upload to own generated-videos path"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'generated-videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read their own files
CREATE POLICY IF NOT EXISTS "Users can read own generated-videos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'generated-videos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Service role can manage all files
CREATE POLICY IF NOT EXISTS "Service role can manage all generated-videos"
ON storage.objects FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if buckets exist
SELECT name, id, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE name IN ('source-images', 'generated-videos');

-- Check if policies exist
SELECT policyname, bucket_id
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND bucket_id IN ('source-images', 'generated-videos');
