# Vercel Environment Variables - Complete Checklist

## 🎯 Quick Setup Guide

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Set all variables for: **Production + Preview + Development** (unless otherwise noted)

---

## ✅ Required Variables (Must Have)

### Supabase Configuration (Backend - Private)
```
SUPABASE_URL=https://zzxedixpbvivpsnztjsc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6eGVkaXhwYnZpdnBzbnp0anNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzODkyMTksImV4cCI6MjA3ODk2NTIxOX0.xDUS_lPMxQvI-J1ZaafWOhaAhqwRW-whr-PrYFQh1RQ
SUPABASE_SECRET_KEY=sb_secret_a_N4Wj4CLe2bFqgMbLIIJg_gSab7Wwy
```
**⚠️ CRITICAL:** `SUPABASE_SECRET_KEY` must be set for **all environments** (Production, Preview, Development)

### Supabase Configuration (Frontend - Public)
```
NEXT_PUBLIC_SUPABASE_URL=https://zzxedixpbvivpsnztjsc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6eGVkaXhwYnZpdnBzbnp0anNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzODkyMTksImV4cCI6MjA3ODk2NTIxOX0.xDUS_lPMxQvI-J1ZaafWOhaAhqwRW-whr-PrYFQh1RQ
```

### Storage Configuration
```
DEFAULT_STORAGE_PROVIDER=supabase
SIGNED_URL_DEFAULT_EXPIRY=3600
```

### RBAC Configuration
```
RBAC_ENFORCE=true
```

### API Keys (Required for Core Features)
```
ANTHROPIC_API_KEY=<your-anthropic-api-key>
OPENAI_API_KEY=<your-openai-api-key>
```

### App URL Configuration
```
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
CORS_ORIGINS=https://your-app.vercel.app,https://your-custom-domain.com
```

---

## 🔧 Optional Variables (Feature-Specific)

### TTS (Text-to-Speech) Configuration
```
TTS_PROVIDER=openai
TTS_DEFAULT_VOICE=nova
TTS_DEFAULT_SPEED=1.0
ELEVENLABS_API_KEY=<your-elevenlabs-key-if-using-premium-tts>
```

### Image Generation (Studio Features)
```
IMAGE_STORAGE_BUCKET=generated-images
IMAGE_PROVIDER_PRIORITY=runway,stable-diffusion
IMAGE_PROVIDER_NAME=replicate-stable-diffusion
IMAGE_PROVIDER_BASE_URL=https://api.replicate.com/v1
REPLICATE_API_TOKEN=<your-replicate-token>
REPLICATE_MODEL_ID=stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b
RUNWAY_API_KEY=<your-runway-key>
RUNWAY_API_BASE_URL=https://api.dev.runwayml.com
RUNWAY_API_VERSION=2024-11-06
```

### Access Control
```
NEXT_PUBLIC_ACCESS_CODE=<your-secret-passcode-if-using-password-protection>
```

### API Base URL (if using external backend)
```
NEXT_PUBLIC_API_BASE_URL=<your-backend-url>
```

### Marcus Morning Meeting (Optional Feature)
```
CRON_SECRET=<generate-random-secret-min-32-chars>
MORNING_MEETING_USERS=public
GOOGLE_OAUTH_ENCRYPTION_KEY=<64-character-hex-string>
GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_REDIRECT_URI=https://your-app.vercel.app/api/auth/google/callback
```

### Firebase (Push Notifications - Optional)
```
NEXT_PUBLIC_FIREBASE_API_KEY=<your-api-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-project>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your-project-id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<your-project>.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
NEXT_PUBLIC_FIREBASE_APP_ID=<your-app-id>
NEXT_PUBLIC_FIREBASE_VAPID_KEY=<your-vapid-key>
FIREBASE_SERVICE_ACCOUNT=<base64-encoded-service-account-json>
```

---

## 🗑️ Variables to DELETE (Cleanup)

These variables are redundant or not used:

### Redundant Supabase Variables
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (duplicate of NEXT_PUBLIC_SUPABASE_ANON_KEY)
- `SUPABASE_PUBLISHABLE_KEY` (duplicate of SUPABASE_ANON_KEY)
- `SUPABASE_SERVICE_ROLE_KEY` (old format, replaced by SUPABASE_SECRET_KEY)
- `SUPABASE_JWT_SECRET` (not used by the app)

### Unused Postgres Variables
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

**Note:** These Postgres variables were added by the Supabase integration but we access the database through the Supabase client, not direct Postgres connections.

---

## 📋 Verification Checklist

After setting all variables:

- [ ] All required variables are set for **Production + Preview + Development**
- [ ] `SUPABASE_SECRET_KEY` is set for all environments (critical for file uploads)
- [ ] `NEXT_PUBLIC_APP_URL` matches your actual Vercel deployment URL
- [ ] `CORS_ORIGINS` includes your Vercel URL and any custom domains
- [ ] Redundant variables have been deleted
- [ ] Optional variables are set only if you're using those features

---

## 🧪 Testing After Setup

1. **Test File Upload:**
   ```bash
   curl -X POST https://your-app.vercel.app/api/upload \
     -F "files=@test.jpg" \
     -F "userId=test-user-123"
   ```
   Should return: `{"success":true,"data":{...}}`

2. **Test Marcus Chat:**
   - Visit: `https://your-app.vercel.app/app`
   - Send a message: "Hello Marcus"
   - Should receive a response

3. **Check Environment Endpoint:**
   ```bash
   curl https://your-app.vercel.app/api/_env
   ```
   Should show all required variables as `true`

---

## 🔍 Troubleshooting

### File Uploads Fail
- **Error: "Storage not configured"** → Add `SUPABASE_SECRET_KEY` to all environments
- **Error: "Bucket not found"** → Create `user-uploads` bucket in Supabase Dashboard

### Preview Deployments Fail
- **Error: Missing environment variable** → Ensure `SUPABASE_SECRET_KEY` is set for Preview environment

### CORS Errors
- **Error: CORS blocked** → Add your domain to `CORS_ORIGINS` and ensure `NEXT_PUBLIC_APP_URL` is correct

---

## 📝 Notes

- All `NEXT_PUBLIC_*` variables are exposed to the browser (safe for public keys only)
- Private keys (`SUPABASE_SECRET_KEY`, API keys) should NOT have `NEXT_PUBLIC_` prefix
- Variables are case-sensitive
- After adding/changing variables, Vercel will auto-redeploy


