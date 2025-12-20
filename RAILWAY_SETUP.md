# Railway Production Setup Guide

## Environment Variables

### Required for Railway Backend

Add these to your Railway service environment variables:

```bash
# === Supabase Configuration ===
SUPABASE_URL=https://zzxedixpbvivpsnztjsc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# === Next.js Public (exposed to browser) ===
NEXT_PUBLIC_SUPABASE_URL=https://zzxedixpbvivpsnztjsc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=https://your-app.railway.app

# === API Keys ===
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-proj-...  # Required for speech-to-text (Whisper)
ELEVENLABS_API_KEY=sk_...    # Optional for premium TTS

# === CORS Configuration ===
CORS_ORIGINS=https://your-app.railway.app,https://your-custom-domain.com

# === Storage Configuration ===
DEFAULT_STORAGE_PROVIDER=supabase
SIGNED_URL_DEFAULT_EXPIRY=3600

# === Optional: TTS ===
TTS_PROVIDER=openai
TTS_DEFAULT_VOICE=nova
TTS_DEFAULT_SPEED=1.0

# === Optional: Access Control ===
NEXT_PUBLIC_ACCESS_CODE=your-secret-code
RBAC_ENFORCE=false
```

## Railway-Specific Configuration

### Build Settings

1. **Build Command**: `npm run build` (default)
2. **Start Command**: `npm start` (default)
3. **Root Directory**: `/frontend` (if deploying from frontend directory)

### Deployment Settings

1. **Region**: Choose closest to your users
2. **Auto-Deploy**: Enable for main branch
3. **Health Check**: `/api/health` (create this endpoint)

## Architecture Changes for Production

### Before (Issues)
```
Browser → Railway Backend → Process File → Upload to Supabase
         ⚠️ Large payload through Railway (slow, expensive)
         ⚠️ No CORS headers (preflight fails)
         ⚠️ Request size limits
```

### After (Fixed)
```
Browser → Railway (/api/uploads/sign) → Get signed URL
Browser → Supabase Storage → Direct upload (fast, cheap)
Browser → Railway (/api/uploads/confirm) → Save metadata
         ✅ Small payloads only
         ✅ CORS headers on all routes
         ✅ No size limits
```

## API Endpoints

### File Upload Flow

1. **GET** `/api/uploads/sign`
   - Request signed URL for direct upload
   - Returns: `{ signedUrl, path, fileId, token }`

2. **PUT** `{signedUrl}`
   - Upload file directly to Supabase Storage
   - No backend involved

3. **POST** `/api/uploads/confirm`
   - Confirm upload and save metadata
   - Returns: `{ id, url, processingCount }`

### Voice Input Flow

1. Record audio in browser (MediaRecorder)

2. **POST** `/api/uploads/sign`
   - Get signed URL for audio file

3. **PUT** `{signedUrl}`
   - Upload audio directly to Supabase

4. **POST** `/api/speech-to-text`
   - Body: `{ storagePath: "user/123/audio.webm" }`
   - Backend fetches from Supabase, sends to OpenAI Whisper
   - Returns: `{ success: true, transcript: "..." }`

## Verifying Configuration

### 1. Check Environment Variables

```bash
# In Railway dashboard
railway variables

# Verify required vars are set:
# - SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
# - OPENAI_API_KEY
# - CORS_ORIGINS
```

### 2. Check CORS Headers

```bash
# Test OPTIONS preflight
curl -X OPTIONS https://your-app.railway.app/api/upload \
  -H "Origin: https://your-app.railway.app" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Should return:
# Access-Control-Allow-Origin: https://your-app.railway.app
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

### 3. Check Supabase Storage

```bash
# Test signed URL generation
curl -X POST https://your-app.railway.app/api/uploads/sign \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test.txt",
    "fileType": "text/plain",
    "fileSize": 100,
    "userId": "test-user"
  }'

# Should return:
# {
#   "success": true,
#   "data": {
#     "signedUrl": "https://...",
#     "path": "test-user/...",
#     "fileId": "..."
#   }
# }
```

## Common Issues & Solutions

### Issue: CORS Preflight Fails

**Symptom**: OPTIONS request returns 404 or no CORS headers

**Solution**:
1. Verify `middleware.ts` exists in `src/`
2. Check `CORS_ORIGINS` env var is set
3. Restart Railway service

### Issue: Upload to Supabase Fails

**Symptom**: PUT to signed URL returns 403

**Solution**:
1. Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
2. Check Supabase Storage bucket exists: `user-uploads`
3. Verify bucket policy allows uploads
4. Check signed URL hasn't expired (5 min validity)

### Issue: Speech-to-Text Fails

**Symptom**: Transcription returns 500 error

**Solution**:
1. Verify `OPENAI_API_KEY` is set
2. Check OpenAI quota/billing
3. Verify audio file is in Supabase Storage
4. Check Railway logs for detailed error

### Issue: Large Files Fail

**Symptom**: Upload fails for files >10MB

**Solution**:
1. This is expected with old flow (goes through Railway)
2. Migrate to new direct upload flow (see Frontend section)
3. Verify client uses `/api/uploads/sign` → direct upload → `/api/uploads/confirm`

## Monitoring

### Railway Logs

```bash
# View real-time logs
railway logs

# Look for:
# [Sign] Created signed URL for: user/123/file.txt
# [Confirm] File confirmed: { id, path, processingCount }
# [STT] Fetched audio from storage: user/123/audio.webm
```

### Metrics to Monitor

1. **Response Times**
   - `/api/uploads/sign`: Should be <100ms
   - `/api/uploads/confirm`: Should be <500ms
   - `/api/speech-to-text`: Should be <3s

2. **Error Rates**
   - Watch for 403 (Supabase auth issues)
   - Watch for 413 (payload too large - shouldn't happen with new flow)
   - Watch for 503 (missing env vars)

3. **Storage Usage**
   - Monitor Supabase Storage quota
   - Set up alerts for 80% usage

## Security Checklist

- [✅] CORS origins allowlist configured
- [✅] Service role key kept secret (server-only)
- [✅] Signed URLs expire after 5 minutes
- [✅] File type validation on upload
- [✅] File size limits enforced (50MB)
- [✅] User ID required for all uploads
- [✅] Storage bucket has proper RLS policies
- [✅] API keys not exposed to frontend
- [✅] HTTPS enforced in production

## Cost Optimization

### Before
- Large files go through Railway
- Railway charges for bandwidth
- Slow uploads = longer request times = higher costs

### After
- Files go directly to Supabase
- Railway only handles small metadata requests
- Fast uploads = lower Railway costs
- Supabase has generous free tier (1GB storage, 2GB bandwidth)

### Estimated Savings
- 100 file uploads/day (10MB avg each):
  - **Before**: ~30GB Railway bandwidth/month
  - **After**: ~3GB Railway bandwidth/month (10x reduction)
