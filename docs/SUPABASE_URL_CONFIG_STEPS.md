# Supabase URL Configuration - Manual Steps

**Date:** 2025-01-28  
**Purpose:** Configure email confirmation redirect URLs

---

## Step 1: Navigate to URL Configuration

1. Go to: https://supabase.com/dashboard/project/zzxedixpbvivpsnztjsc/auth/url-configuration
2. Or: Dashboard → Authentication → URL Configuration

**Note:** You may need to sign in to Supabase first.

---

## Step 2: Set Site URL

**Site URL:**
```
https://skyras-v2.vercel.app
```

✅ Click "Save" after setting

---

## Step 3: Add Redirect URLs

**Redirect URLs** (add one per line in the text area):

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

✅ Click "Save" after adding all URLs

---

## Step 4: Verify Configuration

After saving, verify:
- [ ] Site URL is set to `https://skyras-v2.vercel.app`
- [ ] All 4 redirect URLs are listed
- [ ] No typos in URLs
- [ ] Both production and localhost included

---

## Screenshot Checklist

After configuration, capture:
- [ ] Screenshot of Site URL field showing `https://skyras-v2.vercel.app`
- [ ] Screenshot of Redirect URLs list showing all 4 URLs

---

**Last Updated:** 2025-01-28