# E2E Verification: Auth-Derived Identity

**Date:** 2025-12-28
**Purpose:** Prove that user identity is derived server-side from auth session and that client-supplied userId parameters have been eliminated.

---

## Implementation Status

**Current Status:** ✅ **Infrastructure Complete** (Auth setup pending)

### What Has Been Implemented

1. **Auth Utility Created** (`frontend/src/lib/auth.ts`)
   - `getAuthenticatedUserId()` function extracts user identity from Supabase auth session
   - Supports Authorization header (Bearer token) and cookies
   - Returns `null` if no valid session found

2. **API Routes Updated**
   - ✅ `/api/data/plans` - Derives userId from auth session, requires authentication
   - ✅ `/api/workflows` (GET) - Derives userId from auth session, returns only user's workflows
   - ✅ `/api/workflows` (POST) - Derives userId from auth session, creates workflows for authenticated user only

3. **RLS Policies Updated**
   - ✅ `workflows` table: User-isolated policies using `auth.uid()`
   - ✅ `workflow_tasks` table: User-isolated policies via workflows table
   - ✅ Removed permissive "Allow all" policies

4. **Client Code Updated**
   - ✅ Studio page: Removed userId from `/api/data/plans` calls
   - ✅ Studio page: Removed userId from `/api/workflows` calls
   - ✅ Studio page: Removed userId from `/api/test/golden-path` calls (for demo workflow creation)

---

## Current Limitation

**Important:** Supabase Auth is not yet fully implemented in the application.

- The `getAuthenticatedUserId()` function will return `null` until auth sessions are established
- API endpoints will return HTTP 401 (Authentication required) until auth is set up
- This is the correct security behavior (endpoints require authentication)

**Next Steps for Full Implementation:**
1. Implement Supabase Auth client-side (sign up/login UI)
2. Pass auth tokens via Authorization header or cookies
3. Once auth is configured, `getAuthenticatedUserId()` will extract user identity from sessions

---

## Production Verification (Pending Auth Implementation)

### Test Scenario 1: Unauthenticated Request (Expected 401)

**Endpoint:** `https://skyras-v2.vercel.app/api/data/plans`

**Command:**
```bash
curl https://skyras-v2.vercel.app/api/data/plans
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Authentication required"
}
```
**Status:** HTTP 401

**Log Evidence:**
```
[AUTH] derived_user=false route=/api/data/plans
```

---

### Test Scenario 2: Authenticated Request (When Auth is Implemented)

**Endpoint:** `https://skyras-v2.vercel.app/api/data/plans`

**Command (with auth token):**
```bash
curl -H "Authorization: Bearer <supabase_access_token>" \
  https://skyras-v2.vercel.app/api/data/plans
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Workflow Name",
      "type": "creative",
      "status": "active",
      ...
    }
  ]
}
```
**Status:** HTTP 200

**Log Evidence:**
```
[AUTH] derived_user=true route=/api/data/plans
[GET /api/data/plans] Returned 1 plan(s) for authenticated user, project filter: none
```

---

### Test Scenario 3: Workflow Creation (When Auth is Implemented)

**Endpoint:** `https://skyras-v2.vercel.app/api/workflows`

**Command:**
```bash
curl -X POST https://skyras-v2.vercel.app/api/workflows \
  -H "Authorization: Bearer <supabase_access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Workflow",
    "type": "creative",
    "planMarkdown": "Test workflow for auth verification",
    "tasks": [{"title": "Test task", "description": "Test"}]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "workflow": {
      "id": "uuid",
      "user_id": "<auth_user_id>",
      "name": "Test Workflow",
      ...
    },
    "tasks": [...]
  }
}
```
**Status:** HTTP 200

**Verification:**
- Workflow `user_id` matches authenticated user's ID
- User can only see their own workflows
- Another authenticated user cannot see this workflow

**Log Evidence:**
```
[AUTH] derived_user=true route=/api/workflows
```

---

### Test Scenario 4: Cross-User Isolation (When Auth is Implemented)

**Setup:**
1. Authenticate as User A
2. Create a workflow as User A
3. Authenticate as User B
4. Attempt to fetch workflows

**Command (as User B):**
```bash
curl -H "Authorization: Bearer <user_b_token>" \
  https://skyras-v2.vercel.app/api/data/plans
```

**Expected Behavior:**
- User B's workflows list does NOT include User A's workflow
- RLS policies enforce isolation at the database level

---

## RLS Policy Verification

**Workflows Table Policies:**
- ✅ `Users can view their own workflows` - Uses `auth.uid()::text = user_id`
- ✅ `Users can insert their own workflows` - Uses `auth.uid()::text = user_id`
- ✅ `Users can update their own workflows` - Uses `auth.uid()::text = user_id`
- ✅ `Users can delete their own workflows` - Uses `auth.uid()::text = user_id`

**Workflow Tasks Table Policies:**
- ✅ `Users can view tasks in their workflows` - Via workflows.user_id = auth.uid()::text
- ✅ `Users can update tasks in their workflows` - Via workflows.user_id = auth.uid()::text
- ✅ `Users can delete tasks in their workflows` - Via workflows.user_id = auth.uid()::text

**Policy Verification SQL:**
```sql
-- View current policies
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('workflows', 'workflow_tasks')
ORDER BY tablename, policyname;
```

---

## Code Changes Summary

### Files Modified

1. **`frontend/src/lib/auth.ts`** (NEW)
   - `getAuthenticatedUserId()` - Extracts user from auth session
   - `logAuthIdentity()` - Logs auth-derived identity (no PII)

2. **`frontend/src/app/api/data/plans/route.ts`**
   - Removed `userId` query parameter
   - Uses `getAuthenticatedUserId(request)` to derive user identity
   - Returns 401 if not authenticated
   - Always filters by authenticated user's workflows

3. **`frontend/src/app/api/workflows/route.ts`**
   - GET: Removed `userId` query parameter, uses auth-derived identity
   - POST: Removed `userId` from request body, uses auth-derived identity
   - Returns 401 if not authenticated
   - Creates workflows with authenticated user's ID

4. **`frontend/src/app/studio/page.tsx`**
   - Removed `userId` from `/api/data/plans` fetch calls
   - Removed `userId` from `/api/workflows` POST calls
   - Removed `userId` from `/api/test/golden-path` calls (for demo workflow creation)

### Database Migrations

1. **`update_workflows_rls_for_auth`**
   - Dropped permissive "Allow all" policies
   - Created user-isolated policies using `auth.uid()::text = user_id`

2. **`update_workflow_tasks_rls_for_auth`**
   - Dropped permissive "Allow all" policies
   - Ensured user-isolated policies via workflows table

---

## Security Benefits

✅ **No Client-Supplied Identity:** User ID cannot be spoofed or manipulated by clients  
✅ **Server-Side Validation:** All user identity is extracted server-side from auth session  
✅ **Database-Level Enforcement:** RLS policies ensure users can only access their own data  
✅ **Defense in Depth:** Even if application logic fails, RLS prevents cross-user access  

---

## Definition of DONE Status

- ✅ No endpoint accepts or requires userId from the client (for `/api/data/plans` and `/api/workflows`)
- ✅ All user scoping is server-derived (infrastructure ready, requires auth setup)
- ✅ RLS prevents cross-user access (policies updated and active)
- ⏳ Production E2E proof (pending Supabase Auth implementation)

---

## Notes

**Routes Not Yet Updated:**
- `/api/chat` - Still accepts userId (may need update if it writes user-scoped data)
- `/api/test/golden-path` - Still accepts userId (test endpoint, may need update)
- `/api/upload` - Still accepts userId (may need update if it writes user-scoped data)

These routes can be updated in a future phase when their user-scoping requirements are clarified.

---

**Last Updated:** 2025-12-28  
**Status:** Infrastructure complete, pending Supabase Auth implementation for full E2E verification
