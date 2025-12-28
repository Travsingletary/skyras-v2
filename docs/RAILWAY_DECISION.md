# Railway Decision: KEEP vs KILL

**Date:** 2025-01-28  
**Status:** ⚠️ PENDING DECISION  
**Action Required:** Verify Railway deployment status and make final decision

---

## 1. Current Production Architecture

### Canonical Backend: Vercel (Next.js API Routes)

**Evidence:**
- Production frontend: `https://skyras-v2.vercel.app`
- All API routes are Next.js Route Handlers in `frontend/src/app/api/`
- Frontend code explicitly uses `apiBaseUrl = "same-origin"` (calls Next.js API routes, not external backend)
- See: `frontend/src/app/studio/page.tsx:78` - `const apiBaseUrl = "same-origin";`

**Production API Endpoints (all on Vercel):**
- `/api/chat` → TypeScript Marcus agent
- `/api/data/plans` → TypeScript workflows query
- `/api/workflows` → TypeScript workflows CRUD
- `/api/upload` → TypeScript file upload handler
- `/api/agents/*` → TypeScript agents (Atlas, Marcus Manager, Compliance, etc.)
- `/api/test/golden-path` → TypeScript agent testing

**Canonical Agent Runtime:** TypeScript AgentKit (Next.js API routes)  
**Non-Canonical:** Python microservices (NOT deployed/used in production)  
See: `docs/AGENT_CANONICAL_PATH.md`

---

## 2. Railway Deployment History

### What Railway Was Originally Meant For

From documentation (`DEPLOYMENT.md`, `RAILWAY_SETUP.md`, `DEPLOYMENT_SUMMARY.md`):

1. **Option A: Old Express.js Backend**
   - `server.js.backup` exists in repo root
   - Railway was mentioned as a backend hosting option
   - This appears to be pre-Vercel migration

2. **Option B: Python Microservices**
   - `services/` directory contains FastAPI microservices
   - These are explicitly marked as NON-CANONICAL (see `README_MICROSERVICES.md`)
   - Python services run via Docker Compose locally, NOT in production

### Current State of Railway

**Unable to verify directly** (no Railway API access), but based on codebase analysis:

**Likely Scenario:**
- Railway may have an old/dead deployment of:
  - Express.js backend (if `server.js` was ever deployed)
  - OR Python microservices (if they were attempted to be deployed)
  - OR Next.js app (if there was a migration attempt)

**Why it's likely dead/unused:**
1. Production frontend doesn't reference Railway URLs
2. Frontend uses "same-origin" API calls (Next.js API routes on Vercel)
3. No `NEXT_PUBLIC_API_BASE_URL` configured for Railway in production
4. All canonical agent execution is TypeScript on Vercel
5. Python microservices are explicitly marked as non-canonical

---

## 3. Production Traffic Analysis

### Does Production Depend on Railway?

**NO** - Production does NOT depend on Railway.

**Evidence:**

1. **Frontend API Calls:**
   ```typescript
   // frontend/src/app/studio/page.tsx:78
   const apiBaseUrl = "same-origin"; // Uses Next.js API routes, not Railway
   ```

2. **No Railway URLs in Code:**
   - No references to `*.railway.app` in production code
   - `NEXT_PUBLIC_API_BASE_URL` is only used for legacy code paths (taskNotifications, autoExecute)
   - These legacy paths have fallbacks to same-origin

3. **Vercel is the Canonical Backend:**
   - All production API routes are in `frontend/src/app/api/`
   - These deploy to Vercel as Next.js Route Handlers
   - No external backend calls needed

4. **Python Microservices Not Used:**
   - `docs/AGENT_CANONICAL_PATH.md` explicitly states: "Canonical Runtime: TypeScript AgentKit"
   - Python services are "Non-Canonical" and "NOT called by production code"

---

## 4. Decision: KILL Railway

### Recommendation: **KILL Railway**

**Rationale:**

1. ✅ **No Production Dependency:** Frontend uses "same-origin" API calls to Vercel
2. ✅ **Canonical Backend is Vercel:** All production API routes are Next.js on Vercel
3. ✅ **Python Microservices Are Non-Canonical:** They're explicitly marked as dev-only/archived
4. ✅ **No Code References:** No production code calls Railway endpoints
5. ✅ **Cost Savings:** Eliminate unnecessary Railway service costs

### Action Items:

#### Step 1: Verify Railway Deployment (Manual Check Required)

1. **Log into Railway Dashboard:** https://railway.app
2. **Find Project:** Search for "skyras" or "skyras-v2"
3. **Identify Service:**
   - Note service name
   - Note service URL (if any)
   - Check deployment status (Active/Failed/Stopped)
4. **Check Deployment Logs:**
   - View last deployment attempt
   - Note error messages (if any)
   - Copy last ~50 lines of failing logs

#### Step 2: Disable/Delete Railway Service

**Option A: Suspend Service (Recommended First)**
- Railway Dashboard → Service → Settings → Suspend
- Wait 24-48 hours to confirm no issues
- Then delete if confirmed safe

**Option B: Scale to Zero**
- Scale service to 0 instances
- This stops the service without deleting it
- Can delete later after confirmation

**Option C: Delete Immediately (If Confident)**
- Railway Dashboard → Service → Settings → Delete
- ⚠️ Only if 100% confident it's not needed

#### Step 3: Disable Auto-Deploy & Alerts

1. **Disable Auto-Deploy:**
   - Railway Dashboard → Service → Settings → GitHub Integration
   - Disable "Auto-Deploy" or disconnect GitHub repo

2. **Disable Alerts/Notifications:**
   - Railway Dashboard → Service → Settings → Notifications
   - Disable email alerts for deployment failures

#### Step 4: Clean Up Documentation (After Railway is Confirmed Dead)

1. **Update/Remove Railway References:**
   - `RAILWAY_SETUP.md` → Mark as archived or delete
   - `DEPLOYMENT.md` → Remove Railway backend option
   - `DEPLOYMENT_SUMMARY.md` → Remove Railway references
   - `DEPLOYMENT_COMPLETE.md` → Update to reflect Vercel-only
   - `DEPLOY_NOW.md` → Remove Railway deployment steps

2. **Update Environment Variable Examples:**
   - `frontend/env.example` → Remove Railway URL comment
   - Update deployment guides to show Vercel-only architecture

---

## 5. Alternative Scenario: If Railway IS Needed

### If Railway is Actually Running Something Critical

**This is UNLIKELY based on codebase analysis, but if discovered:**

1. **Identify What It's Running:**
   - Check Railway logs to see what service is deployed
   - Determine if it's serving production traffic

2. **Fix Railway Deployment (If Needed):**

   **Common Issues:**
   - PORT binding: Railway sets `PORT` env var, must bind to `process.env.PORT`
   - Start command: Must be `npm start` or correct Node.js command
   - Missing env vars: Check Railway dashboard for required vars
   - Health check: Railway may need `/health` or `/` endpoint

   **Example Fix (if Express.js backend):**
   ```javascript
   // server.js must bind to Railway's PORT
   const PORT = process.env.PORT || 4000;
   app.listen(PORT, () => {
     console.log(`Server running on port ${PORT}`);
   });
   ```

3. **Re-evaluate Decision:**
   - If Railway is serving production traffic, decision becomes KEEP
   - Migrate functionality to Vercel if possible
   - Or maintain Railway if migration is complex

---

## 6. Verification Checklist

### Before Killing Railway:

- [ ] Logged into Railway dashboard
- [ ] Identified Railway project/service name
- [ ] Checked service status (Active/Failed/Stopped)
- [ ] Reviewed last deployment logs (if failed)
- [ ] Confirmed no production code references Railway URLs
- [ ] Confirmed frontend uses "same-origin" API calls
- [ ] Verified Vercel is handling all production API routes
- [ ] Checked Railway service has no active deployments/traffic
- [ ] Disabled auto-deploy to prevent future failures
- [ ] Disabled email alerts

### After Killing Railway:

- [ ] Service suspended/scaled to zero
- [ ] No more failure emails received
- [ ] Production still working (verify Vercel endpoints)
- [ ] Documentation updated (Railway references removed/marked archived)
- [ ] Railway service deleted (after 7-day confirmation period)

---

## 7. Expected Outcome

### If Railway is Killed:

- ✅ **No more failure emails** from Railway
- ✅ **Cost reduction** (no Railway service charges)
- ✅ **Cleaner architecture** (single canonical backend: Vercel)
- ✅ **Less confusion** (no ambiguity about which backend is canonical)

### Risk Assessment:

- **Risk Level:** ⚠️ **LOW** (based on codebase analysis)
- **Mitigation:** Suspend first, wait 24-48 hours, then delete if no issues
- **Rollback Plan:** Railway service can be restored from backup if needed (within 30 days)

---

## 8. Final Decision

**DECISION: KILL Railway** ✅

**Confidence Level:** **HIGH** (95%+)

**Reasoning:**
- Production architecture is Vercel-only
- Frontend uses same-origin API calls
- No code references Railway
- Python microservices are explicitly non-canonical
- Railway is likely hosting old/dead deployment

**Next Steps:**
1. Verify Railway deployment status (manual check required)
2. Suspend Railway service
3. Monitor for 24-48 hours
4. Delete Railway service if no issues
5. Update documentation

---

## 9. Evidence Summary

| Evidence | Status | Notes |
|----------|--------|-------|
| Production frontend uses "same-origin" | ✅ | `frontend/src/app/studio/page.tsx:78` |
| No Railway URLs in production code | ✅ | Searched codebase, no references |
| Canonical backend is Vercel | ✅ | All API routes in `frontend/src/app/api/` |
| Python microservices non-canonical | ✅ | `docs/AGENT_CANONICAL_PATH.md` |
| Railway deployment status | ⚠️ | Need to check Railway dashboard |

---

**Last Updated:** 2025-01-28  
**Next Action:** Verify Railway deployment status manually, then execute kill procedure
