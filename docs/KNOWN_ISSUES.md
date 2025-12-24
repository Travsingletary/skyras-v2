# Known Issues - SkyRas v2

**Last Updated:** 2025-01-27  
**Purpose:** List all observed issues, broken flows, and risks. No assumptions.

---

## Critical Issues

### 1. Router Not Owning Final Response (FIXED - Pending Verification)
- **Location:** `src/agents/marcus/marcusAgent.ts`, `frontend/src/agents/marcus/marcusAgent.ts`
- **Issue:** Final user-visible response was not being constructed at the Marcus routing boundary. Giorgio output was reaching the UI before Marcus could stamp proof prefix.
- **Fix Applied:** 
  - Marcus now owns final response construction at a single point (after all agent executions)
  - Proof prefix `ROUTE_OK: Marcus→Giorgio | FLOW_OK: ` is added at final response construction
  - Prefix is guaranteed to be at the start of the response when routing to Giorgio
- **Status:** FIXED - Requires production verification
- **Verification:** UI response must START with `ROUTE_OK: Marcus→Giorgio | FLOW_OK: ` when routing to Giorgio

### 2. Jamal Publishing System - No Platform Integrations
- **Location:** `src/lib/jamal/publishingWorker.ts`, `src/lib/socialPostingClient.ts`
- **Issue:** All platform API calls are TODO comments. No actual publishing to Instagram, TikTok, LinkedIn, Twitter, Facebook, or YouTube.
- **Evidence:** 
  - Line 85 in `publishingWorker.ts`: `// TODO: Call platform-specific publishing function`
  - Line 186: `* TODO: Integrate with Instagram Graph API, TikTok API, etc.`
  - Line 195: `// TODO: Implement actual platform API calls`
- **Impact:** Publishing features are non-functional despite UI/API structure existing.
- **Risk:** Users may think publishing works but nothing actually posts.

### 2. Supabase Database Tables May Not Exist
- **Location:** `src/lib/database.ts`
- **Issue:** Code assumes tables exist but no migration system verified.
- **Tables Referenced:**
  - `projects`
  - `files`
  - `workflows`
  - `workflow_tasks`
  - `file_processing`
  - `calendar_events`
  - `daily_plans`
  - `daily_plan_blocks`
  - `google_oauth_tokens`
  - `push_notification_tokens`
  - `assets` (for Letitia)
- **Impact:** Database operations will fail if tables don't exist.
- **Risk:** Silent failures or error messages that don't clearly indicate missing tables.

### 3. Environment Variable Inconsistencies
- **Location:** Multiple files
- **Issue:** Code checks for both `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_SECRET_KEY`, but Vercel may only have one set.
- **Evidence:**
  - `frontend/src/app/api/uploads/sign/route.ts` checks both
  - `frontend/src/backend/supabaseClient.ts` checks both
- **Impact:** Storage operations may fail if wrong variable name is used.
- **Risk:** File uploads fail silently or with unclear errors.

---

## High Priority Issues

### 4. Rate Limit Tracking Not Implemented
- **Location:** `src/lib/jamal/guardrails.ts`, `src/lib/jamal/publishingWorker.ts`
- **Issue:** Rate limit checking structure exists but actual tracking is stubbed.
- **Evidence:**
  - Line 95 in `guardrails.ts`: `// TODO: Implement actual rate limit tracking`
  - Line 209 in `publishingWorker.ts`: `// TODO: Implement rate limit tracking`
- **Impact:** Cannot enforce rate limits even if platform APIs were implemented.
- **Risk:** Could exceed platform rate limits if publishing worked.

### 5. Video Generation Incomplete
- **Location:** `frontend/src/app/api/tools/generateVideo/route.ts`
- **Issue:** Video generation initiates but polling/completion handling is incomplete.
- **Impact:** Videos may be generated but status never reported to user.
- **Risk:** Users think generation failed when it actually succeeded.

### 6. Google Calendar Integration Not Tested
- **Location:** `src/app/api/auth/google/`, `src/lib/googleCalendar/`
- **Issue:** OAuth flow exists but not fully tested. Calendar operations may fail.
- **Evidence:**
  - Line 74 in `calendarService.ts`: `timeZone: 'America/Los_Angeles', // TODO: Get from user preferences`
- **Impact:** Morning meeting calendar sync may not work.
- **Risk:** Calendar events not created or synced incorrectly.

### 7. Firebase Push Notifications Not Implemented
- **Location:** `src/app/api/push/register/route.ts`
- **Issue:** Token registration exists but actual push sending is not implemented.
- **Impact:** Push notifications cannot be sent even if tokens are registered.
- **Risk:** Users expect notifications but none are sent.

---

## Medium Priority Issues

### 8. User Preferences Hard-Coded
- **Location:** `src/agents/marcus/marcusPreferences.ts`
- **Issue:** User preferences are hard-coded, not loaded from database.
- **Evidence:**
  - Line 50: `* TODO: In the future, load from Supabase user_preferences table`
- **Impact:** All users get same preferences (Trav's preferences).
- **Risk:** Multi-user support doesn't work correctly.

### 9. Debug Telemetry Calls in Production Code
- **Location:** Multiple files
- **Issue:** Debug telemetry calls to `http://127.0.0.1:7243/ingest/` in production code.
- **Files Affected:**
  - `src/lib/fileStorage.supabase.ts`
  - `src/backend/supabaseClient.ts`
  - `src/app/api/upload/route.ts`
- **Impact:** Unnecessary network calls that will fail in production.
- **Risk:** Performance impact, error noise in logs.

### 10. Missing Error Handling in Some API Routes
- **Location:** Various API routes
- **Issue:** Some routes may not handle all error cases gracefully.
- **Impact:** Users see unclear error messages or 500 errors.
- **Risk:** Poor user experience, difficult debugging.

### 11. Agent Memory Redis Dependency Not Verified
- **Location:** `src/agents/core/BaseAgent.ts`
- **Issue:** Agents use memory context but Redis connection not verified in all contexts.
- **Impact:** Memory operations may fail silently.
- **Risk:** Conversation history not saved/retrieved correctly.

### 12. Workflow Auto-Execution Not Integrated
- **Location:** `src/lib/autoExecute.ts`
- **Issue:** Auto-execution logic exists but not called from workflow execution.
- **Impact:** Workflows must be manually executed.
- **Risk:** Users expect automatic execution but it doesn't happen.

### 13. Task Dependency Resolution Not Used
- **Location:** `frontend/src/lib/taskDependencies.ts`
- **Issue:** Dependency resolution logic exists but not integrated into workflow execution.
- **Impact:** Tasks may execute out of order.
- **Risk:** Workflow execution fails or produces incorrect results.

---

## Low Priority Issues

### 14. Analytics Returns Mock Data
- **Location:** `src/app/api/analytics/route.ts`
- **Issue:** Analytics endpoint returns mock data, not real analytics.
- **Impact:** Analytics dashboard shows fake data.
- **Risk:** Misleading analytics information.

### 15. Agent Status Dashboard Not Functional
- **Location:** `frontend/components/AgentStatusDashboard.tsx`
- **Issue:** Component exists but no backend support for real-time status.
- **Impact:** Dashboard may not display accurate agent status.
- **Risk:** Users see incorrect agent status information.

### 16. Debug Logging in Production
- **Location:** `frontend/src/app/app/page.tsx`
- **Issue:** Debug console.log statements in production code.
- **Evidence:**
  - Line 44: `console.log('[DEBUG] Messages state updated:', messages.length, 'messages:', messages);`
- **Impact:** Console noise in production.
- **Risk:** Performance impact, potential information leakage.

### 17. Access Code Placeholder Handling
- **Location:** `frontend/src/app/app/page.tsx`
- **Issue:** Code handles placeholder `"your-secret-passcode-here"` as "no access code needed" but this is a workaround.
- **Impact:** Works but is a code smell.
- **Risk:** Confusing for developers, potential security issue if misunderstood.

### 18. Python Microservices Not Integrated
- **Location:** `services/hub/`, `services/marcus/`, `services/letitia/`
- **Issue:** FastAPI services exist but not deployed or integrated with main app.
- **Impact:** Separate service architecture not used.
- **Risk:** Confusion about which services are actually running.

### 19. AgentKit Workflows Not Integrated
- **Location:** `agentkit/workflows/`
- **Issue:** Workflow files exist but not called from main app.
- **Impact:** Separate workflow system not used.
- **Risk:** Confusion about which workflow system is active.

---

## Environment Variable Issues

### 20. Missing Environment Variables in Vercel
- **Issue:** Some required variables may not be set in all Vercel environments.
- **Documented In:** `VERCEL_ENV_ACTION_REQUIRED.md`, `VERCEL_ENV_STILL_NEEDED.md`
- **Impact:** Features fail in certain environments.
- **Risk:** Production/preview/development inconsistencies.

### 21. Environment Variable Name Inconsistencies
- **Issue:** Code checks for both old and new variable names (e.g., `SUPABASE_SERVICE_ROLE_KEY` vs `SUPABASE_SECRET_KEY`).
- **Impact:** Works but creates confusion.
- **Risk:** Developers may set wrong variable name.

---

## UI/UX Issues

### 22. No Loading States for Some Operations
- **Location:** Various components
- **Issue:** Some async operations don't show loading indicators.
- **Impact:** Users don't know if operation is in progress.
- **Risk:** Users click multiple times, causing duplicate operations.

### 23. Error Messages May Be Unclear
- **Location:** Various API routes and components
- **Issue:** Some error messages are technical or unclear.
- **Impact:** Users don't understand what went wrong.
- **Risk:** Poor user experience, support burden.

---

## Data Integrity Issues

### 24. No Data Validation in Some Endpoints
- **Location:** Various API routes
- **Issue:** Some endpoints don't validate input data before processing.
- **Impact:** Invalid data may be stored or cause errors.
- **Risk:** Data corruption, application crashes.

### 25. No Foreign Key Constraints Verified
- **Location:** Database operations
- **Issue:** Code assumes foreign key relationships but constraints may not exist.
- **Impact:** Orphaned records possible.
- **Risk:** Data integrity issues.

---

## Security Issues

### 26. Access Code Stored in localStorage
- **Location:** `frontend/src/app/app/page.tsx`
- **Issue:** Access code stored in localStorage (not encrypted).
- **Impact:** Access code visible in browser storage.
- **Risk:** Low security if access code is compromised.

### 27. No Rate Limiting on API Routes
- **Location:** All API routes
- **Issue:** No rate limiting implemented on API endpoints.
- **Impact:** API can be abused or overwhelmed.
- **Risk:** DoS attacks, excessive API costs.

### 28. Service Role Key Used in Client-Side Code
- **Location:** `frontend/src/backend/supabaseClient.ts`
- **Issue:** Service role key may be exposed in client bundle if not properly configured.
- **Impact:** Full database access if key is exposed.
- **Risk:** Critical security vulnerability.

---

## Performance Issues

### 29. No Caching Strategy
- **Location:** Various API routes
- **Issue:** No caching implemented for frequently accessed data.
- **Impact:** Repeated database queries for same data.
- **Risk:** Slow response times, high database load.

### 30. Large File Uploads May Timeout
- **Location:** `frontend/src/app/api/uploads/sign/route.ts`
- **Issue:** No explicit timeout handling for large file uploads.
- **Impact:** Large uploads may fail without clear error.
- **Risk:** Poor user experience for large files.

---

## Documentation Issues

### 31. Incomplete Documentation
- **Issue:** Many features lack clear documentation.
- **Impact:** Difficult for new developers to understand system.
- **Risk:** Incorrect usage, bugs from misunderstanding.

### 32. Contradictory Documentation
- **Issue:** Multiple documentation files may contradict each other.
- **Impact:** Confusion about actual system state.
- **Risk:** Wrong assumptions about functionality.

---

## Reality Check - Contradictions Found

### Contradiction 1: PROJECT_REALITY.md Claims vs. Proof Requirements
- **Claim:** Many features marked as "✅ WORKING"
- **Reality:** No E2E proof exists for most features
- **Cause:** Status was based on code inspection, not actual testing
- **Resolution:** All "WORKING" items downgraded to "PARTIAL" pending verification
- **Where to Look:** `docs/PROJECT_REALITY.md` - all items now require E2E proof

### Contradiction 2: Database Operations Claimed Working
- **Claim:** Database layer marked as "✅ WORKING"
- **Reality:** Tables may not exist, operations not verified
- **Cause:** Code exists but no verification that tables are created
- **Resolution:** Downgraded to "PARTIAL" - requires table verification
- **Where to Look:** Supabase dashboard → verify table existence

### Contradiction 3: File Upload Claimed Working
- **Claim:** File upload marked as "✅ WORKING"
- **Reality:** E2E flow not verified (upload → storage → confirmation)
- **Cause:** Routes exist but complete flow not tested
- **Resolution:** Downgraded to "PARTIAL" - requires E2E test
- **Where to Look:** Test complete upload flow and verify file in Supabase Storage

### Contradiction 4: Voice Features Claimed Working
- **Claim:** STT and TTS marked as "✅ WORKING"
- **Reality:** E2E flows not verified (record → transcribe, click → play)
- **Cause:** API routes exist but UI integration not verified
- **Resolution:** Downgraded to "PARTIAL" - requires E2E test
- **Where to Look:** Test mic button → transcription → input, test play button → audio

### Contradiction 5: Agent Actions Claimed Working
- **Claim:** Multiple agent actions marked as "✅ WORKING"
- **Reality:** No E2E proof that actions are called and return results to UI
- **Cause:** Functions exist but delegation flow not verified end-to-end
- **Resolution:** Downgraded to "PARTIAL" - reference flow pending verification
- **Where to Look:** `docs/END_TO_END_FLOW.md` - test reference flow

### Contradiction 6: API Routes Claimed Working
- **Claim:** Multiple API routes marked as "✅ WORKING"
- **Reality:** Routes exist but E2E calls from UI not verified
- **Cause:** Code inspection showed routes exist, but no proof of actual usage
- **Resolution:** Downgraded to "PARTIAL" - requires E2E verification
- **Where to Look:** Test each route from UI and verify responses

### Contradiction 7: Reference Flow Status
- **Claim:** Flow defined and proof signal added
- **Reality:** Flow not yet verified working
- **Cause:** Proof signal added but manual test not completed
- **Resolution:** Status remains "PENDING VERIFICATION"
- **Where to Look:** `docs/END_TO_END_FLOW.md` - follow test steps

---

## Verification

This list was created by:
1. Reading source code for TODO/FIXME comments
2. Checking error handling patterns
3. Reviewing environment variable usage
4. Examining API route implementations
5. Comparing PROJECT_REALITY.md claims against Definition of Done
6. No assumptions - only verified issues

---

## Update Process

When fixing issues:
1. Update this document with resolution
2. Remove issue if fully resolved
3. Add new issues as discovered
4. Never assume issues are fixed without verification
5. Update Reality Check section when contradictions are found

