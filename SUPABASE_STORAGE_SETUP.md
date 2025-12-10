# Supabase Storage Setup for File Uploads

## Quick Setup (5 minutes)

File uploads now use Supabase Storage instead of local filesystem, which means they work on Vercel and other serverless platforms.

### Step 1: Create Storage Bucket

1. **Go to Supabase Dashboard:** https://supabase.com/dashboard
2. **Select your project:** `zzxedixpbvivpsnztjsc` (or your project)
3. **Navigate to Storage** (left sidebar)
4. **Click "New bucket"**
5. **Configure bucket:**
   - **Name:** `user-uploads`
   - **Public bucket:** ✅ **Enable** (files will be publicly accessible via URL)
   - **Allowed MIME types:** Leave empty or add: `audio/*, video/*, image/*, application/pdf, text/*`
   - **Max file size:** `104857600` (100MB in bytes)
   - Click **"Create bucket"**

### Step 2: Configure Bucket Policies (Make Files Public)

1. **In the Storage page**, click on `user-uploads` bucket
2. **Click "Policies" tab**
3. **Click "New policy"**
4. **Choose template:** "Allow public read access"
5. **Policy configuration:**
   - **Policy name:** `Public read access for user-uploads`
   - **Allowed operations:** SELECT
   - **Target roles:** `public`
   - Click **"Review"** then **"Save policy"**

6. **Create another policy for uploads:**
   - **Click "New policy"** again
   - **Choose template:** "Allow authenticated users to upload"
   - **Policy name:** `Allow uploads to user-uploads`
   - **Allowed operations:** INSERT
   - **Target roles:** `authenticated`, `anon` (add both)
   - Click **"Review"** then **"Save policy"**

### Step 3: Verify Environment Variables

Make sure these are set in Vercel (and in your local `.env.local`):

```
SUPABASE_URL=https://zzxedixpbvivpsnztjsc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6eGVkaXhwYnZpdnBzbnp0anNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzODkyMTksImV4cCI6MjA3ODk2NTIxOX0.xDUS_lPMxQvI-J1ZaafWOhaAhqwRW-whr-PrYFQh1RQ
```

These should already be configured based on your deployment docs.

### Step 4: Test Upload

1. **Start dev server:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Visit:** http://localhost:4000/studio

3. **Upload a test file:**
   - Click "Attach Files"
   - Select an audio/video/image file
   - Send a message
   - File should upload to Supabase and return a public URL

4. **Check Supabase:**
   - Go to Storage → user-uploads bucket
   - You should see: `YYYY-MM-DD/userId/fileId.ext`

### Step 5: Deploy to Production

Once local testing works:

```bash
git add -A
git commit -m "Migrate file uploads to Supabase Storage"
git push origin main
```

Vercel will auto-deploy with Supabase storage enabled.

## Storage Structure

Files are organized as:
```
user-uploads/
  2025-12-10/
    user_abc123/
      uuid-v4-file-id.mp3
      uuid-v4-file-id.jpg
  2025-12-11/
    user_def456/
      uuid-v4-file-id.pdf
```

## File Access

**Public URLs are generated automatically:**
```
https://zzxedixpbvivpsnztjsc.supabase.co/storage/v1/object/public/user-uploads/2025-12-10/user_abc/uuid.mp3
```

Marcus and agents can use these URLs to:
- Analyze audio for licensing
- Process images for cataloging
- Download files for creative workflows

## Troubleshooting

**Error: "Storage bucket 'user-uploads' does not exist"**
- Create the bucket in Supabase dashboard (see Step 1)

**Error: "Failed to upload file to Supabase: new row violates row-level security policy"**
- Configure bucket policies (see Step 2)
- Make sure both SELECT and INSERT policies are created

**Error: "Supabase client not initialized"**
- Check SUPABASE_URL and SUPABASE_ANON_KEY in environment variables
- Restart dev server after adding env vars

**Files upload but return 403 when accessed:**
- Bucket is not public
- Add the "Public read access" policy (see Step 2)

## Storage Limits

- **Max file size:** 100MB per file
- **Max files per upload:** 10 files
- **Max total upload:** 500MB per request
- **Allowed types:** Audio, video, images, documents

**Supabase free tier:**
- 1GB storage included
- Upgrade to Pro ($25/month) for 100GB storage

## Migration from Local Storage

If you previously uploaded files locally (`/uploads` directory):
- Those files are NOT automatically migrated
- They only exist on your local machine
- Re-upload any important files through the UI
- Old local files can be safely deleted

## Next Steps

After Supabase Storage is working:
- ✅ Files work on Vercel production
- ✅ Marcus can process uploaded files
- ✅ Agents can access file URLs
- 🔜 Add file metadata storage in Supabase database
- 🔜 Implement file search and filtering
- 🔜 Add file preview/playback in UI
