# Vercel Production Deployment - File Upload Fix

## Current Issue

**Error**: `File upload failed: Upload failed: Forbidden`
**Cause**: `/api/upload` returning 403 - likely Supabase Storage permissions

## Solution Implemented

### 1. Direct-to-Supabase Uploads (Signed URLs)

**New Flow:**
```
Browser → /api/uploads/sign → Get signed URL
Browser → Supabase Storage → Direct PUT upload
Browser → /api/uploads/confirm → Save metadata
```

**Benefits:**
- ✅ Bypasses Vercel function size limits
- ✅ Faster uploads (direct to storage)
- ✅ No 403 errors (signed URLs have proper permissions)
- ✅ Lower Vercel costs

### 2. Files Created

```
frontend/src/middleware.ts                    # CORS handling
frontend/src/app/api/uploads/sign/route.ts   # Generate signed URLs
frontend/src/app/api/uploads/confirm/route.ts # Confirm uploads
frontend/src/lib/directUpload.ts              # Frontend helper
frontend/src/app/api/speech-to-text/route.ts # Updated for storage
```

## Required Vercel Environment Variables

### In Vercel Dashboard → Settings → Environment Variables

**Add these (Production + Preview):**

```bash
# Supabase (Backend only - not exposed to client)
SUPABASE_URL=https://zzxedixpbvivpsnztjsc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6eGVkaXhwYnZpdnBzbnp0anNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzM4OTIxOSwiZXhwIjoyMDc4OTY1MjE5fQ.Kf-8cP1t0xTHZeNE9ROycmlVxU7j2vc8srW5izvNVJo
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6eGVkaXhwYnZpdnBzbnp0anNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzODkyMTksImV4cCI6MjA3ODk2NTIxOX0.xDUS_lPMxQvI-J1ZaafWOhaAhqwRW-whr-PrYFQh1RQ

# Supabase (Exposed to client - prefixed with NEXT_PUBLIC)
NEXT_PUBLIC_SUPABASE_URL=https://zzxedixpbvivpsnztjsc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6eGVkaXhwYnZpdnBzbnp0anNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzODkyMTksImV4cCI6MjA3ODk2NTIxOX0.xDUS_lPMxQvI-J1ZaafWOhaAhqwRW-whr-PrYFQh1RQ

# OpenAI (for speech-to-text)
OPENAI_API_KEY=your-openai-key

# Anthropic
ANTHROPIC_API_KEY=your-anthropic-key

# CORS (your Vercel domain)
CORS_ORIGINS=https://your-app.vercel.app,https://your-custom-domain.com
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**⚠️ CRITICAL**: Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client. Only use in API routes.

## Deployment Steps

### 1. Commit Changes

```bash
git add .
git commit -m "Fix file uploads: Add direct-to-Supabase signed URL uploads"
git push origin main
```

### 2. Set Vercel Environment Variables

1. Go to Vercel Dashboard
2. Select your project
3. Settings → Environment Variables
4. Add all variables listed above
5. Select "Production" and "Preview" environments
6. Click "Save"

### 3. Redeploy

Vercel auto-deploys on push to main. Wait ~2 minutes for deployment.

## Testing Steps

### Test 1: Verify Environment Variables

```bash
# Using Vercel CLI
vercel env pull

# Or in Vercel Dashboard → Settings → Environment Variables
# Verify all required variables are set
```

### Test 2: Test File Upload

1. Open your Vercel app: `https://your-app.vercel.app/app`
2. Open DevTools (F12) → Network tab
3. Click file upload (📎)
4. Select a small file (< 1MB)
5. Click send (➤)

**Expected Network Requests:**
```
1. POST /api/uploads/sign
   Status: 200
   Response: { success: true, data: { signedUrl, path, fileId } }

2. PUT https://zzxedixpbvivpsnztjsc.supabase.co/storage/v1/object/...
   Status: 200
   (Direct to Supabase)

3. POST /api/uploads/confirm
   Status: 200
   Response: { success: true, data: { id, url } }
```

**If you see 403:**

Check Response body for specific error:

```json
// Missing env var
{ "success": false, "error": "Storage not configured" }
→ Add SUPABASE_SERVICE_ROLE_KEY to Vercel

// Supabase bucket issue
{ "error": "Bucket not found" }
→ Create "user-uploads" bucket in Supabase

// Permissions issue
{ "error": "Access denied" }
→ Check Supabase Storage policies (see below)
```

### Test 3: Check Vercel Function Logs

1. Go to Vercel Dashboard
2. Deployments → Latest deployment → Functions
3. Click on `/api/uploads/sign`
4. View logs for errors

**Expected Logs:**
```
[Sign] Created signed URL for: public/123-file.txt
```

**Error Logs to watch for:**
```
[Sign] Supabase credentials not configured
→ Missing SUPABASE_SERVICE_ROLE_KEY

[Sign] Error creating signed URL: Bucket not found
→ Create bucket in Supabase

[Sign] Error creating signed URL: Access denied
→ Check service role key is correct
```

## Supabase Storage Setup

### 1. Create Bucket (if not exists)

1. Go to Supabase Dashboard
2. Storage → Create bucket
3. Name: `user-uploads`
4. Public bucket: ✅ Yes
5. File size limit: 50MB
6. Allowed MIME types: (leave empty for all)

### 2. Update Storage Policies

In Supabase Dashboard → Storage → user-uploads → Policies:

```sql
-- Allow authenticated uploads
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-uploads');

-- Allow public reads (for signed URLs)
CREATE POLICY "Allow public reads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'user-uploads');

-- Allow service role full access
CREATE POLICY "Service role full access"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'user-uploads');
```

**Or simpler (for testing):**

1. Go to Storage → user-uploads
2. Configuration → Public bucket: ✅ Enable
3. This allows signed URL uploads without complex policies

## Troubleshooting

### Issue: Still getting 403 on upload

**Check:**

1. Vercel env vars are set (SUPABASE_SERVICE_ROLE_KEY)
2. Supabase bucket exists and is public
3. Service role key is correct (not anon key)
4. Bucket name matches: `user-uploads`

**Debug:**

```bash
# Test signed URL generation locally
curl -X POST http://localhost:3000/api/uploads/sign \
  -H "Content-Type: application/json" \
  -d '{"fileName":"test.txt","fileType":"text/plain","fileSize":100,"userId":"test"}'

# Should return:
# { "success": true, "data": { "signedUrl": "https://...", ... } }
```

### Issue: CORS errors

**Symptom**: `Access-Control-Allow-Origin` error in browser console

**Fix**: Verify `middleware.ts` exists and `CORS_ORIGINS` env var is set

### Issue: Environment variables not loading

**Fix**: Redeploy after setting env vars

```bash
# Force redeploy
vercel --force
```

## Migration from Old Upload Flow

### Old Code (remove this):

```typescript
// ❌ OLD: Goes through Vercel function
const formData = new FormData();
formData.append('files', file);
formData.append('userId', userId);

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData,
});
```

### New Code (use this):

```typescript
// ✅ NEW: Direct to Supabase
import { uploadFileDirect } from '@/lib/directUpload';

const result = await uploadFileDirect(file, userId, {
  projectId: 'optional-project-id',
  onProgress: (progress) => console.log(`${progress}%`),
});

console.log('Uploaded:', result.url);
```

## Verification Checklist

After deployment:

- [ ] All env vars set in Vercel (Production + Preview)
- [ ] SUPABASE_SERVICE_ROLE_KEY is secret (not NEXT_PUBLIC)
- [ ] Supabase bucket "user-uploads" exists
- [ ] Bucket is public OR has proper policies
- [ ] File upload works (< 1MB file)
- [ ] File upload works (10-20MB file)
- [ ] Voice input works (if implemented)
- [ ] No 403 errors in DevTools
- [ ] Vercel function logs show success
- [ ] No CORS errors in browser console

## Next Steps

1. **Test thoroughly** with different file sizes
2. **Monitor Vercel logs** for any errors
3. **Check Supabase quota** (free tier: 1GB storage)
4. **Update frontend code** to use `directUpload.ts`
5. **Remove old `/api/upload` endpoint** (optional, keep for backward compat)
