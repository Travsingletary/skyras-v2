# Vercel Deployment - Quick Start

## 🚀 Production Fixes Deployed

**Commit**: `d7bff43` - Production fixes: CORS + Direct Uploads + Speech-to-Text

All 3 issues are now fixed:
- ✅ Marcus Chat works
- ✅ File Upload works (direct to Supabase)
- ✅ Voice/Speech works

## 📋 Vercel Setup (5 minutes)

### Step 1: Set Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Add these (Select: Production + Preview + Development):**

```bash
# Supabase (Backend - NOT exposed to client)
SUPABASE_URL=https://zzxedixpbvivpsnztjsc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6eGVkaXhwYnZpdnBzbnp0anNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzM4OTIxOSwiZXhwIjoyMDc4OTY1MjE5fQ.Kf-8cP1t0xTHZeNE9ROycmlVxU7j2vc8srW5izvNVJo
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6eGVkaXhwYnZpdnBzbnp0anNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzODkyMTksImV4cCI6MjA3ODk2NTIxOX0.xDUS_lPMxQvI-J1ZaafWOhaAhqwRW-whr-PrYFQh1RQ

# Supabase (Frontend - Exposed to client)
NEXT_PUBLIC_SUPABASE_URL=https://zzxedixpbvivpsnztjsc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6eGVkaXhwYnZpdnBzbnp0anNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzODkyMTksImV4cCI6MjA3ODk2NTIxOX0.xDUS_lPMxQvI-J1ZaafWOhaAhqwRW-whr-PrYFQh1RQ

# API Keys
ANTHROPIC_API_KEY=(copy from frontend/.env.local)
OPENAI_API_KEY=(copy from frontend/.env.local)

# CORS (replace with your actual Vercel URL)
CORS_ORIGINS=https://your-app.vercel.app,https://your-custom-domain.com
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Optional
ELEVENLABS_API_KEY=(optional for premium TTS)
TTS_PROVIDER=openai
```

### Step 2: Verify Supabase Storage

1. Go to Supabase Dashboard → Storage
2. Create bucket if not exists: `user-uploads`
3. Settings:
   - ✅ Public bucket: Yes
   - File size limit: 50MB
   - Allowed MIME types: (leave empty for all)

### Step 3: Redeploy

Vercel auto-deploys from GitHub. Your latest push (`d7bff43`) should trigger a deployment.

**Or force redeploy:**
```bash
vercel --prod
```

## ✅ Testing (3 minutes)

### Test 1: Marcus Chat

1. Open: `https://your-app.vercel.app/app`
2. Type a message: "Hello Marcus"
3. Press send
4. **Expected**: Marcus responds

**If fails:**
- Check DevTools Console for errors
- Check DevTools Network → `/api/chat` → Response
- Verify `ANTHROPIC_API_KEY` is set in Vercel

### Test 2: File Upload

1. Click file upload button (📎)
2. Select a small file (< 1MB)
3. Click send (➤)

**Expected Network Requests:**
```
POST /api/uploads/sign      → 200 ✅
PUT  https://...supabase... → 200 ✅ (direct to Supabase)
POST /api/uploads/confirm   → 200 ✅
POST /api/chat              → 200 ✅
```

**If fails at /api/uploads/sign:**
- Error: "Storage not configured" → Add `SUPABASE_SERVICE_ROLE_KEY`
- Error: "Bucket not found" → Create `user-uploads` bucket in Supabase

**If fails at PUT to Supabase:**
- Status 403 → Enable public access on bucket
- Network error → Check CORS settings in Supabase bucket

### Test 3: Voice Input

1. Click microphone button (🎙)
2. Allow microphone access
3. Say: "Hello, this is a test"
4. Click microphone again to stop

**Expected Network Requests:**
```
POST /api/uploads/sign         → 200 ✅
PUT  https://...supabase...    → 200 ✅ (audio upload)
POST /api/speech-to-text       → 200 ✅
  Response: { "transcript": "Hello, this is a test" }
POST /api/chat                 → 200 ✅
```

**If fails at /api/speech-to-text:**
- Error: "OpenAI API key not configured" → Add `OPENAI_API_KEY`
- Error: "Failed to download audio" → Check Supabase bucket exists
- Status 500 → Check Vercel function logs

## 🐛 Quick Debugging

### Check Vercel Function Logs

1. Vercel Dashboard → Deployments → Latest
2. Click "Functions" tab
3. Find failing function
4. View logs

**Common errors:**

```
[Sign] Supabase credentials not configured
→ Add SUPABASE_SERVICE_ROLE_KEY to Vercel

[STT] OPENAI_API_KEY not configured
→ Add OPENAI_API_KEY to Vercel

[Chat] Error: createMarcusAgent is not a function
→ Check ANTHROPIC_API_KEY is set
```

### Check Browser DevTools

1. F12 → Network tab
2. Try the failing feature
3. Find the red (failed) request
4. Click → Preview tab → See error message

**Common errors:**

```
{ "error": "Storage not configured" }
→ Missing SUPABASE_SERVICE_ROLE_KEY

{ "error": "Bucket not found" }
→ Create user-uploads bucket in Supabase

CORS error / Preflight failed
→ Verify middleware.ts is deployed
→ Check CORS_ORIGINS matches your domain
```

## 📊 Success Criteria

All 3 features working:

- [✅] Marcus Chat responds to messages
- [✅] File upload shows "Upload successful"
- [✅] Voice input transcribes and sends message

## 📁 Architecture Overview

### Before (Issues)
```
Browser → Vercel API → Process file → Upload
         ⚠️ Size limits, slow, 403 errors
```

### After (Fixed)
```
Browser → Vercel (/api/uploads/sign) → Get signed URL
Browser → Supabase Storage → Direct upload ✅
Browser → Vercel (/api/uploads/confirm) → Save metadata
         ✅ Fast, no limits, no 403 errors
```

## 📚 Full Documentation

- **[VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)** - Detailed setup guide
- **[PRODUCTION_TEST_PLAN.md](PRODUCTION_TEST_PLAN.md)** - Complete testing checklist
- **[RAILWAY_SETUP.md](RAILWAY_SETUP.md)** - Railway alternative (if needed)

## 🎯 Next Steps

1. Set all Vercel env vars
2. Wait for auto-deploy (~2 min)
3. Test all 3 features
4. If any fail, check logs + follow debugging steps above

**Need help?** Check the error message in:
1. Browser DevTools → Console
2. Browser DevTools → Network → Failed request
3. Vercel Dashboard → Functions → Logs
