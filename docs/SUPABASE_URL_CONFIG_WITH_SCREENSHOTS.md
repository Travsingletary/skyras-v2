# Supabase URL Configuration - Step-by-Step Guide

**Date:** 2025-01-28  
**Project:** zzxedixpbvivpsnztjsc  
**Purpose:** Configure email confirmation redirect URLs

---

## Step 1: Navigate to URL Configuration

1. Go to: https://supabase.com/dashboard/project/zzxedixpbvivpsnztjsc/auth/url-configuration
2. Or navigate: Dashboard → Project → Authentication → URL Configuration

**Note:** You may need to sign in to Supabase first.

---

## Step 2: Set Site URL

**Find the "Site URL" field and set it to:**
```
https://skyras-v2.vercel.app
```

**Screenshot Required:** Capture the Site URL field showing `https://skyras-v2.vercel.app`

---

## Step 3: Add Redirect URLs

**Find the "Redirect URLs" text area and add these URLs (one per line):**

```
https://skyras-v2.vercel.app/auth/callback
https://skyras-v2.vercel.app/**
http://localhost:3000/auth/callback
http://localhost:3000/**
```

**Important:**
- Each URL must be on a separate line
- Include all 4 URLs exactly as shown above
- Make sure there are no extra spaces or characters

**Screenshot Required:** Capture the Redirect URLs list showing all 4 entries

---

## Step 4: Save Configuration

1. Click the "Save" button
2. Wait for confirmation that settings are saved

---

## Step 5: Verify Configuration

After saving, verify:
- [ ] Site URL shows: `https://skyras-v2.vercel.app`
- [ ] Redirect URLs list contains all 4 URLs:
  - `https://skyras-v2.vercel.app/auth/callback`
  - `https://skyras-v2.vercel.app/**`
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/**`

---

## Screenshots Checklist

**Required Screenshots:**
- [ ] Screenshot 1: Site URL field showing `https://skyras-v2.vercel.app`
- [ ] Screenshot 2: Redirect URLs list showing all 4 entries

**How to take screenshots:**
- Use browser screenshot tool (Cmd+Shift+4 on Mac, or browser dev tools)
- Or use the browser's built-in screenshot feature
- Make sure the entire configuration section is visible

---

**Last Updated:** 2025-01-28