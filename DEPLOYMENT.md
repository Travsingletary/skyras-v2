# Friends Beta Deployment Plan

## Recommended Hosting Combo

**Railway (Backend) + Vercel (Frontend)**

### Why This Combo?

- **Railway**: 
  - Excellent for Express/Node.js backends
  - Free tier includes $5/month credit
  - Simple deployment from GitHub
  - Automatic HTTPS
  - Environment variable management
  - Services stay active (no sleep mode)
  - Good for APIs and background services

- **Vercel**:
  - Built by Next.js team, perfect for Next.js apps
  - Free tier with generous limits
  - Automatic deployments from GitHub
  - Edge network for fast global access
  - Zero-config for Next.js
  - Built-in environment variable management

---

## Environment Variables

### Backend (.env.example)

See `.env.example` in project root.

### Frontend (.env.local.example)

See `frontend/.env.local.example`

---

## Step-by-Step Deployment

### Part 1: Deploy Express Backend to Railway

1. **Prepare Repository**
   - Ensure `server.js` is in root
   - Create `package.json` with start script: `"start": "node server.js"`
   - Commit and push to GitHub

2. **Create Railway Service**
   - Go to https://railway.app
   - Sign up/login with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Connect your GitHub repository
   - Select the repository

3. **Configure Service**
   - Railway auto-detects Node.js projects
   - **Start Command**: Set to `npm start` in service settings
   - Railway automatically runs `npm install` during build

4. **Set Environment Variables** (in Railway dashboard)
   ```
   PORT=4000
   OPENAI_API_KEY=your_openai_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (if needed)
   NODE_ENV=production
   ```

5. **Deploy**
   - Railway automatically deploys after connecting repo
   - Wait for build and deployment
   - Note the service URL (e.g., `https://your-service-name.up.railway.app`)

6. **Important**: Railway free tier includes $5/month credit. Services stay active:
   - Upgrading to paid tier for always-on
   - Or use Railway (better free tier for always-on)

---

### Part 2: Deploy Next.js Frontend to Vercel

1. **Prepare Repository**
   - Ensure `frontend/` directory exists
   - Commit and push to GitHub

2. **Create Vercel Project**
   - Go to https://vercel.com
   - Sign up/login with GitHub
   - Click "Add New..." → "Project"
   - Import your GitHub repository

3. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `frontend` (important!)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

4. **Set Environment Variables** (in Vercel dashboard)
   
   **Required:**
   ```
   NEXT_PUBLIC_API_BASE_URL=https://your-railway-backend-url.up.railway.app
   NEXT_PUBLIC_ACCESS_CODE=PICOSQUAD2025
   SUPABASE_URL=https://zzxedixpbvivpsnztjsc.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6eGVkaXhwYnZpdnBzbnp0anNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzODkyMTksImV4cCI6MjA3ODk2NTIxOX0.xDUS_lPMxQvI-J1ZaafWOhaAhqwRW-whr-PrYFQh1RQ
   ```
   
   **Optional (for studio features):**
   ```
   IMAGE_STORAGE_BUCKET=generated-images
   IMAGE_PROVIDER_NAME=replicate-sdxl
   IMAGE_PROVIDER_BASE_URL=https://api.replicate.com/v1
   REPLICATE_MODEL_ID=your_model_id
   REPLICATE_API_TOKEN=your_replicate_token
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build and deployment
   - Note the deployment URL (e.g., `https://skyras.vercel.app`)

6. **Update Backend URL**
   - After deployment, update `NEXT_PUBLIC_API_BASE_URL` in Vercel to point to your Railway backend URL
   - Redeploy if needed (Vercel auto-redeploys on env var changes)

---

### Part 3: Verify Deployment

1. **Test Backend**
   ```bash
   curl https://your-railway-backend-url.up.railway.app/health
   # Should return: {"status":"ok","message":"SkyRas v2 Backend running"}
   ```

2. **Test Frontend**
   - Visit `https://your-app.vercel.app`
   - Should see access code screen
   - Enter code, should see Marcus Chat

3. **Test API Connection**
   - Open browser DevTools → Network tab
   - Send a test message
   - Verify requests go to `https://your-railway-backend-url.up.railway.app/api/chat`

---

## Access Code Gate

The frontend now includes a simple access code gate at `/` (Marcus Chat page).

- Access code is set via `NEXT_PUBLIC_ACCESS_CODE` environment variable
- Users must enter the code to access Marcus Chat
- Code is stored in localStorage (session-based, not permanent)
- Studio route (`/studio`) is not gated (for your use)

---

## Troubleshooting

### Backend Issues

- **Service sleeping**: Render free tier spins down. First request will be slow (~30s). Consider Railway for always-on.
- **CORS errors**: Ensure backend has `cors()` middleware enabled (already in server.js)
- **Environment variables**: Double-check all vars are set in Render dashboard

### Frontend Issues

- **API calls failing**: Check `NEXT_PUBLIC_API_BASE_URL` is set correctly in Vercel
- **Build errors**: Ensure all dependencies are in `package.json`
- **Access code not working**: Verify `NEXT_PUBLIC_ACCESS_CODE` is set in Vercel

### Database Issues

- **Supabase connection**: Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- **RLS policies**: Ensure tables have appropriate RLS or are public for dev

---

## Cost Estimate (Free Tier)

- **Railway**: Free tier ($5/month credit) or paid plans available
- **Vercel**: Free (generous limits)
- **Supabase**: Free tier (500MB database, 1GB storage)
- **Total**: $0-5+/month depending on Railway usage

---

## Next Steps After Deployment

1. Test end-to-end: Send message, upload file, verify Supabase writes
2. Share access code with friends
3. Monitor Railway/Vercel dashboards for errors
4. Set up basic monitoring/alerts if needed

