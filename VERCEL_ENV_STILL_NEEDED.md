# Vercel Environment Variables - What's Still Needed

## ✅ What's Already Set (Good!)

Based on the latest check, these are already configured:

### Supabase Variables ✓
- ✅ `SUPABASE_URL` - Set for all environments
- ✅ `SUPABASE_ANON_KEY` - Set for all environments  
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Set for all environments
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Set for all environments

### Image Generation Variables ✓
- ✅ `IMAGE_STORAGE_BUCKET` - Set for all environments
- ✅ `IMAGE_PROVIDER_PRIORITY` - Set for all environments
- ✅ `IMAGE_PROVIDER_NAME` - Set for all environments
- ✅ `IMAGE_PROVIDER_BASE_URL` - Set for all environments
- ✅ `REPLICATE_MODEL_ID` - Set for all environments
- ✅ `RUNWAY_API_BASE_URL` - Set for all environments
- ✅ `RUNWAY_API_VERSION` - Set for all environments

### API Keys ✓
- ✅ `ANTHROPIC_API_KEY` - Set for all environments
- ✅ `OPENAI_API_KEY` - Set for all environments
- ✅ `ELEVENLABS_API_KEY` - Set for all environments
- ✅ `RUNWAY_API_KEY` - Set for all environments

### App Configuration ✓
- ✅ `CORS_ORIGINS` - Set for all environments
- ✅ `NEXT_PUBLIC_APP_URL` - Set for all environments
- ✅ `TTS_PROVIDER` - Set for all environments

---

## ❌ What's Still Missing

### Critical (Must Fix)

1. **`SUPABASE_SECRET_KEY`** - ⚠️ **MISSING from Development environment!**
   - Currently only set for: Production, Preview
   - **This will cause preview deployments to fail**
   - **Fix:** Add to Development environment

### Storage & Configuration (Should Add)

2. **`DEFAULT_STORAGE_PROVIDER`** - Should be `supabase`
3. **`SIGNED_URL_DEFAULT_EXPIRY`** - Should be `3600`
4. **`RBAC_ENFORCE`** - Should be `true`

### TTS Configuration (Optional but Recommended)

5. **`TTS_DEFAULT_VOICE`** - Should be `nova`
6. **`TTS_DEFAULT_SPEED`** - Should be `1.0`

---

## 🗑️ Variables to Delete (Cleanup)

These redundant variables should be removed:

1. **`SUPABASE_SERVICE_ROLE_KEY`** - Old format, replaced by `SUPABASE_SECRET_KEY`
2. **`SUPABASE_JWT_SECRET`** - Not used by the app
3. **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`** - Duplicate
4. **`SUPABASE_PUBLISHABLE_KEY`** - Duplicate
5. **`POSTGRES_URL`** - Not used (we use Supabase client)
6. **`POSTGRES_PRISMA_URL`** - Not used
7. **`POSTGRES_URL_NON_POOLING`** - Not used
8. **`POSTGRES_PASSWORD`** - Not used

---

## 🚨 Priority Actions

### 1. URGENT: Fix SUPABASE_SECRET_KEY (30 seconds)

```bash
cd /Users/user/Sites/skyras-v2
vercel env add SUPABASE_SECRET_KEY development
# When prompted, paste: sb_secret_a_N4Wj4CLe2bFqgMbLIIJg_gSab7Wwy
```

### 2. Add Missing Configuration Variables

```bash
# Storage
vercel env add DEFAULT_STORAGE_PROVIDER production preview development
# Paste: supabase

vercel env add SIGNED_URL_DEFAULT_EXPIRY production preview development
# Paste: 3600

# RBAC
vercel env add RBAC_ENFORCE production preview development
# Paste: true

# TTS (optional)
vercel env add TTS_DEFAULT_VOICE production preview development
# Paste: nova

vercel env add TTS_DEFAULT_SPEED production preview development
# Paste: 1.0
```

### 3. Cleanup Redundant Variables

Delete these in the Vercel Dashboard:
https://vercel.com/travis-singletarys-projects/skyras-v2/settings/environment-variables

Or use CLI:
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

---

## 📊 Summary

**Current Status:**
- ✅ ~20 variables correctly set
- ❌ 1 critical issue: `SUPABASE_SECRET_KEY` missing from Development
- ❌ 5 configuration variables missing (non-critical but recommended)
- 🗑️ 8 redundant variables to delete

**After Fix:**
- ✅ All required variables set for all environments
- ✅ Clean environment with no redundant variables
- ✅ Preview deployments will work correctly

---

## ✅ Verification

After making changes, verify:

```bash
vercel env ls
```

Check that:
- ✅ `SUPABASE_SECRET_KEY` appears in all 3 environments (Production, Preview, Development)
- ✅ All missing variables are now present
- ✅ Redundant variables are deleted


