# Supabase File Upload Setup Guide

This guide ensures Marcus can accept file uploads without breaking the app.

## What's Already Protected ✅

The upload API now includes a **safety check** that prevents crashes if Supabase isn't configured. Instead of breaking, it returns a user-friendly error message.

## Required Setup in Supabase

### 1. Create Storage Bucket

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the sidebar
3. Click **New bucket**
4. Create a bucket named: `user-uploads`
5. **Important**: Set the bucket to **Public** if you want files to be directly accessible, or **Private** if you want controlled access

**Bucket Configuration:**
```
Name: user-uploads
Public: true (recommended for simplicity)
File size limit: 100MB (matches app config)
Allowed MIME types: all (the app validates file types)
```

### 2. Set Bucket Policies (if using Public bucket)

Add this RLS policy to allow uploads:

```sql
-- Allow authenticated uploads
CREATE POLICY "Allow uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-uploads');

-- Allow public reads (if public bucket)
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-uploads');
```

### 3. Create Database Tables

Run this SQL in Supabase SQL Editor:

```sql
-- Files table
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  project_id UUID,
  original_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_extension TEXT NOT NULL,
  processing_status TEXT DEFAULT 'pending',
  processing_results JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- File processing table
CREATE TABLE IF NOT EXISTS file_processing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  processing_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  results JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_project_id ON files(project_id);
CREATE INDEX IF NOT EXISTS idx_file_processing_file_id ON file_processing(file_id);
```

### 4. Verify Environment Variables

Ensure these are set in Vercel:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Testing File Uploads

### Test 1: Check Storage Configuration

```bash
curl https://your-app.vercel.app/api/upload \
  -X POST \
  -F "userId=test_user" \
  -F "files=@test.txt"
```

**Expected responses:**
- ❌ `503`: Storage not configured → Set up Supabase bucket
- ❌ `400`: Invalid file type → Only allowed extensions work
- ✅ `200`: Upload successful

### Test 2: Check Allowed File Types

**Allowed extensions:**
- Audio: `.mp3`, `.wav`, `.m4a`, `.aac`, `.ogg`, `.flac`
- Video: `.mp4`, `.mov`, `.avi`, `.webm`, `.mkv`
- Images: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg`
- Documents: `.pdf`, `.txt`, `.md`, `.doc`, `.docx`

### Test 3: Check File Size Limits

- Max per file: **100MB**
- Max total per upload: **500MB**
- Max files per upload: **10**

## Common Issues & Fixes

### Issue: "File storage is not configured"
**Cause:** Supabase bucket `user-uploads` doesn't exist
**Fix:** Create the bucket in Supabase dashboard (see Step 1 above)

### Issue: "Failed to upload file to Supabase: new row violates row-level security policy"
**Cause:** RLS policies are blocking uploads
**Fix:** Add the RLS policies from Step 2 above

### Issue: "Failed to create file record: relation 'files' does not exist"
**Cause:** Database tables haven't been created
**Fix:** Run the SQL from Step 3 above

### Issue: "Some files failed validation"
**Cause:** File type not allowed or file too large
**Fix:** Check allowed extensions and size limits above

## How It Works

1. **Frontend** uploads file via `/api/upload`
2. **API** validates file type, size, and count
3. **API** saves file to Supabase Storage bucket `user-uploads`
4. **API** saves metadata to `files` table
5. **API** creates processing records in `file_processing` table
6. **API** returns file IDs and public URLs
7. **Marcus** can reference these files in chat context

## Production URL

Latest deployment: https://skyras-v2-o2qm3k2kq-travis-singletarys-projects.vercel.app

## What Happens If Not Configured?

✅ **The app won't crash!** The upload API will return a clean error message:
```json
{
  "success": false,
  "error": "File storage is not configured. Please contact administrator.",
  "details": ["Supabase storage bucket 'user-uploads' is not available"]
}
```

Users will see: "File upload failed: File storage is not configured"

This allows you to deploy and test without files first, then add file support later.
