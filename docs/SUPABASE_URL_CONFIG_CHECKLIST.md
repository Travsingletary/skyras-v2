# Supabase URL Configuration Checklist

**Date:** 2025-01-28  
**Purpose:** Manual configuration steps for email confirmation fix

---

## 🔧 Supabase Dashboard Configuration

### Step 1: Navigate to URL Configuration

1. Go to: https://supabase.com/dashboard/project/zzxedixpbvivpsnztjsc/auth/url-configuration
2. Or: Dashboard → Authentication → URL Configuration

---

### Step 2: Set Site URL

**Site URL:**
```
https://skyras-v2.vercel.app
```

✅ Click "Save"

---

### Step 3: Add Redirect URLs

**Redirect URLs** (add one per line):

```
https://skyras-v2.vercel.app/auth/callback
https://skyras-v2.vercel.app/**
http://localhost:3000/auth/callback
http://localhost:3000/**
```

**Important:**
- Each URL on a separate line
- Include both `/auth/callback` and `/**` patterns
- Include both production and localhost for development

✅ Click "Save"

---

## ✅ Verification

After saving, verify:
- [ ] Site URL is set to production domain
- [ ] All redirect URLs are listed
- [ ] No typos in URLs
- [ ] Both production and localhost included

---

## 🔍 Vercel Environment Variables Check

**Verify these match the Supabase project:**

1. Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

2. Verify these variables:
   ```
   NEXT_PUBLIC_APP_URL=https://skyras-v2.vercel.app
   NEXT_PUBLIC_SUPABASE_URL=https://zzxedixpbvivpsnztjsc.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_URL=https://zzxedixpbvivpsnztjsc.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. Check:
   - [ ] All variables present
   - [ ] Values match project `zzxedixpbvivpsnztjsc`
   - [ ] Set for: Production ✅ Preview ✅ Development ✅

---

**Last Updated:** 2025-01-28