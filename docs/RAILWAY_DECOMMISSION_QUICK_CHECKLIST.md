# Railway Decommission - Quick Checklist

**Use this checklist while in the Railway dashboard**

---

## ✅ PRE-FLIGHT CHECK

- [ ] Production verified: https://skyras-v2.vercel.app/studio → 200 OK
- [ ] Production verified: https://skyras-v2.vercel.app/api/data/plans → 401 (auth required)
- [ ] Railway dashboard open: https://railway.app

---

## STEP 1: FIND PROJECTS (5 minutes)

- [ ] Logged into Railway dashboard
- [ ] Found project: `skyras` or `skyras-v2`
- [ ] Counted number of services in project: ____
- [ ] Listed service names:
  1. ________________________
  2. ________________________
  3. ________________________
- [ ] Screenshot: Railway dashboard with projects visible

---

## STEP 2: SUSPEND EACH SERVICE (2 minutes per service)

**For EACH service found:**

- [ ] Click on service
- [ ] Go to **Settings** tab
- [ ] Scroll to **"Danger Zone"** section
- [ ] Click **"Suspend Service"** (or "Scale to Zero" if suspend not available)
- [ ] Confirm suspension
- [ ] Verify service status shows "Suspended" or "Stopped"
- [ ] Screenshot: Service showing suspended/stopped status

**Repeat for each service.**

---

## STEP 3: DISABLE AUTO-DEPLOY (2 minutes per service)

**For EACH service:**

- [ ] Click on service
- [ ] Go to **Settings** tab
- [ ] Find **"GitHub"** or **"Source"** section
- [ ] Click **"Disconnect"** or toggle **"Auto-Deploy"** to OFF
- [ ] Confirm disconnection
- [ ] Verify "Auto-Deploy" shows as disabled
- [ ] Screenshot: GitHub integration showing disconnected

**Repeat for each service.**

---

## STEP 4: DISABLE EMAIL ALERTS (2 minutes per service)

**For EACH service:**

- [ ] Click on service
- [ ] Go to **Settings** tab
- [ ] Find **"Notifications"** or **"Alerts"** section
- [ ] Disable **"Email Notifications"**
- [ ] Disable **"Deployment Failure Alerts"**
- [ ] Save changes
- [ ] Verify all alerts show as disabled
- [ ] Screenshot: Notifications showing all alerts disabled

**Repeat for each service.**

---

## STEP 5: FINAL VERIFICATION (2 minutes)

Run these commands to verify production still works:

```bash
# Should return 200
curl -s -o /dev/null -w "%{http_code}" https://skyras-v2.vercel.app/studio

# Should return 401
curl -s -o /dev/null -w "%{http_code}" https://skyras-v2.vercel.app/api/data/plans
```

- [ ] `/studio` returns: ____ (should be 200)
- [ ] `/api/data/plans` returns: ____ (should be 401)
- [ ] Production working correctly ✅

---

## ✅ COMPLETE - STEPS 1-4 DONE

**What you've accomplished:**
- ✅ All services suspended/stopped
- ✅ Auto-deploy disabled
- ✅ Email alerts disabled
- ✅ Production verified working

**Next Steps:**
- Wait 24-48 hours
- Monitor for any failure emails (should receive none)
- Then proceed to Step 6: Archive projects (see `RAILWAY_DECOMMISSION_GUIDE.md`)

---

## NOTES

**Total Estimated Time:** ~15-20 minutes for all steps

**Troubleshooting:**
- Can't find "Suspend"? Use "Scale to Zero" instead
- Service won't suspend? Wait for any active deployments to finish
- Production breaks? Immediately restore service and investigate

---

**Last Updated:** 2025-01-28