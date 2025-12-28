# Railway Decommission Guide

**Date:** 2025-01-28  
**Status:** Manual steps required (cannot be automated)  
**Purpose:** Step-by-step guide to decommission Railway services

---

## Prerequisites

- Access to Railway dashboard: https://railway.app
- Confirmation that production is working on Vercel (already verified ✅)

---

## Step 1: Locate Railway Projects

1. **Log into Railway Dashboard**
   - Go to https://railway.app
   - Sign in with your GitHub account

2. **Find Projects**
   - Look for projects named:
     - `skyras`
     - `skyras-v2`
     - Any variations or related projects

3. **Document What You Find**
   - Note project names
   - Note service names within each project
   - Note service URLs (if any)
   - Take screenshots for documentation

---

## Step 2: For Each Service - Suspend/Stop

For each service found:

### Option A: Suspend Service (Recommended)

1. **Navigate to Service**
   - Click on the project
   - Click on the service

2. **Suspend Service**
   - Go to **Settings** tab
   - Scroll to **"Danger Zone"** section
   - Click **"Suspend Service"**
   - Confirm suspension

### Option B: Scale to Zero (If Suspend Not Available)

1. **Navigate to Service**
   - Click on the project
   - Click on the service

2. **Scale Down**
   - Go to **Settings** tab
   - Find **"Scaling"** or **"Resources"** section
   - Set instances to **0**
   - Save changes

**Result:** Service stops running but configuration is preserved.

---

## Step 3: Disable Auto-Deploy

For each service:

1. **Navigate to Service Settings**
   - Click on the service
   - Go to **Settings** tab

2. **Disable GitHub Integration**
   - Find **"GitHub"** or **"Source"** section
   - Click **"Disconnect"** or **"Disable Auto-Deploy"**
   - Confirm disconnection

**Result:** No new deployments will trigger from GitHub pushes.

---

## Step 4: Disable Email Alerts

For each service:

1. **Navigate to Service Settings**
   - Click on the service
   - Go to **Settings** tab

2. **Disable Notifications**
   - Find **"Notifications"** or **"Alerts"** section
   - Disable **"Email Notifications"**
   - Disable **"Deployment Failure Alerts"**
   - Save changes

**Result:** No more failure emails will be sent.

---

## Step 5: Verify Production Still Works

After suspending Railway services, verify production:

### Test 1: Studio Page
```bash
curl https://skyras-v2.vercel.app/studio
```
**Expected:** HTML response (200 OK)

### Test 2: API Endpoints
```bash
# Should return 401 (auth required, but endpoint works)
curl https://skyras-v2.vercel.app/api/data/plans

# Should return 400 (validation error, but endpoint works)
curl -X POST https://skyras-v2.vercel.app/api/test/golden-path \
  -H "Content-Type: application/json" \
  -d '{}'
```
**Expected:** JSON error responses (not 500/502/503)

### Test 3: Manual Browser Check
- Visit: https://skyras-v2.vercel.app/studio
- Verify page loads correctly
- Check browser console for errors

**Result:** If all tests pass, production is unaffected by Railway shutdown.

---

## Step 6: Archive Railway Project (After 24-48 Hours)

**Wait Period:** 24-48 hours after suspension to confirm no issues.

### Archive Project

1. **Navigate to Project**
   - Go to Railway dashboard
   - Click on the project

2. **Archive Project**
   - Go to **Settings** tab
   - Scroll to **"Danger Zone"**
   - Click **"Archive Project"**
   - Confirm archiving

**Result:** Project is archived but can be restored if needed.

---

## Step 7: Delete Railway Project (After 7 Days)

**Wait Period:** 7 days after archiving to ensure no issues.

### Delete Project (Final Step)

1. **Navigate to Archived Project**
   - Go to Railway dashboard
   - Find archived project

2. **Delete Project**
   - Go to **Settings** tab
   - Scroll to **"Danger Zone"**
   - Click **"Delete Project"**
   - Type project name to confirm
   - Confirm deletion

**Result:** Project is permanently deleted.

---

## Verification Checklist

### Before Suspension:
- [ ] Logged into Railway dashboard
- [ ] Found all projects/services named "skyras" or "skyras-v2"
- [ ] Documented project names and service URLs
- [ ] Took screenshots for documentation

### After Suspension:
- [ ] All services suspended/scaled to zero
- [ ] Auto-deploy disabled for all services
- [ ] Email alerts disabled for all services
- [ ] Production endpoints tested and working
- [ ] No errors in browser console
- [ ] Screenshot of suspended services saved

### After Archiving (24-48 hours):
- [ ] No failure emails received
- [ ] Production still working
- [ ] Project archived in Railway

### After Deletion (7 days):
- [ ] Project deleted from Railway
- [ ] Documentation updated
- [ ] No Railway references in codebase (except archived docs)

---

## Screenshot Documentation

Take screenshots of:

1. **Railway Dashboard** - Showing projects/services
2. **Service Settings** - Showing suspended/stopped status
3. **GitHub Integration** - Showing disconnected status
4. **Notifications** - Showing disabled alerts
5. **Production Test Results** - Showing endpoints working

Save screenshots in: `docs/railway-decommission-evidence/` (create directory if needed)

---

## Troubleshooting

### Issue: Cannot find "Suspend" option
**Solution:** Use "Scale to Zero" instead. This achieves the same result.

### Issue: Service won't suspend
**Solution:** Check if service is currently deploying. Wait for deployment to complete, then suspend.

### Issue: Production breaks after suspension
**Solution:** 
1. Immediately restore Railway service
2. Investigate what broke
3. Fix production issue
4. Re-attempt suspension after fix

### Issue: Still receiving failure emails
**Solution:**
1. Check Railway dashboard for notification settings
2. Verify all alert types are disabled
3. Check Railway account-level notification settings

---

## Expected Outcome

After completing all steps:

- ✅ **No Railway services running**
- ✅ **No auto-deploy from GitHub**
- ✅ **No failure emails**
- ✅ **Production working on Vercel**
- ✅ **Railway projects archived/deleted**
- ✅ **Documentation updated**

---

## Timeline

| Step | Action | Timeline |
|------|--------|----------|
| 1-4 | Suspend services, disable auto-deploy/alerts | Day 1 |
| 5 | Verify production | Day 1 (immediately after) |
| 6 | Archive projects | Day 2-3 (after 24-48h wait) |
| 7 | Delete projects | Day 8+ (after 7-day wait) |

---

## Related Documentation

- `docs/RAILWAY_DECISION.md` - Decision rationale and evidence
- `DEPLOYMENT.md` - Current deployment guide (Vercel-only)
- `RAILWAY_SETUP.md` - Archived Railway setup guide

---

**Last Updated:** 2025-01-28  
**Status:** Ready for execution
