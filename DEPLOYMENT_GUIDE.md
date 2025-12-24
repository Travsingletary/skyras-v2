# SkyRas v2 - Friends Beta Deployment Guide

## Pre-Deployment Checklist

### ✅ Before You Start

1. **Commit all changes to Git**
   ```bash
   cd /Users/user/Projects/skyras-v2
   git add .
   git commit -m "Prepare for friends beta deployment"
   git push origin main
   ```

2. **Verify environment variables are ready** (see Environment Variables section below)

3. **Test locally** - Make sure everything works on localhost first

---

## PART 1: BACKEND DEPLOYMENT (Render)

### Step 1: Prepare Repository

Your backend code is already in the root of the repository. No special packaging needed - Render will deploy from the repo root.

### Step 2: Create Render Web Service

1. Go to https://render.com
2. Sign up/login with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect your GitHub repository
5. Select your repository

### Step 3: Configure Render Service

**Basic Settings:**
- **Name**: `skyras-backend` (or your choice)
- **Environment**: `Node`
- **Region**: Choose closest to you
- **Branch**: `main` (or your default branch)

**Build & Deploy:**
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Free (or paid for always-on)

**Environment Variables** (Add these in Render dashboard):
```
PORT=4000
NODE_ENV=production
OPENAI_API_KEY=sk-proj-...your-key...
SUPABASE_URL=https://zzxedixpbvivpsnztjsc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
RBAC_ENFORCE=false
ELEVENLABS_API_KEY=your-elevenlabs-key-if-needed
```

**Important Notes:**
- Render free tier services **sleep after 15 minutes** of inactivity
- First request after sleep takes ~30 seconds (cold start)
- Consider upgrading to paid ($7/month) for always-on

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Wait for build and deployment (usually 2-5 minutes)
3. Note your service URL: `https://skyras-backend.onrender.com` (or similar)

### Step 5: Verify Backend

```bash
# Test health endpoint
curl https://your-backend-url.onrender.com/health

# Should return:
# {"status":"ok","message":"SkyRas v2 Backend running"}
```

**Save this URL** - you'll need it for frontend configuration.

---

## PART 2: FRONTEND DEPLOYMENT (Vercel)

### Step 1: Prepare Repository

Your frontend is in the `frontend/` directory. Vercel will deploy from there.

### Step 2: Create Vercel Project

1. Go to https://vercel.com
2. Sign up/login with GitHub
3. Click **"Add New..."** → **"Project"**
4. Import your GitHub repository

### Step 3: Configure Vercel Project

**Project Settings:**
- **Framework Preset**: `Next.js` (auto-detected)
- **Root Directory**: `frontend` ⚠️ **IMPORTANT: Set this!**
- **Build Command**: `npm run build` (default)
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install` (default)

**Environment Variables** (Add these in Vercel dashboard):
```
   NEXT_PUBLIC_API_BASE_URL=https://your-railway-backend-url.up.railway.app
NEXT_PUBLIC_ACCESS_CODE=PICOSQUAD2025
SUPABASE_URL=https://zzxedixpbvivpsnztjsc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
RBAC_ENFORCE=false
```

### Storage Bucket (Supabase)

- Bucket name: `user-uploads`
- **Private**: `true` (recommended)
- If private, you must have storage policies that allow uploads and reads (or rely on signed URLs).

### RBAC (Week 1)

- DB migration: `frontend/supabase/migrations/0005_rbac_week1_foundation.sql`
- Enforcement is **feature-flagged** via `RBAC_ENFORCE=true` (server-side). Keep `false` until you assign roles to your `userId` values.

**Optional (for studio features):**
```
IMAGE_STORAGE_BUCKET=generated-images
IMAGE_PROVIDER_NAME=replicate-sdxl
IMAGE_PROVIDER_BASE_URL=https://api.replicate.com/v1
REPLICATE_MODEL_ID=your-model-id
REPLICATE_API_TOKEN=your-replicate-token
```

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for build and deployment (usually 2-3 minutes)
3. Note your deployment URL: `https://skyras.vercel.app` (or your custom domain)

### Step 5: Update Backend URL (if needed)

If you need to change `NEXT_PUBLIC_API_BASE_URL` after deployment:
1. Go to Vercel dashboard → Your project → Settings → Environment Variables
2. Update `NEXT_PUBLIC_API_BASE_URL` to your Render backend URL
3. Redeploy (Vercel auto-redeploys on env var changes)

---

## PART 3: POST-DEPLOYMENT VALIDATION

### Test Checklist

#### ✅ Landing Page
- [ ] Visit `https://your-app.vercel.app/`
- [ ] Page loads correctly
- [ ] All sections visible (Hero, How It Works, Who It's For, Friends Beta)
- [ ] Links work (Open Marcus, How it works, Dashboard)

#### ✅ Access Code Gate
- [ ] Visit `https://your-app.vercel.app/app`
- [ ] Access code screen appears
- [ ] Enter `PICOSQUAD2025`
- [ ] Access granted, chat interface loads

#### ✅ Marcus Chat
- [ ] Send first message
- [ ] Onboarding starts (5 questions)
- [ ] Answer all questions
- [ ] Workflow proposals appear
- [ ] Select a workflow
- [ ] Full workflow structure displayed

#### ✅ Backend Connection
- [ ] Open browser DevTools → Network tab
- [ ] Send a message in chat
- [ ] Verify request goes to: `https://your-railway-backend-url.up.railway.app/api/chat`
- [ ] Response received successfully

#### ✅ Supabase Integration
- [ ] Complete onboarding
- [ ] Check Supabase dashboard → `conversations` table
- [ ] Verify new row created with `workflow` JSONB
- [ ] Check `messages` table for chat messages

#### ✅ Dashboard
- [ ] Visit `https://your-app.vercel.app/dashboard`
- [ ] Workflows list loads
- [ ] Click workflow to see details
- [ ] Weekly structure and task breakdown visible

#### ✅ Guide Page
- [ ] Visit `https://your-app.vercel.app/guide`
- [ ] Page loads with tutorial content
- [ ] Links work correctly

### Final URLs

After successful deployment, you'll have:

- **Landing Page**: `https://your-app.vercel.app/`
- **Marcus Chat**: `https://your-app.vercel.app/app`
- **Dashboard**: `https://your-app.vercel.app/dashboard`
- **Guide**: `https://your-app.vercel.app/guide`
- **Studio**: `https://your-app.vercel.app/studio`

**Share this link with friends:**
```
https://your-app.vercel.app/
```

They'll need the access code: `PICOSQUAD2025`

---

## ENVIRONMENT VARIABLES CHECKLIST

### Backend (Render)

**Required:**
- [ ] `PORT=4000`
- [ ] `NODE_ENV=production`
- [ ] `OPENAI_API_KEY=sk-proj-...`
- [ ] `SUPABASE_URL=https://...supabase.co`
- [ ] `SUPABASE_ANON_KEY=eyJ...`
- [ ] `SUPABASE_SERVICE_ROLE_KEY=eyJ...` (if needed for admin operations)

**Optional:**
- [ ] `ELEVENLABS_API_KEY=...` (if using voice features)

### Frontend (Vercel)

**Required:**
- [ ] `NEXT_PUBLIC_API_BASE_URL=https://your-railway-backend-url.up.railway.app`
- [ ] `NEXT_PUBLIC_ACCESS_CODE=PICOSQUAD2025`
- [ ] `SUPABASE_URL=https://...supabase.co`
- [ ] `SUPABASE_ANON_KEY=eyJ...`

**Optional (for studio features):**
- [ ] `IMAGE_STORAGE_BUCKET=generated-images`
- [ ] `IMAGE_PROVIDER_NAME=replicate-sdxl`
- [ ] `IMAGE_PROVIDER_BASE_URL=https://api.replicate.com/v1`
- [ ] `REPLICATE_MODEL_ID=...`
- [ ] `REPLICATE_API_TOKEN=...`

---

## TROUBLESHOOTING

### Backend Issues

**Service sleeping (Render free tier):**
- First request after 15min inactivity takes ~30s
- Consider upgrading to paid tier for always-on
- Or use Railway (better free tier for always-on)

**CORS errors:**
- Backend already has `cors()` middleware enabled
- Verify frontend URL is allowed (Render auto-allows all origins by default)

**Environment variables not working:**
- Double-check all vars are set in Render dashboard
- Redeploy after adding new env vars

### Frontend Issues

**API calls failing:**
- Verify `NEXT_PUBLIC_API_BASE_URL` points to Railway backend
- Check it points to your Render backend URL (not localhost)
- Check browser console for CORS or network errors

**Build errors:**
- Check Vercel build logs
- Ensure all dependencies are in `package.json`
- Verify `frontend/` is set as root directory

**Access code not working:**
- Verify `NEXT_PUBLIC_ACCESS_CODE=PICOSQUAD2025` is set in Vercel
- Clear browser localStorage if testing

### Database Issues

**Supabase connection errors:**
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- Check Supabase dashboard for API status
- Verify RLS policies allow access (or disable RLS for dev)

**Workflows not saving:**
- Check Supabase `conversations` table has `workflow` JSONB column
- Run migration: `supabase_migration_onboarding.sql` if needed

---

## DEPLOYMENT COMMANDS

### Before Pushing to Git

```bash
# 1. Ensure all changes are committed
cd /Users/user/Projects/skyras-v2
git status

# 2. Add all files
git add .

# 3. Commit
git commit -m "Prepare for friends beta deployment"

# 4. Push to GitHub
git push origin main
```

### After Deployment

```bash
# Test backend
curl https://your-backend-url.onrender.com/health

# Test frontend
curl https://your-app.vercel.app/
```

---

## NEXT STEPS AFTER DEPLOYMENT

1. ✅ Test all URLs and functionality
2. ✅ Share landing page URL with friends
3. ✅ Share access code: `PICOSQUAD2025`
4. ✅ Monitor Render/Vercel dashboards for errors
5. ✅ Check Supabase for data being saved correctly
6. ✅ Set up basic monitoring/alerts if needed

---

## COST ESTIMATE

- **Render**: Free (with limitations) or $7/month for always-on
- **Vercel**: Free (generous limits)
- **Supabase**: Free tier (500MB database, 1GB storage)
- **Total**: $0-7/month depending on Render plan

---

## IMPORTANT NOTES

1. **Render free tier sleeps** - First request after inactivity is slow
2. **Environment variables** - Must be set in both Render and Vercel dashboards
3. **Root directory** - Vercel must have `frontend` set as root directory
4. **Access code** - Set to `PICOSQUAD2025` in Vercel env vars
5. **Backend URL** - Update `NEXT_PUBLIC_API_BASE_URL` after Railway deployment

---

## SUPPORT

If you encounter issues:
1. Check Render/Vercel build logs
2. Check browser console for errors
3. Verify all environment variables are set
4. Test backend health endpoint
5. Check Supabase dashboard for connection issues

