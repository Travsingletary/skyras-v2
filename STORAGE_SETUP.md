# Supabase Storage Setup

## Create Storage Bucket

The file upload system requires a Supabase storage bucket named `user-uploads`.

### Steps to Create Bucket:

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard/project/zzxedixpbvivpsnztjsc/storage/buckets
   - Or navigate: Dashboard → Storage → Buckets

2. **Create New Bucket**
   - Click "New bucket"
   - Bucket name: `user-uploads`
   - Public bucket: ✅ YES (enable public access for file previews)
   - File size limit: 100 MB (optional)
   - Allowed MIME types: Leave empty to allow all (or specify: `audio/*, video/*, image/*, application/pdf, text/*`)

3. **Set Bucket Policies (Optional)**
   - If you want more control, you can set RLS policies:
   - Allow authenticated users to upload: `auth.uid() is not null`
   - Allow public read access: `true` (for file previews)

### Verify Bucket Exists

Run this API test after creating the bucket:

```bash
curl http://localhost:4000/api/upload \
  -F "files=@test.mp3" \
  -F "userId=test_user_123"
```

If successful, you should see:
```json
{
  "success": true,
  "data": {
    "fileIds": ["..."],
    "files": [...],
    "uploadedCount": 1,
    "workflowSuggestions": [...]
  }
}
```

### Storage Structure

Files are organized by date and user:
```
user-uploads/
  2025-12-10/
    user_123/
      abc123-song.mp3
      def456-video.mp4
  2025-12-11/
    user_456/
      ...
```

### Public Access

Files are publicly accessible via Supabase CDN:
```
https://zzxedixpbvivpsnztjsc.supabase.co/storage/v1/object/public/user-uploads/2025-12-10/user_123/abc123-song.mp3
```

This allows the FilePreview component to display and play media files in the browser.

## Next Steps

After creating the bucket:
1. Visit http://localhost:4000/studio
2. Upload a test file (audio/video/image)
3. Verify file appears in FilePreview component
4. Check workflow suggestions appear
5. Visit http://localhost:4000/analytics to see stats update
