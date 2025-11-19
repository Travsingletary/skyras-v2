# Deploy SkyRas v2 - Step-by-Step Script

## SECTION 1: BACKEND DEPLOYMENT (Render)

### Step 1: Go to Render
1. Open https://render.com in your browser
2. Click **"Get Started"** or **"Sign In"** (use GitHub to sign in)

### Step 2: Create New Web Service
1. Once logged in, click the **"New +"** button (top right)
2. Click **"Web Service"** from the dropdown

### Step 3: Connect Repository
1. You'll see "Connect a repository"
2. Click **"Connect account"** if you haven't connected GitHub yet
3. Authorize Render to access your GitHub
4. Select your repository: `skyras-v2` (or whatever your repo is named)
5. Click **"Connect"**

### Step 4: Configure Service Settings

**Basic Settings:**
- **Name**: Type `skyras-backend` (or your choice)
- **Region**: Choose closest to you (e.g., "Oregon (US West)")
- **Branch**: Select `main` (or your default branch)
- **Root Directory**: Leave **empty** (deploy from repo root)
- **Runtime**: Select `Node`
- **Build Command**: Type `npm install`
- **Start Command**: Type `npm start`
- **Plan**: Select **"Free"** (or "Starter" for $7/month always-on)

**Environment Variables:**
Click **"Add Environment Variable"** and add these one by one:

```
Key: PORT
Value: 4000
```

```
Key: NODE_ENV
Value: production
```

```
Key: OPENAI_API_KEY
Value: sk-proj-...your-openai-key-here...
```
*(Use your actual OpenAI key from your .env file)*

```
Key: SUPABASE_URL
Value: https://zzxedixpbvivpsnztjsc.supabase.co
```

```
Key: SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6eGVkaXhwYnZpdnBzbnp0anNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzODkyMTksImV4cCI6MjA3ODk2NTIxOX0.xDUS_lPMxQvI-J1ZaafWOhaAhqwRW-whr-PrYFQh1RQ
```

```
Key: SUPABASE_SERVICE_ROLE_KEY
Value: [Your service role key from Supabase dashboard]
```

```
Key: ELEVENLABS_API_KEY
Value: [Your ElevenLabs key if you have one, or leave empty]
```

### Step 5: Deploy
1. Scroll down and click **"Create Web Service"**
2. Wait for deployment (2-5 minutes)
3. Watch the build logs - you should see:
   - "Installing dependencies..."
   - "Build successful"
   - "Your service is live"

### Step 6: Get Your Backend URL
1. Once deployed, you'll see a URL at the top like:
   - `https://skyras-backend.onrender.com`
   - OR `https://skyras-backend-xxxx.onrender.com`
2. **COPY THIS URL** - you'll need it for frontend

### Step 7: Verify Backend Health
1. Open a new browser tab
2. Go to: `https://your-backend-url.onrender.com/health`
   *(Replace with your actual URL)*
3. You should see:
   ```json
   {"status":"ok","message":"SkyRas v2 Backend running"}
   ```
4. ✅ **If you see this, backend is working!**

**Note:** If you get an error or timeout, wait 30 seconds (first request on free tier is slow) and try again.

---

## SECTION 2: FRONTEND DEPLOYMENT (Vercel)

### Step 1: Go to Vercel
1. Open https://vercel.com in your browser
2. Click **"Sign Up"** or **"Log In"** (use GitHub)

### Step 2: Create New Project
1. Once logged in, click **"Add New..."** button
2. Click **"Project"**

### Step 3: Import Repository
1. You'll see "Import Git Repository"
2. If you haven't connected GitHub, click **"Connect GitHub Account"**
3. Authorize Vercel
4. Find your repository: `skyras-v2` (or your repo name)
5. Click **"Import"** next to your repo

### Step 4: Configure Project

**Framework Preset:**
- Should auto-detect **"Next.js"** - leave it

**Root Directory:**
- ⚠️ **IMPORTANT:** Click **"Edit"** next to "Root Directory"
- Type: `frontend`
- Click **"Continue"**

**Build and Output Settings:**
- **Build Command**: Should show `npm run build` (leave as is)
- **Output Directory**: Should show `.next` (leave as is)
- **Install Command**: Should show `npm install` (leave as is)

**Environment Variables:**
Click **"Add"** and add these:

```
Key: NEXT_PUBLIC_API_BASE_URL
Value: https://your-backend-url.onrender.com
```
*(Replace with your actual Render backend URL from Section 1, Step 6)*

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
2. Wait for build (2-3 minutes)
3. Watch build logs - you should see:
   - "Installing dependencies..."
   - "Building..."
   - "Build Completed"

### Step 6: Get Your Frontend URL
1. Once deployed, you'll see:
   - `https://skyras-v2.vercel.app`
   - OR `https://skyras-v2-xxxx.vercel.app`
   - OR a custom domain if you set one
2. **COPY THIS URL** - this is your shareable link!

### Step 7: Verify Frontend
1. Open the URL in a new tab
2. You should see the landing page with:
   - "Marcus · Your AI PM for Content & Marketing"
   - "Open Marcus" button
   - "How it works" section
3. ✅ **If you see this, frontend is working!**

---

## SECTION 3: POST-DEPLOY TEST CHECKLIST

### Test 1: Landing Page
- [ ] Visit: `https://your-app.vercel.app/`
- [ ] Page loads with hero section
- [ ] "Open Marcus" button visible
- [ ] "How it works" section visible
- [ ] No console errors (press F12 → Console tab)

### Test 2: Access Code Gate
- [ ] Click **"Open Marcus"** button (or go to `/app`)
- [ ] Access code screen appears
- [ ] Enter: `PICOSQUAD2025`
- [ ] Click **"Continue"**
- [ ] Chat interface loads
- [ ] No errors in console

### Test 3: Onboarding Flow
- [ ] Type: `Hi` and send
- [ ] Marcus responds with first onboarding question
- [ ] Answer all 5 questions:
  1. "What do you do?" → Answer: `freelance creator`
  2. "Which platforms?" → Answer: `Instagram, TikTok`
  3. "How many hours?" → Answer: `10-20 hours`
  4. "Primary goal?" → Answer: `growing audience`
  5. "Content type?" → Answer: `mostly short-form`
- [ ] Marcus summarizes your answers
- [ ] Say: `yes` to confirm
- [ ] Marcus shows workflow proposals
- [ ] Select a workflow (say: `1` or workflow name)
- [ ] Full workflow structure appears

### Test 4: Backend Connection
- [ ] Open browser DevTools (F12)
- [ ] Go to **"Network"** tab
- [ ] Send a message in chat
- [ ] Look for request to: `https://your-backend-url.onrender.com/api/chat`
- [ ] Request should show status `200` (success)
- [ ] Response should contain Marcus's message
- [ ] ✅ **If you see this, backend connection works!**

### Test 5: Workflow Saved to Database
- [ ] Complete onboarding (from Test 3)
- [ ] Go to Supabase dashboard: https://supabase.com/dashboard
- [ ] Select your project
- [ ] Go to **"Table Editor"** → `conversations` table
- [ ] You should see a new row with:
   - `workflow` column containing JSON
   - `onboarding_state` column containing JSON
- [ ] ✅ **If you see this, database integration works!**

### Test 6: Dashboard
- [ ] Visit: `https://your-app.vercel.app/dashboard`
- [ ] Page loads
- [ ] Your workflow appears in the list
- [ ] Click on the workflow card
- [ ] Modal opens showing:
   - Weekly structure (MON, TUE, WED, etc.)
   - Task breakdown by category
- [ ] ✅ **If you see this, dashboard works!**

### Test 7: All Pages Load
- [ ] `/` - Landing page ✅
- [ ] `/app` - Marcus Chat ✅
- [ ] `/dashboard` - Workflow Dashboard ✅
- [ ] `/guide` - Guide/Tutorial ✅
- [ ] `/studio` - Agent Console ✅

### Test 8: No Localhost References
- [ ] Open browser DevTools (F12)
- [ ] Go to **"Console"** tab
- [ ] Look for any errors mentioning `localhost`
- [ ] Go to **"Network"** tab
- [ ] Check all API requests - they should go to your Render backend URL
- [ ] ✅ **No localhost references = good!**

---

## SECTION 4: SHARE WITH FRIENDS

### Your Deployment URLs

**Frontend (Share this):**
```
https://your-app.vercel.app
```

**Backend (Internal, don't share):**
```
https://your-backend-url.onrender.com
```

**Access Code:**
```
PICOSQUAD2025
```

### Share Message Template

Copy and paste this (replace `your-app` with your actual Vercel URL):

---

**Hey! I built Marcus - an AI workflow builder for content creators and marketers.**

**Try it here:** https://your-app.vercel.app

**Access code:** `PICOSQUAD2025`

Marcus asks you 5 quick questions about your work, then builds a personalized weekly content workflow tailored to your actual schedule and goals. It's a friends beta, so let me know what you think!

---

### Quick Links for Friends

- **Landing Page:** https://your-app.vercel.app/
- **Marcus Chat:** https://your-app.vercel.app/app
- **How It Works:** https://your-app.vercel.app/guide

**Access Code:** `PICOSQUAD2025`

---

## TROUBLESHOOTING QUICK REFERENCE

**Backend not responding?**
- Wait 30 seconds (free tier cold start)
- Check Render logs: Render dashboard → Your service → Logs
- Verify health endpoint: `https://your-backend-url.onrender.com/health`

**Frontend build failed?**
- Check Vercel build logs: Vercel dashboard → Your project → Deployments → Click latest → View build logs
- Verify root directory is set to `frontend`

**Access code not working?**
- Verify `NEXT_PUBLIC_ACCESS_CODE=PICOSQUAD2025` is set in Vercel
- Clear browser localStorage and try again

**API calls failing?**
- Check `NEXT_PUBLIC_API_BASE_URL` points to your Render backend URL
- Check browser console for CORS errors
- Verify backend is running (test health endpoint)

---

## ✅ DEPLOYMENT COMPLETE CHECKLIST

- [ ] Backend deployed to Render
- [ ] Backend health check passes
- [ ] Frontend deployed to Vercel
- [ ] Frontend landing page loads
- [ ] Access code gate works
- [ ] Onboarding completes successfully
- [ ] Workflow saves to Supabase
- [ ] Dashboard shows workflows
- [ ] All API calls hit deployed backend (not localhost)
- [ ] No console errors
- [ ] Share link ready!

**Once all checked, you're live! 🚀**

