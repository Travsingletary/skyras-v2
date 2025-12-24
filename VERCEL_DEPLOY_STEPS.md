# Vercel Deployment - Exact Steps

## ✅ Configuration Ready

Your Vercel dashboard settings should be:
- **Root Directory**: `frontend`
- **Framework**: `nextjs` (auto-detected)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

## Step-by-Step Vercel Deployment

### Step 1: Go to Vercel
1. Open https://vercel.com
2. Sign in with GitHub (if not already)

### Step 2: Create New Project
1. Click **"Add New..."** button (top right)
2. Click **"Project"**

### Step 3: Import Repository
1. Find **"Travsingletary/skyras-v2"** in the list
2. Click **"Import"** next to it

### Step 4: Configure Project Settings

**Framework Preset:**
- Should auto-detect **"Next.js"** ✅
- If not, select "Next.js" manually

**Root Directory:**
- ⚠️ **CRITICAL:** Click **"Edit"** next to "Root Directory"
- Type: `frontend`
- Click **"Continue"**

**Build and Output Settings:**
- **Build Command**: Should show `npm run build` (leave as is)
- **Output Directory**: Should show `.next` (leave as is)
- **Install Command**: Should show `npm install` (leave as is)

**Environment Variables:**
Click **"Add"** and add these 4 variables:

```
Key: NEXT_PUBLIC_API_BASE_URL
Value: https://your-railway-backend-url.up.railway.app
```

```
Key: NEXT_PUBLIC_ACCESS_CODE
Value: PICOSQUAD2025
```

```
Key: SUPABASE_URL
Value: https://zzxedixpbvivpsnztjsc.supabase.co
```

```
Key: SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6eGVkaXhwYnZpdnBzbnp0anNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzODkyMTksImV4cCI6MjA3ODk2NTIxOX0.xDUS_lPMxQvI-J1ZaafWOhaAhqwRW-whr-PrYFQh1RQ
```

### Step 5: Deploy
1. Click **"Deploy"** button
2. Wait 2-3 minutes for build
3. Watch build logs - should see:
   - "Installing dependencies..."
   - "Building..."
   - "Build Completed"
   - "Deployment ready"

### Step 6: Get Your URL
Once deployed, you'll see:
- `https://skyras-v2.vercel.app`
- OR `https://skyras-v2-xxxx.vercel.app`
- OR your custom domain

**This is your shareable link!**

## ✅ Verification

After deployment:

1. **Test Landing Page:**
   - Visit: `https://your-app.vercel.app/`
   - Should see "Marcus · Your AI PM for Content & Marketing"

2. **Test Access Code:**
   - Visit: `https://your-app.vercel.app/app`
   - Enter: `PICOSQUAD2025`
   - Should access chat

3. **Test Backend Connection:**
   - Open DevTools → Network tab
   - Send a message in chat
   - Should see requests to: `https://skyras-backend.onrender.com/api/chat`

## Build Verification

✅ **Local build test passed:**
- All 18 routes generated successfully
- Static pages: `/`, `/app`, `/dashboard`, `/guide`, `/studio`
- API routes: `/api/chat`, `/api/upload`, etc.
- No TypeScript errors
- No build errors

Your frontend is ready for production deployment!

