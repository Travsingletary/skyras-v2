# Railway Decommission Tracking

**Date Started:** 2025-01-28  
**Status:** In Progress - Manual Dashboard Steps Required  
**Production Verified:** ✅ Confirmed Working (2025-01-28)

---

## Production Verification ✅

**Tested:** 2025-01-28

### Test Results:
- ✅ `/studio` endpoint: **200 OK** - Production page loads correctly
- ✅ `/api/data/plans` endpoint: **401 Unauthenticated** - Returns proper auth error (endpoint working)

**Production URL:** `https://skyras-v2.vercel.app`  
**Status:** Production unaffected by Railway decommission

---

## Step 1: Locate Railway Projects

**Status:** ⏳ Pending Manual Action

### Instructions:
1. Log into Railway Dashboard: https://railway.app
2. Find projects matching:
   - `skyras`
   - `skyras-v2`
   - Any variations

### Findings:
- [ ] Project name(s): ________________________
- [ ] Service name(s): ________________________
- [ ] Service URL(s): ________________________
- [ ] Screenshot saved: ________________________

**Evidence Location:** `docs/railway-decommission-evidence/` (create if needed)

---

## Step 2: Suspend/Stop Services

**Status:** ⏳ Pending Manual Action

### For Each Service Found:

#### Service 1: ________________________
- [ ] **Status:** Suspended / Scaled to 0
- [ ] **Method:** Suspend Service (preferred) OR Scale to Zero
- [ ] **Location:** Service → Settings → Danger Zone → Suspend
- [ ] **Confirmation:** Service stopped
- [ ] **Screenshot:** ________________________

#### Service 2: ________________________
- [ ] **Status:** Suspended / Scaled to 0
- [ ] **Method:** Suspend Service (preferred) OR Scale to Zero
- [ ] **Location:** Service → Settings → Danger Zone → Suspend
- [ ] **Confirmation:** Service stopped
- [ ] **Screenshot:** ________________________

**Notes:**
- If "Suspend" option not available, use "Scale to Zero" instead
- Service configuration is preserved even when stopped

---

## Step 3: Disable Auto-Deploy

**Status:** ⏳ Pending Manual Action

### For Each Service:

#### Service 1: ________________________
- [ ] **GitHub Integration:** Disabled / Disconnected
- [ ] **Location:** Service → Settings → GitHub / Source section
- [ ] **Action Taken:** Disconnected GitHub repo / Disabled auto-deploy
- [ ] **Confirmation:** No auto-deploy active
- [ ] **Screenshot:** ________________________

#### Service 2: ________________________
- [ ] **GitHub Integration:** Disabled / Disconnected
- [ ] **Location:** Service → Settings → GitHub / Source section
- [ ] **Action Taken:** Disconnected GitHub repo / Disabled auto-deploy
- [ ] **Confirmation:** No auto-deploy active
- [ ] **Screenshot:** ________________________

**Result:** No new deployments will trigger from GitHub pushes.

---

## Step 4: Disable Email Alerts

**Status:** ⏳ Pending Manual Action

### For Each Service:

#### Service 1: ________________________
- [ ] **Email Notifications:** Disabled
- [ ] **Deployment Failure Alerts:** Disabled
- [ ] **Location:** Service → Settings → Notifications / Alerts section
- [ ] **Confirmation:** All alerts disabled
- [ ] **Screenshot:** ________________________

#### Service 2: ________________________
- [ ] **Email Notifications:** Disabled
- [ ] **Deployment Failure Alerts:** Disabled
- [ ] **Location:** Service → Settings → Notifications / Alerts section
- [ ] **Confirmation:** All alerts disabled
- [ ] **Screenshot:** ________________________

**Result:** No more failure emails will be sent.

---

## Step 5: Post-Suspension Production Verification

**Status:** ✅ Pre-verified (will re-check after suspension)

### Test Results (After Suspension):
- [ ] `/studio` endpoint: **Expected:** 200 OK
- [ ] `/api/data/plans` endpoint: **Expected:** 401 (auth required)
- [ ] Browser check: **Expected:** Page loads correctly

**Test Commands:**
```bash
# Test studio page
curl -s -o /dev/null -w "%{http_code}" https://skyras-v2.vercel.app/studio

# Test plans API (should return 401)
curl -s -o /dev/null -w "%{http_code}" https://skyras-v2.vercel.app/api/data/plans

# Check error message
curl -s https://skyras-v2.vercel.app/api/data/plans
```

**Results:** _(Fill in after suspension)_

---

## Step 6: Archive Railway Projects (After 24-48 Hours)

**Status:** ⏳ Waiting Period - Do not archive yet

**Wait Period:** 24-48 hours after suspension to confirm no issues.

### Archive Checklist:
- [ ] **Wait Period Completed:** 24-48 hours elapsed since suspension
- [ ] **No Failure Emails:** No emails received during wait period
- [ ] **Production Still Working:** Re-verified endpoints working
- [ ] **Project 1 Archived:** ________________________
- [ ] **Project 2 Archived:** ________________________
- [ ] **Screenshots:** ________________________

**Location:** Project → Settings → Danger Zone → Archive Project

**Date Archived:** ________________________

---

## Step 7: Delete Railway Projects (After 7 Days)

**Status:** ⏳ Waiting Period - Do not delete yet

**Wait Period:** 7 days after archiving to ensure no issues.

### Delete Checklist:
- [ ] **Wait Period Completed:** 7 days elapsed since archiving
- [ ] **No Issues Found:** No problems during 7-day period
- [ ] **Project 1 Deleted:** ________________________
- [ ] **Project 2 Deleted:** ________________________
- [ ] **Final Confirmation:** Projects permanently removed

**Location:** Archived Project → Settings → Danger Zone → Delete Project

**Date Deleted:** ________________________

---

## Definition of DONE

### Immediate (Steps 1-5):
- [x] Production verified working
- [ ] All Railway services suspended/scaled to zero
- [ ] Auto-deploy disabled for all services
- [ ] Email alerts disabled for all services
- [ ] Production re-verified after suspension

### After 24-48 Hours (Step 6):
- [ ] No failure emails received
- [ ] Production still working
- [ ] All projects archived in Railway

### After 7 Days (Step 7):
- [ ] All projects deleted from Railway
- [ ] Documentation updated
- [ ] Railway references cleaned from codebase (optional)

---

## Screenshot Documentation

**Directory:** `docs/railway-decommission-evidence/` (create if needed)

### Required Screenshots:
1. [ ] Railway Dashboard - Showing projects/services
2. [ ] Service Settings - Showing suspended/stopped status
3. [ ] GitHub Integration - Showing disconnected status
4. [ ] Notifications - Showing disabled alerts
5. [ ] Production Test Results - Showing endpoints working
6. [ ] Archived Projects - Showing archived status
7. [ ] Deleted Confirmation - Final deletion (if applicable)

---

## Notes & Issues

### Issues Encountered:
_(Record any problems or unexpected behavior here)_

---

## Timeline

| Step | Action | Status | Date Completed |
|------|--------|--------|----------------|
| Pre-verification | Test production endpoints | ✅ Complete | 2025-01-28 |
| 1 | Locate Railway projects | ⏳ Pending | |
| 2 | Suspend/stop services | ⏳ Pending | |
| 3 | Disable auto-deploy | ⏳ Pending | |
| 4 | Disable email alerts | ⏳ Pending | |
| 5 | Re-verify production | ⏳ Pending | |
| 6 | Archive projects (24-48h wait) | ⏳ Waiting | |
| 7 | Delete projects (7-day wait) | ⏳ Waiting | |

---

**Last Updated:** 2025-01-28  
**Next Action:** Complete Steps 1-4 in Railway dashboard