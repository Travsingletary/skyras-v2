# E2E Verification: First-Run Onboarding Experience

**Date:** 2025-01-27  
**Purpose:** Prove that the first-run onboarding experience works end-to-end in production.

---

## Production Environment Details

**Frontend URL:** `https://skyras-v2.vercel.app`  
**Onboarding Component:** `OnboardingBanner` (shows when `plans.length === 0`)  
**Demo Action:** Triggers `/api/test/golden-path` (compliance scenario) → creates workflow

---

## Test Scenarios & Verification

### Test 1: First-Run Detection (Empty Plans)

**Scenario:** User with no workflows/plans visits `/studio`

**Expected Behavior:**
1. Page loads and fetches `/api/data/plans`
2. Plans array is empty (`plans.length === 0`)
3. `OnboardingBanner` component is rendered
4. Banner shows:
   - Welcome message: "Welcome to SkyRas v2"
   - 3 bullet points explaining the system
   - "Run demo" button

**Verification Steps:**
1. Visit `https://skyras-v2.vercel.app/studio` (or use test user with no workflows)
2. Wait for plans to finish loading
3. Confirm onboarding banner appears

**Evidence:**
- ⏳ Screenshot: Banner visible on `/studio` page

---

### Test 2: Run Demo Action

**Scenario:** User clicks "Run demo" button

**Expected Flow:**
1. Button shows loading state ("Running demo...")
2. POST request to `/api/test/golden-path` with:
   ```json
   {
     "scenario": "compliance",
     "userId": "<user_id>",
     "project": "SkySky"
   }
   ```
3. Response: HTTP 200 with compliance scan results
4. Workflow created via POST `/api/workflows`:
   ```json
   {
     "userId": "<user_id>",
     "name": "Demo: Compliance Scan",
     "type": "licensing",
     "planMarkdown": "Initial demo workflow...",
     "summary": "<scan results>",
     "tasks": [...]
   }
   ```
5. Plans refresh automatically (`fetchPlans()` called)
6. Onboarding banner disappears (because `plans.length > 0`)

**Verification Steps:**
1. Click "Run demo" button
2. Observe loading state
3. Check browser network tab for:
   - `/api/test/golden-path` request (POST, 200)
   - `/api/workflows` request (POST, 200)
   - `/api/data/plans` request (GET, 200, non-empty array)
4. Confirm onboarding banner disappears
5. Confirm plans section shows new workflow

**Evidence:**
- ⏳ Screenshot: Banner gone + plan visible in Plans section
- ⏳ Network logs: Successful API calls

---

### Test 3: API Verification (Before vs After)

**Before Demo:**

**Command:**
```bash
curl https://skyras-v2.vercel.app/api/data/plans
```

**Expected Response:**
```json
{
  "success": true,
  "data": []
}
```

**After Demo:**

**Command:**
```bash
curl https://skyras-v2.vercel.app/api/data/plans
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Demo: Compliance Scan",
      "type": "licensing",
      "status": "active",
      "plan": "Initial demo workflow - compliance scan completed successfully.",
      "summary": "Compliance scan completed",
      "created_at": "2025-01-27T...",
      ...
    }
  ]
}
```

**Evidence:**
- ⏳ curl output before demo (empty array)
- ⏳ curl output after demo (workflow present)

---

## Production Verification Checklist

| Test | Expected Result | Status |
|------|----------------|--------|
| First visit shows onboarding banner | ✅ Banner visible when `plans.length === 0` | ⏳ PENDING |
| Banner appears only after plans load | ✅ No banner flash during loading | ⏳ PENDING |
| Banner shows 3 bullet points | ✅ Correct content displayed | ⏳ PENDING |
| "Run demo" button triggers golden path | ✅ POST `/api/test/golden-path` succeeds | ⏳ PENDING |
| Demo creates workflow | ✅ POST `/api/workflows` succeeds | ⏳ PENDING |
| Plans refresh after demo | ✅ GET `/api/data/plans` returns new workflow | ⏳ PENDING |
| Banner disappears after workflow exists | ✅ `plans.length > 0` hides banner | ⏳ PENDING |
| Banner stays hidden on subsequent visits | ✅ Onboarding only shows when no workflows | ⏳ PENDING |

---

## Implementation Details

**Component:** `frontend/src/components/OnboardingBanner.tsx`
- Props: `onRunDemo` (callback), `loading` (boolean)
- Styling: Blue gradient background, border, shadow
- Content: Welcome message, 3 bullet points, "Run demo" CTA

**Integration:** `frontend/src/app/studio/page.tsx`
- First-run detection: `isFirstRun = !plansLoading && plans.length === 0`
- Conditional rendering: `{isFirstRun && <OnboardingBanner ... />}`
- Demo handler: `handleRunDemo()` - triggers golden path, creates workflow, refreshes plans

**Endpoints Used:**
- `GET /api/data/plans` - Check for existing workflows
- `POST /api/test/golden-path` - Run compliance demo
- `POST /api/workflows` - Create workflow after demo

---

## Known Limitations

1. **User Isolation:** Onboarding is per-browser (uses localStorage userId). Different browsers/devices show onboarding independently.
2. **Workflow Cleanup:** To test onboarding again, workflows must be deleted or a new user ID must be used.
3. **Loading State:** Plans loading state prevents banner flash, but brief delay may be visible.

---

## Related Documentation

- `frontend/src/components/OnboardingBanner.tsx` - Onboarding component
- `frontend/src/app/studio/page.tsx` - Studio page with onboarding integration
- `docs/E2E_PLANS_PROOF.md` - Plans endpoint verification

---

**Last Verified:** ⏳ PENDING  
**Next Verification:** After production deployment verification
