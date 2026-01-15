# Bug Backlog

**Last Updated:** 2025-01-28  
**Status:** Prioritized by severity and impact

---

## 🔴 Critical Priority (Blockers)

### BUG-001: Root Route Redirects to Signup Instead of Showing Content
- **Severity:** High
- **Status:** Open
- **Assignee:** TBD
- **Estimated Effort:** 1-2 hours
- **Route:** `/`
- **Files:** `frontend/src/app/page.tsx`
- **Description:** Root route immediately redirects to `/signup` instead of showing landing page content or unstuck interface.
- **Steps to Reproduce:**
  1. Navigate to `https://skyras-v2.vercel.app/`
  2. Observe redirect to `/signup`
- **Expected:** Show landing page content OR unstuck interface if not authenticated
- **Actual:** Redirects to `/signup` immediately
- **Fix Approach:**
  - Review auth check logic in `page.tsx`
  - Ensure redirect only happens after content check
  - Or remove redirect and show content with auth prompt
- **Dependencies:** None

---

### BUG-002: Dashboard Routes Use localStorage Instead of Auth Session
- **Severity:** High
- **Status:** Open
- **Assignee:** TBD
- **Estimated Effort:** 4-6 hours
- **Routes:** `/dashboard`, `/workflows`, `/analytics`
- **Files:**
  - `frontend/src/app/dashboard/page.tsx` (line 44-46)
  - `frontend/src/app/workflows/page.tsx` (line 44-46)
  - `frontend/src/app/analytics/page.tsx` (line 16-18)
- **Description:** Dashboard, workflows, and analytics pages read `userId` from localStorage instead of using authenticated Supabase session.
- **Steps to Reproduce:**
  1. Log in via Supabase Auth
  2. Navigate to `/dashboard`
  3. Observe empty state (no workflows shown)
  4. Check localStorage - `userId` may not be set
- **Expected:** Use authenticated user ID from Supabase session via `/api/auth/user`
- **Actual:** Reads `userId` from localStorage (legacy approach)
- **Fix Approach:**
  - Update all three routes to call `/api/auth/user` on mount
  - Use authenticated `userId` from response
  - Pass `userId` to API calls instead of localStorage value
  - Remove localStorage dependency
- **Dependencies:** Supabase Auth must be working

---

## 🟡 High Priority (Workflow Blockers)

### BUG-003: Missing Error Handling for Auth Failures
- **Severity:** Medium
- **Status:** Open
- **Assignee:** TBD
- **Estimated Effort:** 2-3 hours
- **Routes:** All authenticated routes
- **Files:** All authenticated route pages
- **Description:** Authenticated routes may show blank pages or unhandled errors if auth check fails (network error, etc.).
- **Steps to Reproduce:**
  1. Navigate to `/studio` while logged out
  2. Should redirect to `/login?next=/studio`
  3. But if auth check fails (network error, etc.), may show blank page
- **Expected:** Graceful error handling with user-friendly messages
- **Actual:** May show blank page or unhandled errors
- **Fix Approach:**
  - Add error boundaries to authenticated routes
  - Add try/catch around auth checks
  - Show user-friendly error messages
  - Add retry logic for network failures
- **Dependencies:** None

---

### BUG-006: File Upload May Fail Silently
- **Severity:** Medium
- **Status:** Open
- **Assignee:** TBD
- **Estimated Effort:** 3-4 hours
- **Routes:** `/app`, `/studio`
- **Files:**
  - `frontend/src/app/api/upload/route.ts`
  - Upload UI components
- **Description:** File upload may fail silently or show generic error if Supabase Storage bucket is not configured.
- **Steps to Reproduce:**
  1. Try to upload file without Supabase Storage bucket configured
  2. May show generic error or no feedback
- **Expected:** Clear error message about missing storage configuration
- **Actual:** May fail silently or show generic error
- **Fix Approach:**
  - Review `/api/upload` error handling
  - Add specific error messages for storage issues
  - Show user-friendly feedback in UI
  - Add validation for storage bucket existence
- **Dependencies:** None

---

## 🟢 Medium Priority (UX Improvements)

### BUG-004: Inconsistent Auth State Management
- **Severity:** Medium
- **Status:** Open
- **Assignee:** TBD
- **Estimated Effort:** 3-4 hours
- **Routes:** Multiple
- **Files:** Auth-related components and hooks
- **Description:** Auth state may not sync across browser tabs, requiring manual refresh.
- **Steps to Reproduce:**
  1. Log in on one tab
  2. Open `/studio` in another tab
  3. May not detect auth state immediately
- **Expected:** Consistent auth state across tabs
- **Actual:** May require refresh or manual check
- **Fix Approach:**
  - Implement `storage` event listener for cross-tab auth sync
  - Or use Supabase realtime for auth state
  - Ensure auth checks happen on mount and window focus
- **Dependencies:** None

---

### BUG-005: Missing Loading States on Some Routes
- **Severity:** Low
- **Status:** Open
- **Assignee:** TBD
- **Estimated Effort:** 2-3 hours
- **Routes:** `/projects/[id]`, `/workflows/[id]`
- **Files:**
  - `frontend/src/app/projects/[id]/page.tsx`
  - `frontend/src/app/workflows/[id]/page.tsx`
- **Description:** Detail pages may show blank content during data fetch instead of loading spinner.
- **Steps to Reproduce:**
  1. Navigate to project/workflow detail page
  2. During data fetch, may show blank content
- **Expected:** Loading spinner or skeleton UI
- **Actual:** Blank content during fetch
- **Fix Approach:**
  - Add loading state management to detail pages
  - Show skeleton UI during fetch
  - Add error states for failed fetches
- **Dependencies:** None

---

### BUG-007: Workflow Auto-Refresh May Cause Performance Issues
- **Severity:** Low
- **Status:** Open
- **Assignee:** TBD
- **Estimated Effort:** 3-4 hours
- **Route:** `/workflows`
- **Files:** `frontend/src/app/workflows/page.tsx` (line 74-76)
- **Description:** Workflows page polls every 5 seconds regardless of data changes, which may cause performance issues with many workflows.
- **Steps to Reproduce:**
  1. Navigate to `/workflows`
  2. Observe auto-refresh every 5 seconds
  3. With many workflows, may cause performance issues
- **Expected:** Efficient polling or realtime updates
- **Actual:** Polls every 5 seconds regardless of data changes
- **Fix Approach:**
  - Use Supabase realtime subscriptions instead of polling
  - Or increase polling interval
  - Or add manual refresh button
  - Or pause polling when tab is not visible
- **Dependencies:** None

---

## 📋 Backlog Summary

| Bug ID | Severity | Effort | Status | Phase |
|--------|----------|--------|--------|-------|
| BUG-001 | High | 1-2h | Open | Phase 1 |
| BUG-002 | High | 4-6h | Open | Phase 1 |
| BUG-003 | Medium | 2-3h | Open | Phase 1 |
| BUG-006 | Medium | 3-4h | Open | Phase 2 |
| BUG-004 | Medium | 3-4h | Open | Phase 3 |
| BUG-005 | Low | 2-3h | Open | Phase 2 |
| BUG-007 | Low | 3-4h | Open | Phase 3 |

**Total Estimated Effort:** 18-26 hours for bug fixes

---

## Testing Status

### Verified Working
- ✅ `/guide` - Content displays correctly
- ✅ `/login` - Form structure present
- ✅ `/signup` - Form structure present
- ✅ `/api/auth/user` - Endpoint exists
- ✅ `/api/chat` - Supports public and authenticated access

### Requires Live Testing
- ⏳ `/studio` - Requires auth session
- ⏳ `/projects` - Requires auth and data
- ⏳ `/projects/[id]` - Requires project data
- ⏳ `/dashboard` - Requires auth (currently broken with localStorage)
- ⏳ `/workflows` - Requires auth (currently broken with localStorage)
- ⏳ `/library` - Requires auth and files
- ⏳ `/analytics` - Requires auth (currently broken with localStorage)
- ⏳ `/app` - Requires testing with access code

### Known Issues
- ❌ Root redirect (BUG-001)
- ❌ localStorage usage in dashboard routes (BUG-002)
- ❌ Missing error handling (BUG-003)
- ❌ Missing loading states (BUG-005)
- ❌ File upload error handling (BUG-006)
- ❌ Auth state sync (BUG-004)
- ❌ Workflow polling (BUG-007)

---

**End of Bug Backlog**
