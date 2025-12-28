# Friends Beta Deployment Plan

## Recommended Hosting Combo

**Vercel (Frontend + Backend API Routes)**

> **Note:** Railway backend has been decommissioned. Production now uses Vercel for both frontend and backend (Next.js API routes). See `docs/RAILWAY_DECISION.md` for details.

### Why Vercel?

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

### Deploy Next.js Application to Vercel

> **Note:** All backend functionality is now in Next.js API routes (`frontend/src/app/api/`). No separate backend service is required.

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
   NEXT_PUBLIC_ACCESS_CODE=PICOSQUAD2025
   NEXT_PUBLIC_SUPABASE_URL=https://zzxedixpbvivpsnztjsc.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6eGVkaXhwYnZpdnBzbnp0anNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzODkyMTksImV4cCI6MjA3ODk2NTIxOX0.xDUS_lPMxQvI-J1ZaafWOhaAhqwRW-whr-PrYFQh1RQ
   SUPABASE_URL=https://zzxedixpbvivpsnztjsc.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6eGVkaXhwYnZpdnBzbnp0anNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzODkyMTksImV4cCI6MjA3ODk2NTIxOX0.xDUS_lPMxQvI-J1ZaafWOhaAhqwRW-whr-PrYFQh1RQ
   ```
   
   **Note:** `NEXT_PUBLIC_API_BASE_URL` is not needed. Frontend uses same-origin API calls to Next.js API routes.
   
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

---

### Verify Deployment

1. **Test Frontend**
   - Visit `https://your-app.vercel.app`
   - Should see access code screen
   - Enter code, should see Marcus Chat

2. **Test API Routes**
   - Open browser DevTools → Network tab
   - Send a test message
   - Verify requests go to `/api/chat` (same-origin, no external backend)

---

## Access Code Gate

The frontend now includes a simple access code gate at `/` (Marcus Chat page).

- Access code is set via `NEXT_PUBLIC_ACCESS_CODE` environment variable
- Users must enter the code to access Marcus Chat
- Code is stored in localStorage (session-based, not permanent)
- Studio route (`/studio`) is not gated (for your use)

---

## Troubleshooting

### Frontend Issues

- **API calls failing**: Check that API routes exist in `frontend/src/app/api/`. All API calls should be same-origin (no external backend needed).
- **Build errors**: Ensure all dependencies are in `package.json`
- **Access code not working**: Verify `NEXT_PUBLIC_ACCESS_CODE` is set in Vercel

### Database Issues

- **Supabase connection**: Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- **RLS policies**: Ensure tables have appropriate RLS or are public for dev

---

## Cost Estimate (Free Tier)

- **Vercel**: Free (generous limits for Next.js apps)
- **Supabase**: Free tier (500MB database, 1GB storage)
- **Total**: $0/month (fully free tier)

---

## Next Steps After Deployment

1. Test end-to-end: Send message, upload file, verify Supabase writes
2. Share access code with friends
3. Monitor Railway/Vercel dashboards for errors
4. Set up basic monitoring/alerts if needed

