# Vercel Clean Import - Step-by-Step

## Step 1: Start Fresh Import

1. **Open a new browser tab/window**
2. **Go to:** https://vercel.com/new
   - This is the clean import URL (no query params)
3. **Sign in** with GitHub if prompted

## Step 2: Select Repository

1. You'll see "Import Git Repository"
2. If you haven't connected GitHub:
   - Click **"Connect GitHub Account"**
   - Authorize Vercel
3. **Find and select:** `Travsingletary/skyras-v2`
4. Click **"Import"** button

## Step 3: Monorepo Detection

Vercel will detect this is a monorepo and show:

**"Which directory contains your code?"**

1. **Select:** `frontend` from the dropdown
2. Click **"Continue"**

## Step 4: Framework Detection

Vercel will auto-detect:
- **Framework Preset:** `Next.js` ✅
- **Build Command:** `npm run build` ✅
- **Output Directory:** `.next` ✅
- **Install Command:** `npm install` ✅

**Verify these are correct, then click "Continue"**

## Step 5: Environment Variables (BEFORE DEPLOYING)

**⚠️ IMPORTANT: Add these BEFORE clicking Deploy**

Click **"Add"** and add these 4 environment variables:

### Variable 1:
```
Key: NEXT_PUBLIC_API_BASE_URL
Value: https://skyras-backend.onrender.com
```

### Variable 2:
```
Key: NEXT_PUBLIC_ACCESS_CODE
Value: PICOSQUAD2025
```

### Variable 3:
```
Key: SUPABASE_URL
Value: https://zzxedixpbvivpsnztjsc.supabase.co
```

### Variable 4:
```
Key: SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6eGVkaXhwYnZpdnBzbnp0anNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzODkyMTksImV4cCI6MjA3ODk2NTIxOX0.xDUS_lPMxQvI-J1ZaafWOhaAhqwRW-whr-PrYFQh1RQ
```

**After adding all 4, verify they're listed correctly.**

## Step 6: Project Name (Optional)

- **Project Name:** `skyras-v2` (or leave default)
- **Team:** Select your team/personal account

## Step 7: Deploy

1. **Review settings:**
   - Root Directory: `frontend` ✅
   - Framework: `Next.js` ✅
   - Build Command: `npm run build` ✅
   - Environment Variables: 4 added ✅

2. Click **"Deploy"** button

3. **Watch the build:**
   - "Installing dependencies..." (30-60 seconds)
   - "Building..." (1-2 minutes)
   - "Build Completed" ✅
   - "Deployment ready" ✅

## Step 8: Get Your URL

Once deployment completes, you'll see:
- **Deployment URL:** `https://skyras-v2.vercel.app`
- OR `https://skyras-v2-xxxx.vercel.app`
- OR your custom domain

**Copy this URL - this is your shareable link!**

## ✅ Verification Checklist

After deployment, test:

- [ ] Landing page loads: `https://your-app.vercel.app/`
- [ ] Access code works: `https://your-app.vercel.app/app` (enter `PICOSQUAD2025`)
- [ ] Chat connects to backend (check Network tab)
- [ ] Dashboard loads: `https://your-app.vercel.app/dashboard`
- [ ] Guide page loads: `https://your-app.vercel.app/guide`

## Troubleshooting

**If monorepo prompt doesn't appear:**
- Vercel should auto-detect `frontend/` from `vercel.json`
- If not, manually set Root Directory to `frontend` in project settings

**If build fails:**
- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Ensure `frontend/package.json` exists

**If framework not detected:**
- Manually select "Next.js" from framework dropdown
- Settings should auto-populate

---

## Quick Reference

**Clean Import URL:** https://vercel.com/new

**Repository:** `Travsingletary/skyras-v2`

**Root Directory:** `frontend`

**Environment Variables:**
1. `NEXT_PUBLIC_API_BASE_URL=https://skyras-backend.onrender.com`
2. `NEXT_PUBLIC_ACCESS_CODE=PICOSQUAD2025`
3. `SUPABASE_URL=...`
4. `SUPABASE_ANON_KEY=...`

