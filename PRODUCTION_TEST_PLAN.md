# Production Testing Checklist

## Pre-Deployment Verification

### 1. Environment Variables (Railway Dashboard)

```bash
# Required variables - verify ALL are set:
✅ SUPABASE_URL
✅ SUPABASE_SERVICE_ROLE_KEY
✅ SUPABASE_ANON_KEY
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ OPENAI_API_KEY
✅ ANTHROPIC_API_KEY
✅ CORS_ORIGINS
✅ NEXT_PUBLIC_APP_URL
```

### 2. Supabase Storage Setup

```bash
# In Supabase Dashboard:
1. Go to Storage
2. Verify bucket exists: "user-uploads"
3. Check bucket settings:
   - Public: Yes
   - File size limit: 50MB
   - Allowed MIME types: All (or specific list)

4. Verify RLS policies:
   - Allow authenticated uploads
   - Allow public reads (for signed URLs)
```

### 3. Deploy to Railway

```bash
# Push changes
git add .
git commit -m "Add CORS + direct upload support for Railway"
git push origin main

# Railway auto-deploys from main branch
# Wait for build to complete (~2-3 minutes)
```

## Post-Deployment Testing

### Test 1: CORS Preflight (Critical)

**Using Browser DevTools:**

1. Open your Railway app: `https://your-app.railway.app/app`
2. Open DevTools (F12) → Network tab
3. Filter: "api"
4. Try to upload a file

**Expected Results:**
```
OPTIONS /api/uploads/sign
Status: 204 No Content
Response Headers:
  Access-Control-Allow-Origin: https://your-app.railway.app
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
  Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
```

**Using cURL:**
```bash
curl -X OPTIONS https://your-app.railway.app/api/uploads/sign \
  -H "Origin: https://your-app.railway.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v

# ✅ Success: Returns 204 with CORS headers
# ❌ Failure: Returns 404 or missing headers → Check middleware.ts
```

### Test 2: File Upload (Direct to Supabase)

**Using Browser DevTools:**

1. Open your Railway app
2. Open DevTools → Network tab
3. Click file upload button (📎)
4. Select a small file (< 1MB)
5. Click send (➤)

**Expected Network Requests:**
```
1. POST /api/uploads/sign
   Status: 200
   Response: { success: true, data: { signedUrl, path, fileId } }

2. PUT https://zzxedixpbvivpsnztjsc.supabase.co/storage/v1/object/...
   Status: 200
   (Direct to Supabase - no Railway involved)

3. POST /api/uploads/confirm
   Status: 200
   Response: { success: true, data: { id, url, path } }

4. POST /api/chat
   Status: 200
   (Chat request with file reference)
```

**Common Issues:**

❌ **POST /api/uploads/sign returns 503**
```json
{ "error": "Storage not configured" }
```
→ Fix: Check SUPABASE_SERVICE_ROLE_KEY in Railway

❌ **PUT to Supabase returns 403**
```
Access Denied
```
→ Fix: Check bucket exists + public access enabled

❌ **POST /api/uploads/confirm returns 400**
```json
{ "error": "Missing required fields" }
```
→ Fix: Frontend not sending correct data (check directUpload.ts)

### Test 3: Voice Input (Speech-to-Text)

**Using Browser DevTools:**

1. Open your Railway app
2. Open DevTools → Network tab + Console tab
3. Click microphone button (🎙)
4. Allow microphone access
5. Say something clearly: "Hello, this is a test"
6. Click microphone again to stop

**Expected Network Requests:**
```
1. POST /api/uploads/sign
   Status: 200
   Response: { signedUrl, path, fileId }

2. PUT https://...supabase.co/storage/.../audio.webm
   Status: 200
   (Direct upload of recorded audio)

3. POST /api/speech-to-text
   Status: 200
   Request: { "storagePath": "public/123/audio.webm" }
   Response: { "success": true, "transcript": "Hello, this is a test" }

4. POST /api/chat
   Status: 200
   (Chat with transcribed text)
```

**Common Issues:**

❌ **POST /api/speech-to-text returns 500**
```json
{ "error": "OpenAI API key not configured" }
```
→ Fix: Add OPENAI_API_KEY to Railway

❌ **Transcription returns empty**
```json
{ "success": true, "transcript": "" }
```
→ Fix: Audio file might be empty or corrupted
→ Check: Browser console for MediaRecorder errors

❌ **PUT to Supabase fails**
```
Network Error
```
→ Fix: Check CORS on Supabase bucket settings

### Test 4: Error Handling

**Test 4.1: Missing Environment Variable**

```bash
# In Railway, temporarily remove OPENAI_API_KEY
railway variables unset OPENAI_API_KEY

# Try voice input on your app
# Expected: User-friendly error message
# "Speech-to-text is not configured. Please contact administrator."

# Restore variable
railway variables set OPENAI_API_KEY=sk-...
```

**Test 4.2: File Too Large**

1. Try to upload a file > 50MB
2. Expected: Error before upload starts
3. Message: "File too large. Maximum size: 50MB"

**Test 4.3: Invalid File Type**

1. Try to upload an .exe file
2. Expected: Error message
3. Message: "File type not allowed"

### Test 5: Performance Testing

**Metrics to Verify:**

```bash
# Open DevTools → Network tab
# Enable "Disable cache"
# Reload page and test each feature

File Upload (10MB file):
  /api/uploads/sign:    < 200ms  ✅
  PUT to Supabase:      < 5s     ✅ (depends on network)
  /api/uploads/confirm: < 500ms  ✅

Voice Input (10s recording):
  /api/uploads/sign:       < 200ms ✅
  PUT to Supabase:         < 2s    ✅
  /api/speech-to-text:     < 5s    ✅ (depends on OpenAI)

Chat Message:
  /api/chat:              < 3s    ✅
```

### Test 6: Railway Logs Verification

**During Testing:**

```bash
# Open Railway logs in real-time
railway logs --follow

# Expected log patterns:
[Sign] Created signed URL for: public/123-file.txt
[Confirm] File confirmed: { id: '...', path: '...', processingCount: 1 }
[STT] Fetched audio from storage: public/123/audio.webm (12345 bytes)
[STT] Using provider: OpenAI
```

**Common Log Errors:**

❌ `[Sign] Supabase credentials not configured`
→ Missing SUPABASE_SERVICE_ROLE_KEY

❌ `[STT] OPENAI_API_KEY not configured`
→ Missing OPENAI_API_KEY

❌ `[Confirm] Error: relation "files" does not exist`
→ Database not initialized

## Browser Compatibility Testing

### Test on Multiple Browsers:

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (Mac/iOS)

**Known Issues:**
- Safari may require HTTPS for MediaRecorder
- Firefox may show different MIME types for audio

## Mobile Testing

### iOS Safari:
1. Voice input requires HTTPS
2. File upload should work
3. Test both features

### Android Chrome:
1. Both features should work
2. Test voice input with different accents

## Rollback Plan

**If production is broken:**

```bash
# 1. Check Railway logs for errors
railway logs

# 2. Verify environment variables
railway variables

# 3. Rollback to previous deployment
railway rollback

# 4. Fix issues locally and redeploy
git revert HEAD
git push origin main
```

## Success Criteria

✅ **CORS**: All API requests have proper CORS headers
✅ **File Upload**: Files upload directly to Supabase (no 413 errors)
✅ **Voice Input**: Audio transcribes correctly
✅ **Performance**: Response times under target metrics
✅ **Errors**: User-friendly error messages
✅ **Logs**: Clear logging for debugging
✅ **Mobile**: Works on iOS and Android

## Final Checklist

Before marking deployment as successful:

- [ ] CORS preflight works (OPTIONS returns 204)
- [ ] File upload completes (small file < 1MB)
- [ ] File upload completes (large file 10-20MB)
- [ ] Voice input transcribes correctly
- [ ] Chat with file attachment works
- [ ] Chat with voice input works
- [ ] Error messages are user-friendly
- [ ] Railway logs show no errors
- [ ] Performance metrics meet targets
- [ ] Tested on Chrome, Firefox, Safari
- [ ] Tested on mobile device
- [ ] All environment variables confirmed
- [ ] Supabase storage accessible
- [ ] OpenAI API responding

## Monitoring Setup

**Set up alerts for:**

1. Railway error rate > 5%
2. Supabase storage > 80% quota
3. API response time > 10s
4. CORS errors in logs

**Weekly Review:**

- Check Railway metrics
- Review error logs
- Monitor storage usage
- Verify API costs (OpenAI + Supabase)
