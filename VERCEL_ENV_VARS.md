# Vercel Environment Variables - Simplified Reference

## TL;DR - What You Need to Do

**One required fix:**
1. Edit `SUPABASE_SECRET_KEY` → Add to Preview and Development environments

**Optional cleanup (removes 11 redundant variables):**
1. Delete 4 duplicate Supabase variables
2. Delete 7 unused Postgres variables

That's it. Everything else is already configured correctly.

---

## Required Variables (Add/Keep These)

Copy these exact values into Vercel Dashboard → Settings → Environment Variables.
Set all variables for: Production + Preview + Development

### Supabase Configuration
```
SUPABASE_URL=https://zzxedixpbvivpsnztjsc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6eGVkaXhwYnZpdnBzbnp0anNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzODkyMTksImV4cCI6MjA3ODk2NTIxOX0.xDUS_lPMxQvI-J1ZaafWOhaAhqwRW-whr-PrYFQh1RQ
SUPABASE_SECRET_KEY=sb_secret_a_N4Wj4CLe2bFqgMbLIIJg_gSab7Wwy

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

### TTS (Text-to-Speech) Configuration
```
# Provider: openai (default, cost-effective) | elevenlabs (premium)
TTS_PROVIDER=openai
TTS_DEFAULT_VOICE=nova
TTS_DEFAULT_SPEED=1.0
```

## Optional Variables (Keep If You Use Them)

```
ANTHROPIC_API_KEY=<your-key-if-you-use-Claude-API>
OPENAI_API_KEY=<your-key-for-openai-tts> # Falls back to ANTHROPIC_API_KEY if not set
ELEVENLABS_API_KEY=<your-key-for-premium-tts> # Only needed if using ElevenLabs
NEXT_PUBLIC_ACCESS_CODE=<if-you-have-password-protection>
NEXT_PUBLIC_API_BASE_URL=<if-you-need-custom-API-base>
```

## Variables to DELETE from Vercel (Cleanup)

Based on your current Vercel environment variables, you can safely delete these:

### Redundant Supabase Variables (from integration)
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - duplicate of NEXT_PUBLIC_SUPABASE_ANON_KEY
- `SUPABASE_PUBLISHABLE_KEY` - duplicate of SUPABASE_ANON_KEY
- `SUPABASE_SERVICE_ROLE_KEY` - old format, replaced by SUPABASE_SECRET_KEY
- `SUPABASE_JWT_SECRET` - not used by the app

### Postgres Variables (not used - we use Supabase client)
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

**Note:** These Postgres variables were added by the Supabase integration but we access the database through the Supabase client, not direct Postgres connections. Safe to remove unless you have other services using them.

## The Critical Issue

**SUPABASE_SECRET_KEY exists but is only in Production environment.**

Preview deployments fail because the variable is missing from Preview/Development.

## One-Time Action Required

In Vercel Dashboard:

1. Find the existing `SUPABASE_SECRET_KEY` variable
2. Click the three dots (...) → Edit
3. Check the boxes for **Preview** and **Development** (Production is already checked)
4. Click "Save"
5. Vercel will auto-redeploy

That's it. No other changes needed.

## Why This One Variable Matters

Without `SUPABASE_SECRET_KEY`, the server cannot:
- Upload files to private buckets
- Generate signed URLs
- Access storage with elevated permissions

The code already checks for this variable (commit e6511a3), it just needs the value in Vercel.

## Testing After Adding Variable

Once you add `SUPABASE_SECRET_KEY` and Vercel redeploys:

```bash
# Test production upload
curl -X POST https://skyras-v2-frontend-app.vercel.app/api/upload \
  -F "files=@test.jpg" \
  -F "userId=test-user-123"

# Should return: {"success":true,"data":{...}}
```

## Current Status

- ✅ Code supports new Supabase key format (commit e6511a3)
- ✅ Local uploads work perfectly
- ✅ RBAC implemented and tested locally
- ✅ Git deployed to main branch
- ✅ SUPABASE_SECRET_KEY exists in Production
- ❌ SUPABASE_SECRET_KEY missing from Preview/Development (preview deployments fail)
- ⏳ After fixing environment scope, everything will work

## Summary

You have 22 environment variables in Vercel. After cleanup you'll have 11.

**Must fix:** 1 variable scope issue
**Can clean up:** 11 redundant variables
**Already correct:** 10 variables

The app is fully ready - just needs the one environment scope fix.
