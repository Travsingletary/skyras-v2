# Environment Variables - Complete Reference Table

**Last Updated:** 2026-01-08  
**Purpose:** Consolidated reference for all environment variables used in SkyRas v2

---

## Table of Contents

1. [Required Variables (Core)](#required-variables-core)
2. [Supabase Configuration](#supabase-configuration)
3. [API Keys (AI Services)](#api-keys-ai-services)
4. [Storage Configuration](#storage-configuration)
5. [Video Generation Providers](#video-generation-providers)
6. [Image Generation Providers](#image-generation-providers)
7. [Audio/Music Generation](#audiomusic-generation)
8. [Text-to-Speech (TTS)](#text-to-speech-tts)
9. [Firebase (Push Notifications)](#firebase-push-notifications)
10. [Google OAuth](#google-oauth)
11. [Application Configuration](#application-configuration)
12. [Social Media APIs](#social-media-apis)
13. [Feature Flags](#feature-flags)
14. [Variables to Delete (Deprecated)](#variables-to-delete-deprecated)

---

## Required Variables (Core)

| Variable Name | Required | Scope | Default Value | Description | Where to Use |
|--------------|----------|-------|---------------|-------------|--------------|
| `NODE_ENV` | ✅ Yes | Server | `development` | Node.js environment | Root `.env` |
| `PORT` | ⚠️ Optional | Server | `4000` | Express server port | Root `.env` |
| `NEXT_PUBLIC_APP_URL` | ✅ Yes | Public | - | Your app URL (e.g., `https://skyras-v2.vercel.app`) | Vercel |
| `CORS_ORIGINS` | ✅ Yes | Server | - | Comma-separated allowed origins | Vercel |

---

## Supabase Configuration

| Variable Name | Required | Scope | Default Value | Description | Where to Use |
|--------------|----------|-------|---------------|-------------|--------------|
| `SUPABASE_URL` | ✅ Yes | Server | - | Supabase project URL | Vercel, `.env.local` |
| `SUPABASE_ANON_KEY` | ✅ Yes | Server | - | Supabase anonymous key | Vercel, `.env.local` |
| `SUPABASE_SECRET_KEY` | ✅ **CRITICAL** | Server | - | Supabase service role key (⚠️ Must be in ALL environments) | Vercel (all envs) |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Public | - | Supabase URL (exposed to browser) | Vercel, `.env.local` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Yes | Public | - | Supabase anonymous key (exposed to browser) | Vercel, `.env.local` |
| `RBAC_ENFORCE` | ✅ Yes | Server | `true` | Enable Role-Based Access Control | Vercel, `.env.local` |

**⚠️ CRITICAL NOTE:** `SUPABASE_SECRET_KEY` must be set for **Production + Preview + Development** environments in Vercel. Preview deployments will fail without it.

---

## API Keys (AI Services)

| Variable Name | Required | Scope | Default Value | Description | Where to Use |
|--------------|----------|-------|---------------|-------------|--------------|
| `ANTHROPIC_API_KEY` | ✅ Yes | Server | - | Anthropic Claude API key | Vercel, `.env.local` |
| `OPENAI_API_KEY` | ⚠️ Optional* | Server | - | OpenAI API key (for chat/TTS, falls back to ANTHROPIC) | Vercel, `.env.local` |

**Note:** `OPENAI_API_KEY` is optional if `ANTHROPIC_API_KEY` is set. The app will use Anthropic as primary, OpenAI as fallback.

---

## Storage Configuration

| Variable Name | Required | Scope | Default Value | Description | Where to Use |
|--------------|----------|-------|---------------|-------------|--------------|
| `DEFAULT_STORAGE_PROVIDER` | ✅ Yes | Server | `supabase` | Storage provider (supabase/qnap) | Vercel, `.env.local` |
| `SIGNED_URL_DEFAULT_EXPIRY` | ✅ Yes | Server | `3600` | Signed URL expiry in seconds | Vercel, `.env.local` |
| `IMAGE_STORAGE_BUCKET` | ✅ Yes | Server | `generated-images` | Supabase bucket for generated images | Vercel, `.env.local` |
| `QNAP_ROOT` | ⚠️ Optional | Server | - | Path to QNAP mount point (e.g., `/mnt/qnap/SkyRas`) | `.env.local` |
| `SKYRAS_ROOT` | ⚠️ Optional | Server | - | Alias for QNAP_ROOT | `.env.local` |
| `SKYSKY_ROOT` | ⚠️ Optional | Server | - | Legacy alias for QNAP_ROOT | `.env.local` |

---

## Video Generation Providers

| Variable Name | Required | Scope | Default Value | Description | Where to Use |
|--------------|----------|-------|---------------|-------------|--------------|
| `VIDEO_PROVIDER_PRIORITY` | ✅ Yes | Server | `opentune,fal-pika,kling,runway` | Provider priority (comma-separated) | Vercel, `.env.local` |
| `OPENTUNE_API_KEY` | ⚠️ Optional* | Server | - | OpenTune API key (image-to-video) | Vercel, `.env.local` |
| `OPENTUNE_API_BASE_URL` | ⚠️ Optional | Server | `https://api.opentune.ai` | OpenTune API base URL | Vercel, `.env.local` |
| `OPENTUNE_IMAGE_TO_VIDEO_ENDPOINT` | ⚠️ Optional | Server | `/v1/image-to-video` | OpenTune image-to-video endpoint | Vercel, `.env.local` |
| `OPENTUNE_STATUS_ENDPOINT` | ⚠️ Optional | Server | `/v1/video/jobs/{id}` | OpenTune status endpoint | Vercel, `.env.local` |
| `FAL_KEY` | ⚠️ Optional* | Server | - | Fal.ai API key (image-to-video) | Vercel, `.env.local` |
| `RUNWAY_API_KEY` | ⚠️ Optional* | Server | - | Runway ML API key | Vercel, `.env.local` |
| `RUNWAY_API_BASE_URL` | ⚠️ Optional | Server | `https://api.dev.runwayml.com` | Runway API base URL | Vercel, `.env.local` |
| `RUNWAY_API_VERSION` | ⚠️ Optional | Server | `2024-11-06` | Runway API version | Vercel, `.env.local` |
| `KLING_API_KEY` | ⚠️ Optional* | Server | - | Kling AI API key | Vercel, `.env.local` |
| `KLING_API_BASE_URL` | ⚠️ Optional | Server | `https://api.klingai.com` | Kling API base URL | Vercel, `.env.local` |
| `GEMINI_API_KEY` | ⚠️ Optional* | Server | - | Gemini API key (Nano Banana image generation) | Vercel, `.env.local` |
| `GEMINI_API_BASE_URL` | ⚠️ Optional | Server | `https://generativelanguage.googleapis.com/v1beta` | Gemini API base URL | Vercel, `.env.local` |
| `GEMINI_IMAGE_MODEL` | ⚠️ Optional | Server | `gemini-2.5-flash-image` | Gemini image model name | Vercel, `.env.local` |
| `GEMINI_IMAGE_ASPECT_RATIO` | ⚠️ Optional | Server | `1:1` | Gemini image aspect ratio | Vercel, `.env.local` |

**Note:** At least one video provider key (`OPENTUNE_API_KEY`, `FAL_KEY`, `RUNWAY_API_KEY`, or `KLING_API_KEY`) is required for video generation. If multiple are set, `VIDEO_PROVIDER_PRIORITY` determines which is tried first.

---

## Image Generation Providers

| Variable Name | Required | Scope | Default Value | Description | Where to Use |
|--------------|----------|-------|---------------|-------------|--------------|
| `IMAGE_PROVIDER_PRIORITY` | ✅ Yes | Server | `runway,stable-diffusion` | Provider priority (comma-separated) | Vercel, `.env.local` |
| `IMAGE_PROVIDER_NAME` | ⚠️ Optional | Server | `replicate-stable-diffusion` | Default image provider | Vercel, `.env.local` |
| `IMAGE_PROVIDER_BASE_URL` | ⚠️ Optional | Server | `https://api.replicate.com/v1` | Image provider API base URL | Vercel, `.env.local` |
| `REPLICATE_API_TOKEN` | ⚠️ Optional* | Server | - | Replicate API token | Vercel, `.env.local` |
| `REPLICATE_MODEL_ID` | ⚠️ Optional | Server | `stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b` | Replicate model ID | Vercel, `.env.local` |
| `NANOBANANA_API_KEY` | ⚠️ Optional | Server | - | NanoBanana Pro API key (character sheets, storyboards) | Vercel, `.env.local` |
| `NANOBANANA_API_BASE_URL` | ⚠️ Optional | Server | `https://api.nanobanana.com` | NanoBanana API base URL | Vercel, `.env.local` |

**Note:** `REPLICATE_API_TOKEN` is required if using Stable Diffusion for image generation. `NANOBANANA_API_KEY` is optional but enables character sheet and storyboard generation.

---

## Audio/Music Generation

| Variable Name | Required | Scope | Default Value | Description | Where to Use |
|--------------|----------|-------|---------------|-------------|--------------|
| `SUNO_API_KEY` | ⚠️ Optional | Server | - | Suno AI API key (music generation) | Vercel, `.env.local` |
| `SUNO_API_BASE_URL` | ⚠️ Optional | Server | `https://api.suno.ai/v1` | Suno API base URL | Vercel, `.env.local` |

---

## Text-to-Speech (TTS)

| Variable Name | Required | Scope | Default Value | Description | Where to Use |
|--------------|----------|-------|---------------|-------------|--------------|
| `TTS_PROVIDER` | ✅ Yes | Server | `openai` | TTS provider (`openai` or `elevenlabs`) | Vercel, `.env.local` |
| `TTS_DEFAULT_VOICE` | ✅ Yes | Server | `nova` | Default voice name | Vercel, `.env.local` |
| `TTS_DEFAULT_SPEED` | ✅ Yes | Server | `1.0` | Default speech speed | Vercel, `.env.local` |
| `ELEVENLABS_API_KEY` | ⚠️ Optional* | Server | - | ElevenLabs API key (required if `TTS_PROVIDER=elevenlabs`) | Vercel, `.env.local` |

**Note:** `ELEVENLABS_API_KEY` is required if `TTS_PROVIDER` is set to `elevenlabs`. Otherwise, OpenAI TTS will be used.

---

## Firebase (Push Notifications)

| Variable Name | Required | Scope | Default Value | Description | Where to Use |
|--------------|----------|-------|---------------|-------------|--------------|
| `FIREBASE_SERVICE_ACCOUNT` | ⚠️ Optional | Server | - | Base64-encoded Firebase service account JSON | Vercel |
| `FIREBASE_SERVICE_ACCOUNT_FILE` | ⚠️ Optional | Server | `config/firebase-service-account.json` | Path to Firebase service account file | `.env.local` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | ⚠️ Optional | Public | - | Firebase API key | Vercel |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | ⚠️ Optional | Public | - | Firebase auth domain | Vercel |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ⚠️ Optional | Public | - | Firebase project ID | Vercel |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | ⚠️ Optional | Public | - | Firebase storage bucket | Vercel |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ⚠️ Optional | Public | - | Firebase messaging sender ID | Vercel |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ⚠️ Optional | Public | - | Firebase app ID | Vercel |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | ⚠️ Optional | Public | - | Firebase VAPID key | Vercel |

**Note:** Use either `FIREBASE_SERVICE_ACCOUNT` (base64-encoded) for production or `FIREBASE_SERVICE_ACCOUNT_FILE` (file path) for local development.

---

## Google OAuth

| Variable Name | Required | Scope | Default Value | Description | Where to Use |
|--------------|----------|-------|---------------|-------------|--------------|
| `GOOGLE_OAUTH_ENCRYPTION_KEY` | ⚠️ Optional | Server | - | 64-character hex string for OAuth encryption | Vercel |
| `GOOGLE_CLIENT_ID` | ⚠️ Optional | Server | - | Google OAuth client ID | Vercel |
| `GOOGLE_CLIENT_SECRET` | ⚠️ Optional | Server | - | Google OAuth client secret | Vercel |
| `GOOGLE_REDIRECT_URI` | ⚠️ Optional | Server | - | OAuth redirect URI (e.g., `https://your-app.vercel.app/api/auth/google/callback`) | Vercel |

---

## Application Configuration

| Variable Name | Required | Scope | Default Value | Description | Where to Use |
|--------------|----------|-------|---------------|-------------|--------------|
| `NEXT_PUBLIC_API_BASE_URL` | ⚠️ Optional | Public | - | API base URL (only for legacy code paths) | Vercel, `.env.local` |
| `NEXT_PUBLIC_ACCESS_CODE` | ⚠️ Optional | Public | - | Access code for password-protected beta | Vercel, `.env.local` |

**Note:** `NEXT_PUBLIC_API_BASE_URL` is only needed for legacy task notification/auto-execution paths. Production uses same-origin API calls.

---

## Social Media APIs

| Variable Name | Required | Scope | Default Value | Description | Where to Use |
|--------------|----------|-------|---------------|-------------|--------------|
| `INSTAGRAM_ACCESS_TOKEN` | ⚠️ Optional | Server | - | Instagram API access token | Vercel |
| `TIKTOK_ACCESS_TOKEN` | ⚠️ Optional | Server | - | TikTok API access token | Vercel |
| `TWITTER_BEARER_TOKEN` | ⚠️ Optional | Server | - | Twitter/X API bearer token | Vercel |
| `LINKEDIN_ACCESS_TOKEN` | ⚠️ Optional | Server | - | LinkedIn API access token | Vercel |
| `FACEBOOK_ACCESS_TOKEN` | ⚠️ Optional | Server | - | Facebook API access token | Vercel |
| `YOUTUBE_CLIENT_ID` | ⚠️ Optional | Server | - | YouTube API client ID | Vercel |
| `YOUTUBE_CLIENT_SECRET` | ⚠️ Optional | Server | - | YouTube API client secret | Vercel |

**Note:** These are for Jamal's distribution service. Configure as you integrate each platform.

---

## Feature Flags

| Variable Name | Required | Scope | Default Value | Description | Where to Use |
|--------------|----------|-------|---------------|-------------|--------------|
| `GIORGIO_IMAGE_ENABLED` | ⚠️ Optional | Server | `false` | Enable Giorgio image generation | Vercel, `.env.local` |
| `IMAGE_PROVIDER` | ⚠️ Optional | Server | `replicate` | Image provider for Giorgio | Vercel, `.env.local` |

---

## Cron / Scheduled Tasks

| Variable Name | Required | Scope | Default Value | Description | Where to Use |
|--------------|----------|-------|---------------|-------------|--------------|
| `CRON_SECRET` | ⚠️ Optional | Server | - | Secret for cron job authentication (min 32 chars) | Vercel |
| `MORNING_MEETING_USERS` | ⚠️ Optional | Server | `public` | Comma-separated user IDs for morning meeting | Vercel |

---

## Variables to Delete (Deprecated)

These variables are **deprecated** and should be **removed** from Vercel:

| Variable Name | Reason | Replacement |
|--------------|--------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Old format | Use `SUPABASE_SECRET_KEY` |
| `SUPABASE_JWT_SECRET` | Not used | Remove |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Duplicate | Use `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `SUPABASE_PUBLISHABLE_KEY` | Duplicate | Use `SUPABASE_ANON_KEY` |
| `POSTGRES_URL` | Not used (we use Supabase client) | Remove |
| `POSTGRES_PRISMA_URL` | Not used | Remove |
| `POSTGRES_URL_NON_POOLING` | Not used | Remove |
| `POSTGRES_USER` | Not used | Remove |
| `POSTGRES_HOST` | Not used | Remove |
| `POSTGRES_PASSWORD` | Not used | Remove |
| `POSTGRES_DATABASE` | Not used | Remove |

**Note:** These Postgres variables were added by Supabase integration but are not used since we access the database through the Supabase client, not direct Postgres connections.

---

## Quick Setup Guide

### Local Development

1. **Frontend** (`frontend/.env.local`):
   ```env
   # Required
   SUPABASE_URL=https://zzxedixpbvivpsnztjsc.supabase.co
   SUPABASE_ANON_KEY=<your-key>
   SUPABASE_SECRET_KEY=<your-secret-key>
   NEXT_PUBLIC_SUPABASE_URL=https://zzxedixpbvivpsnztjsc.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-key>
   
   # Core API Keys
   ANTHROPIC_API_KEY=<your-key>
   OPENAI_API_KEY=<your-key>
   
   # Optional: Feature Providers
   KLING_API_KEY=<your-key>
   NANOBANANA_API_KEY=<your-key>
   RUNWAY_API_KEY=<your-key>
   ```

2. **Backend** (root `.env`):
   ```env
   PORT=4000
   NODE_ENV=development
   SUPABASE_URL=<your-url>
   SUPABASE_ANON_KEY=<your-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-key> # Legacy, still works
   ```

### Vercel Production

1. Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**
2. Set all required variables for **Production + Preview + Development**
3. ⚠️ **CRITICAL**: Ensure `SUPABASE_SECRET_KEY` is set for **ALL** environments
4. Delete deprecated variables listed above

---

## Environment Scoping

### Public Variables (`NEXT_PUBLIC_*`)
- Exposed to the browser
- Safe for public keys only
- Used in client-side code

### Server Variables (no prefix)
- Private, server-side only
- Never exposed to browser
- Used in API routes and server components

### Vercel Environment Selection
- **Production**: Production deployments only
- **Preview**: Preview deployments (PRs, branches)
- **Development**: Local development (`vercel dev`)

**⚠️ IMPORTANT:** Critical variables like `SUPABASE_SECRET_KEY` should be set for **ALL** environments (Production + Preview + Development).

---

## Verification Checklist

After setting environment variables:

- [ ] All required variables are set
- [ ] `SUPABASE_SECRET_KEY` is set for **ALL** Vercel environments
- [ ] `NEXT_PUBLIC_APP_URL` matches your actual Vercel deployment URL
- [ ] `CORS_ORIGINS` includes your Vercel URL and any custom domains
- [ ] Deprecated variables have been deleted
- [ ] Optional variables are set only if using those features
- [ ] Test file upload: `curl -X POST https://your-app.vercel.app/api/upload -F "files=@test.jpg"`

---

## Troubleshooting

### File Uploads Fail
- **Error: "Storage not configured"** → Add `SUPABASE_SECRET_KEY` to all environments
- **Error: "Bucket not found"** → Create `user-uploads` bucket in Supabase Dashboard

### Preview Deployments Fail
- **Error: Missing environment variable** → Ensure `SUPABASE_SECRET_KEY` is set for Preview environment

### CORS Errors
- **Error: CORS blocked** → Add your domain to `CORS_ORIGINS` and ensure `NEXT_PUBLIC_APP_URL` is correct

### Provider Not Working
- **Video generation fails** → Ensure at least one video provider key (`KLING_API_KEY` or `RUNWAY_API_KEY`) is set
- **Image generation fails** → Ensure `REPLICATE_API_TOKEN` is set if using Stable Diffusion
- **TTS fails** → Ensure `OPENAI_API_KEY` or `ELEVENLABS_API_KEY` is set based on `TTS_PROVIDER`

---

## Related Documentation

- `VERCEL_ENV_CHECKLIST.md` - Detailed checklist for Vercel setup
- `VERCEL_ENV_VARS.md` - Simplified Vercel reference
- `docs/NANOBANANA_PRO_INTEGRATION.md` - NanoBanana setup guide
- `docs/KLING_AI_INTEGRATION.md` - Kling AI setup guide
- `frontend/env.example` - Frontend environment template
- `env.example` - Backend environment template

---

**Last Updated:** 2026-01-08  
**Maintained By:** SkyRas Development Team
