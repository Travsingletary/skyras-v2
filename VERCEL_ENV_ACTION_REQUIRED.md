# Vercel Environment Variables - Action Required

## 🔍 Current Status Analysis

Based on the current Vercel environment variables, here's what needs to be fixed:

### ✅ Already Set (Good)
- `OPENAI_API_KEY` - Set for all environments ✓
- `CORS_ORIGINS` - Set for all environments ✓
- `NEXT_PUBLIC_APP_URL` - Set for all environments ✓
- `TTS_PROVIDER` - Set for all environments ✓
- `ELEVENLABS_API_KEY` - Set for all environments ✓
- `RUNWAY_API_KEY` - Set for all environments ✓
- `SUPABASE_SECRET_KEY` - ⚠️ **ONLY Production + Preview** (MISSING Development!)

### ❌ Missing Variables (Need to Add)

These critical variables are missing and need to be added:

1. **`SUPABASE_URL`** - Required for backend operations
2. **`SUPABASE_ANON_KEY`** - Required for backend operations
3. **`NEXT_PUBLIC_SUPABASE_URL`** - Required for frontend
4. **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** - Required for frontend
5. **`DEFAULT_STORAGE_PROVIDER`** - Should be `supabase`
6. **`SIGNED_URL_DEFAULT_EXPIRY`** - Should be `3600`
7. **`RBAC_ENFORCE`** - Should be `true`
8. **`TTS_DEFAULT_VOICE`** - Should be `nova`
9. **`TTS_DEFAULT_SPEED`** - Should be `1.0`
10. **`IMAGE_STORAGE_BUCKET`** - Should be `generated-images`
11. **`IMAGE_PROVIDER_PRIORITY`** - Should be `runway,stable-diffusion`
12. **`IMAGE_PROVIDER_NAME`** - Should be `replicate-stable-diffusion`
13. **`IMAGE_PROVIDER_BASE_URL`** - Should be `https://api.replicate.com/v1`
14. **`REPLICATE_MODEL_ID`** - Should be `stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b`
15. **`RUNWAY_API_BASE_URL`** - Should be `https://api.dev.runwayml.com`
16. **`RUNWAY_API_VERSION`** - Should be `2024-11-06`
17. **`ANTHROPIC_API_KEY`** - Your Anthropic API key (if not already set)

### 🗑️ Variables to Delete (Redundant)

These variables are redundant and should be deleted:

1. **`SUPABASE_SERVICE_ROLE_KEY`** - Old format, replaced by `SUPABASE_SECRET_KEY`
2. **`SUPABASE_JWT_SECRET`** - Not used by the app
3. **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`** - Duplicate of `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **`SUPABASE_PUBLISHABLE_KEY`** - Duplicate of `SUPABASE_ANON_KEY`
5. **`POSTGRES_URL`** - Not used (we use Supabase client)
6. **`POSTGRES_PRISMA_URL`** - Not used
7. **`POSTGRES_URL_NON_POOLING`** - Not used
8. **`POSTGRES_PASSWORD`** - Not used

### ⚠️ Critical Fix Required

**`SUPABASE_SECRET_KEY`** is missing from the **Development** environment!

This will cause preview deployments to fail. You need to:
1. Go to Vercel Dashboard → Environment Variables
2. Find `SUPABASE_SECRET_KEY`
3. Edit it
4. Check the box for **Development** environment
5. Save

## 📋 Quick Fix Commands

### Fix SUPABASE_SECRET_KEY for Development

```bash
cd /Users/user/Sites/skyras-v2
vercel env add SUPABASE_SECRET_KEY development
# When prompted, paste: sb_secret_a_N4Wj4CLe2bFqgMbLIIJg_gSab7Wwy
```

### Add Missing Variables

Run this script to add all missing variables:
```bash
cd /Users/user/Sites/skyras-v2
node scripts/set-vercel-env.mjs
```

Or add them manually one by one:
```bash
# Supabase Backend
vercel env add SUPABASE_URL production preview development
# Paste: https://zzxedixpbvivpsnztjsc.supabase.co

vercel env add SUPABASE_ANON_KEY production preview development
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6eGVkaXhwYnZpdnBzbnp0anNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzODkyMTksImV4cCI6MjA3ODk2NTIxOX0.xDUS_lPMxQvI-J1ZaafWOhaAhqwRW-whr-PrYFQh1RQ

# Supabase Frontend
vercel env add NEXT_PUBLIC_SUPABASE_URL production preview development
# Paste: https://zzxedixpbvivpsnztjsc.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production preview development
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6eGVkaXhwYnZpdnBzbnp0anNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzODkyMTksImV4cCI6MjA3ODk2NTIxOX0.xDUS_lPMxQvI-J1ZaafWOhaAhqwRW-whr-PrYFQh1RQ

# Storage
vercel env add DEFAULT_STORAGE_PROVIDER production preview development
# Paste: supabase

vercel env add SIGNED_URL_DEFAULT_EXPIRY production preview development
# Paste: 3600

# RBAC
vercel env add RBAC_ENFORCE production preview development
# Paste: true
```

### Delete Redundant Variables

You'll need to delete these in the Vercel Dashboard:
https://vercel.com/travis-singletarys-projects/skyras-v2/settings/environment-variables

Or use the CLI (if supported):
```bash
vercel env rm SUPABASE_SERVICE_ROLE_KEY
vercel env rm SUPABASE_JWT_SECRET
vercel env rm NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
vercel env rm SUPABASE_PUBLISHABLE_KEY
vercel env rm POSTGRES_URL
vercel env rm POSTGRES_PRISMA_URL
vercel env rm POSTGRES_URL_NON_POOLING
vercel env rm POSTGRES_PASSWORD
```

## 🎯 Priority Order

1. **URGENT**: Fix `SUPABASE_SECRET_KEY` - Add to Development environment
2. **HIGH**: Add missing Supabase variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, etc.)
3. **MEDIUM**: Add storage and RBAC variables
4. **LOW**: Add image generation variables (if using those features)
5. **CLEANUP**: Delete redundant variables

## ✅ Verification

After making changes, verify:

```bash
vercel env ls
```

Check that:
- ✅ `SUPABASE_SECRET_KEY` is in all 3 environments
- ✅ All required Supabase variables are present
- ✅ Redundant variables are deleted
- ✅ All variables are set for Production + Preview + Development

## 📝 Summary

**Current State:**
- 15 variables currently set
- 1 critical issue: `SUPABASE_SECRET_KEY` missing from Development
- ~17 variables need to be added
- 8 variables should be deleted

**After Fix:**
- ~24 variables total (clean and complete)
- All required variables set for all environments
- No redundant variables


