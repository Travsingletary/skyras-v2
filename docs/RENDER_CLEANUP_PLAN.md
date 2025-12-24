# Render Cleanup Plan - Migration to Railway/Vercel

## Current Status

**Migration Complete:** ✅ Backend moved to Railway, Frontend on Vercel  
**Render Status:** ⚠️ Still receiving "backend failed" emails from Render  
**Action Required:** Clean up Render services and references

---

## 1. Identify Active Render Services

### Service Name
- **Service**: `skyras-backend`
- **Expected URL**: `https://skyras-backend.onrender.com` (or variant with random suffix)

### Action Items
1. ✅ **Log into Render Dashboard**: https://dashboard.render.com
2. ✅ **Find Service**: Search for `skyras-backend` or check "Web Services"
3. ✅ **Note Exact URL**: Copy the full service URL
4. ✅ **Check Service Status**: Active, Suspended, or Failed

### Possible URLs
- `https://skyras-backend.onrender.com`
- `https://skyras-backend-xxxx.onrender.com` (with random suffix)

---

## 2. DNS Records & Monitoring

### Check DNS Records
**Action:** Review your domain DNS settings (if using custom domain)

1. Check if any A/CNAME records point to Render:
   ```bash
   # Check your domain's DNS records
   dig yourdomain.com
   nslookup yourdomain.com
   ```

2. **Common Render DNS patterns:**
   - CNAME to `*.onrender.com`
   - A records pointing to Render IPs

### Check Uptime/Cron Monitors

**External Monitoring Services:**
- [ ] UptimeRobot
- [ ] Pingdom
- [ ] StatusCake
- [ ] Cron-job.org
- [ ] GitHub Actions (cron workflows)
- [ ] Vercel Cron Jobs (check if any point to Render)

**Action:** Search for `onrender.com` or `skyras-backend` in:
- Monitoring service dashboards
- GitHub Actions workflows (`.github/workflows/`)
- Vercel Cron configuration

---

## 3. Recommended Shutdown Option

### ✅ **RECOMMENDED: Suspend Service**

**Why Suspend (not delete immediately):**
- Preserves configuration for 30 days
- Easy to restore if needed
- No data loss risk
- Can delete later after confirming everything works

**Steps:**
1. Go to Render Dashboard → `skyras-backend` service
2. Click **"Settings"** → Scroll to **"Danger Zone"**
3. Click **"Suspend Service"**
4. Confirm suspension

**Alternative: Scale to Zero**
- If suspend option not available, scale to 0 instances
- This stops the service without deleting it

**⚠️ DO NOT DELETE YET** until:
- ✅ Confirmed Railway backend is working
- ✅ Confirmed no DNS/monitoring points to Render
- ✅ Confirmed no environment variables reference Render URLs

---

## 4. Files to Update/Remove

### Files to DELETE

1. **`.render.yaml`** (Render deployment config)
   - **Path**: `.render.yaml`
   - **Action**: Delete file
   - **Reason**: No longer using Render

### Files to UPDATE (Remove Render References)

#### Documentation Files (Update, don't delete)

1. **`DEPLOYMENT_GUIDE.md`**
   - Remove "PART 1: BACKEND DEPLOYMENT (Render)" section
   - Update to reference Railway instead
   - Remove Render-specific instructions

2. **`DEPLOYMENT_SUMMARY.md`**
   - Update "Deploy Backend to Render" → "Deploy Backend to Railway"
   - Remove Render URLs from examples
   - Update environment variable examples

3. **`DEPLOYMENT.md`**
   - Update "Render (Backend)" → "Railway (Backend)"
   - Remove Render deployment steps
   - Update URLs and examples

4. **`DEPLOY_NOW.md`**
   - Remove "SECTION 1: BACKEND DEPLOYMENT (Render)"
   - Update to Railway deployment steps
   - Remove Render URLs

5. **`DEPLOYMENT_COMPLETE.md`**
   - Update "Render Backend Deployment" section
   - Change URL from `https://skyras-backend.onrender.com` to Railway URL
   - Update environment variable references

6. **`VERCEL_DEPLOY_STEPS.md`**
   - Line 47: Remove `https://skyras-backend.onrender.com`
   - Update to Railway backend URL

7. **`VERCEL_CLEAN_IMPORT.md`**
   - Line 47: Remove `https://skyras-backend.onrender.com`
   - Line 136: Update Render URL reference

8. **`ELEVENLABS_SETUP.md`**
   - Line 28: Remove "Go to your Render dashboard" instruction
   - Update to Railway/Vercel instructions

9. **`VOICE_FEATURES_SUMMARY.md`**
   - Line 40: Remove "Add API Key to Render (Backend)" section
   - Update to Railway instructions

10. **`PRE_DEPLOY_CHECKLIST.md`**
    - Remove Render-specific checklist items
    - Update to Railway/Vercel checklist

11. **`PUSH_TO_GITHUB.md`**
    - Line 58: Remove "Backend Deployment (Render)" reference
    - Update to Railway

#### Environment Example Files (Update)

12. **`frontend/env.example`**
    - Line 6: Remove comment `# For production: https://your-backend-url.onrender.com`
    - Update to Railway URL example

13. **`ecosystem.config.js`**
    - Line 4: Service name `skyras-backend` is fine (PM2 config, not Render-specific)

---

## 5. Exact URLs/Records to Remove

### Render Service URLs (to verify and remove)

**Primary Service:**
- `https://skyras-backend.onrender.com` (or variant)

**Check These Locations:**

1. **Vercel Environment Variables**
   - Variable: `NEXT_PUBLIC_API_BASE_URL`
   - **Action**: Verify it points to Railway, not Render
   - **Check**: Vercel Dashboard → Project → Settings → Environment Variables

2. **Railway Environment Variables**
   - **Action**: Ensure no Render URLs in Railway config

3. **GitHub Secrets** (if used)
   - **Action**: Check `.github/workflows/` for Render URLs
   - **Action**: Check GitHub repository settings → Secrets

4. **Local `.env` files** (if committed - should be in .gitignore)
   - **Action**: Verify no Render URLs in any `.env` files

---

## 6. Cleanup Checklist

### Phase 1: Verification (Before Shutdown)

- [ ] Log into Render Dashboard: https://dashboard.render.com
- [ ] Identify exact service name and URL
- [ ] Check service status (Active/Suspended/Failed)
- [ ] Verify Railway backend is working
- [ ] Verify Vercel frontend is working
- [ ] Check Vercel env vars don't reference Render
- [ ] Check Railway env vars don't reference Render
- [ ] Search DNS records for `onrender.com`
- [ ] Check uptime monitoring services
- [ ] Check GitHub Actions for Render URLs
- [ ] Check Vercel Cron Jobs for Render URLs

### Phase 2: Documentation Cleanup

- [ ] Delete `.render.yaml`
- [ ] Update `DEPLOYMENT_GUIDE.md` (remove Render section)
- [ ] Update `DEPLOYMENT_SUMMARY.md` (Railway instead)
- [ ] Update `DEPLOYMENT.md` (Railway instead)
- [ ] Update `DEPLOY_NOW.md` (Railway instead)
- [ ] Update `DEPLOYMENT_COMPLETE.md` (Railway URL)
- [ ] Update `VERCEL_DEPLOY_STEPS.md` (remove Render URL)
- [ ] Update `VERCEL_CLEAN_IMPORT.md` (remove Render URL)
- [ ] Update `ELEVENLABS_SETUP.md` (Railway instead)
- [ ] Update `VOICE_FEATURES_SUMMARY.md` (Railway instead)
- [ ] Update `PRE_DEPLOY_CHECKLIST.md` (Railway instead)
- [ ] Update `PUSH_TO_GITHUB.md` (Railway instead)
- [ ] Update `frontend/env.example` (remove Render comment)

### Phase 3: Service Shutdown

- [ ] Suspend Render service (recommended)
- [ ] OR Scale Render service to 0 instances
- [ ] Verify service is stopped (no more emails)
- [ ] Wait 7 days to confirm no issues
- [ ] Delete Render service (after confirmation period)

### Phase 4: Final Verification

- [ ] No "backend failed" emails from Render
- [ ] Railway backend responding correctly
- [ ] Vercel frontend working correctly
- [ ] All documentation updated
- [ ] No Render references in codebase (except historical docs)

---

## 7. Safe Shutdown Steps

### Step-by-Step Process

1. **Verify Migration Complete**
   ```bash
   # Test Railway backend
   curl https://your-railway-backend-url.up.railway.app/health
   
   # Test Vercel frontend
   curl https://your-vercel-app.vercel.app/
   ```

2. **Check for Active Connections**
   - Review Vercel logs for any requests to Render
   - Check Railway logs for any Render references
   - Verify no external services calling Render

3. **Suspend Render Service**
   - Render Dashboard → `skyras-backend` → Settings → Suspend
   - **Wait 24-48 hours** to confirm no issues

4. **Clean Up Documentation**
   - Follow checklist above
   - Commit changes with message: "Remove Render references, migrated to Railway"

5. **Monitor for Issues**
   - Watch for any errors in Railway/Vercel
   - Confirm no more Render emails
   - Check application functionality

6. **Delete Render Service** (After 7 days)
   - Only after confirming everything works
   - Render Dashboard → Settings → Delete Service

---

## 8. Files Summary

### Delete (1 file)
- `.render.yaml`

### Update (13 files)
1. `DEPLOYMENT_GUIDE.md`
2. `DEPLOYMENT_SUMMARY.md`
3. `DEPLOYMENT.md`
4. `DEPLOY_NOW.md`
5. `DEPLOYMENT_COMPLETE.md`
6. `VERCEL_DEPLOY_STEPS.md`
7. `VERCEL_CLEAN_IMPORT.md`
8. `ELEVENLABS_SETUP.md`
9. `VOICE_FEATURES_SUMMARY.md`
10. `PRE_DEPLOY_CHECKLIST.md`
11. `PUSH_TO_GITHUB.md`
12. `frontend/env.example`
13. `ecosystem.config.js` (if needed - PM2 name is fine)

---

## 9. Render URLs to Remove

### Exact URLs Found in Codebase

1. **`https://skyras-backend.onrender.com`**
   - Found in: `DEPLOYMENT_COMPLETE.md`, `VERCEL_DEPLOY_STEPS.md`, `VERCEL_CLEAN_IMPORT.md`
   - **Action**: Replace with Railway URL or remove

2. **`https://your-backend-url.onrender.com`** (placeholder)
   - Found in: Multiple deployment docs
   - **Action**: Replace with Railway placeholder

3. **`https://dashboard.render.com`**
   - Found in: `ELEVENLABS_SETUP.md`
   - **Action**: Remove or replace with Railway dashboard

---

## 10. Recommended Timeline

**Day 1: Verification**
- Verify Railway/Vercel working
- Check all monitoring/DNS
- Document exact Render service URL

**Day 2: Suspend Service**
- Suspend Render service
- Start documentation cleanup

**Day 3-7: Monitor**
- Watch for any issues
- Complete documentation updates
- Verify no more Render emails

**Day 8+: Delete Service**
- After 7 days of no issues
- Delete Render service permanently
- Final verification

---

## Status: Ready for Cleanup

All Render references identified. Follow checklist above to safely migrate away from Render.

