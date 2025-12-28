# Next Safe Steps - SkyRas v2

**Last Updated:** 2025-01-27  
**Purpose:** Define the NEXT 5 SAFE ACTIONS that stabilize the system without adding features or breaking existing functionality.

---

## Principles

1. **Do NOT add new features**
2. **Do NOT break existing functionality**
3. **Do NOT refactor unless required to fix breakage**
4. **Prefer documentation over code changes**
5. **Treat missing code as missing truth**

---

## Step 1: Verify and Document Database Schema ✅ COMPLETE

### Action
Verify which Supabase tables actually exist and document the schema.

### Status
✅ **COMPLETED** - 2025-01-27

### Results
1. ✅ Connected to Supabase via MCP tools
2. ✅ Listed all 32 tables in the database
3. ✅ Documented complete schema in `docs/DATABASE_SCHEMA.md`
4. ✅ Identified missing table: `studio_plans` (does NOT exist)
5. ✅ Found correct table: `workflows` (exists with 5 rows, has `plan_markdown` field)

### Key Findings
- **Missing Table:** `studio_plans` - Referenced in `src/app/api/data/plans/route.ts` but doesn't exist
- **Correct Table:** `workflows` - Contains plan data in `plan_markdown` column
- **Action Required:** Update `/api/data/plans` to query `workflows` table instead

### Files Created
- `docs/DATABASE_SCHEMA.md` - Complete schema documentation

### Next Action
- ✅ Fix `/api/data/plans/route.ts` to use `workflows` table (see implementation below)

### Risk Level
🟢 **LOW** - Read-only operation ✅ Complete

---

## Step 2: Remove Debug Telemetry Calls

### Action
Remove or disable debug telemetry calls to `http://127.0.0.1:7243/ingest/` in production code.

### Why Safe
- Removes unnecessary network calls
- No functional impact (calls are already failing silently)
- Reduces code noise

### Steps
1. Search for all instances of `127.0.0.1:7243` in codebase
2. Comment out or remove telemetry calls
3. Add comment explaining why removed
4. Test that functionality still works
5. Update `docs/KNOWN_ISSUES.md` to mark issue as resolved

### Files to Update
- `src/lib/fileStorage.supabase.ts`
- `src/backend/supabaseClient.ts`
- `src/app/api/upload/route.ts`

### Success Criteria
- All debug telemetry calls removed
- No functionality broken
- Code is cleaner

### Risk Level
🟢 **LOW** - Removing non-functional code

---

## Step 3: Standardize Environment Variable Names

### Action
Choose one naming convention for Supabase service key and update all code to use it consistently.

### Why Safe
- Code already supports both names
- Just need to pick one and document it
- Can update code gradually

### Steps
1. Decide on standard name: `SUPABASE_SECRET_KEY` (newer) or `SUPABASE_SERVICE_ROLE_KEY` (older)
2. Update `env.example` and `frontend/env.example` to use standard name
3. Update code comments to reference standard name
4. Document in `docs/ARCHITECTURE_OVERVIEW.md`
5. Keep fallback support for both names (for backward compatibility)
6. Update Vercel environment variables to use standard name

### Success Criteria
- One standard name documented
- Code still supports both (backward compatible)
- Environment variable examples updated

### Risk Level
🟡 **MEDIUM** - Requires environment variable updates but code remains backward compatible

---

## Step 4: Add Input Validation to Critical API Routes

### Action
Add basic input validation to API routes that create/update data.

### Why Safe
- Prevents invalid data from being stored
- Doesn't change functionality, just adds safety checks
- Reduces risk of data corruption

### Steps
1. Identify critical routes:
   - `/api/projects` (POST, PATCH)
   - `/api/files` (POST, PATCH)
   - `/api/workflows` (POST, PATCH)
   - `/api/chat` (POST)
2. Add validation for required fields
3. Add validation for data types
4. Return clear error messages for invalid input
5. Test with invalid inputs to ensure errors are caught
6. Update `docs/KNOWN_ISSUES.md` to mark issue as resolved

### Success Criteria
- Required fields validated
- Data types validated
- Clear error messages returned
- No breaking changes to valid inputs

### Risk Level
🟡 **MEDIUM** - Could reject previously accepted (but invalid) inputs, but that's the goal

---

## Step 5: Document Actual Agent Execution Flow

### Action
Create end-to-end documentation of how a chat message flows through the system.

### Why Safe
- Documentation only
- No code changes
- Establishes understanding of current system

### Steps
1. Trace a sample chat message from UI to response
2. Document each step:
   - User types message → Frontend
   - Frontend calls `/api/chat` → API Route
   - API Route creates Marcus agent → Agent System
   - Marcus detects keywords → Routing Logic
   - Marcus delegates to specialist → Delegation
   - Specialist processes → Agent Action
   - Result returns to Marcus → Wrapping
   - Marcus returns to API → Response
   - API returns to Frontend → Display
3. Document error paths
4. Create `docs/EXECUTION_FLOW.md`
5. Include sequence diagrams if helpful

### Success Criteria
- Complete flow documented
- Error paths documented
- No code changes made
- Understanding of system improved

### Risk Level
🟢 **LOW** - Documentation only

---

## What NOT to Do

### ❌ Do NOT Add Features
- No new agent capabilities
- No new API endpoints
- No new UI features
- No new integrations

### ❌ Do NOT Refactor
- No code restructuring
- No architecture changes
- No performance optimizations (unless fixing breakage)

### ❌ Do NOT Integrate Unused Systems
- Do not integrate Python microservices
- Do not integrate AgentKit workflows
- Do not add social media API integrations

### ❌ Do NOT Fix "Nice to Have" Issues
- Focus only on critical stability issues
- Ignore UI polish
- Ignore performance optimizations (unless breaking)

---

## Success Metrics

After completing these 5 steps:
1. ✅ Database schema is documented and verified (COMPLETE - Step 1)
2. ⏳ Debug code is removed (PENDING - Step 2)
3. ⏳ Environment variables are standardized (PENDING - Step 3)
4. ⏳ Critical inputs are validated (PENDING - Step 4)
5. ⏳ System execution flow is understood (PENDING - Step 5)

### Step 1 Completion Summary
- ✅ Schema documented in `docs/DATABASE_SCHEMA.md`
- ✅ Found 32 tables total
- ✅ Identified `studio_plans` table missing
- ✅ Confirmed `workflows` table is correct replacement
- ✅ Fixed `/api/data/plans/route.ts` to use `workflows` table

---

## Next Steps After These 5

Once these 5 steps are complete, reassess:
1. What is the most critical broken flow?
2. What is causing the most user confusion?
3. What is the highest risk issue?

Then define the NEXT 5 safe steps based on actual priorities.

---

## Verification

These steps were chosen because:
1. They don't add features
2. They don't break existing functionality
3. They move toward stability
4. They are verifiable
5. They are low-risk

---

## Step 1: Schema Verification - Conclusion

### Which Table Should Back `/api/data/plans`?

**Answer: Use `workflows` table** ✅

**Reasoning:**
1. `studio_plans` table does NOT exist in the database
2. `workflows` table EXISTS with 5 rows
3. `workflows` table has `plan_markdown` column that contains plan content
4. `workflows` table has all necessary fields: id, name, type, status, user_id, project_id, created_at, updated_at
5. Code already queries `workflows` table in other parts of the codebase

**Implementation:**
- ✅ Updated `/api/data/plans/route.ts` to query `workflows` table
- ✅ Maps workflow fields to plan format
- ✅ Filters by `project_id` when `project` parameter is provided
- ✅ Returns workflow data with `plan_markdown` as `plan` field

**E2E Proof:**
```bash
# Test endpoint (returns actual data from workflows table)
curl http://localhost:3000/api/data/plans

# Test with project filter
curl "http://localhost:3000/api/data/plans?project=<project-id>"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Content Distribution Plan",
      "type": "distribution",
      "status": "active",
      "plan": "Create distribution strategy...",
      "summary": null,
      "user_id": "user_xxx",
      "project_id": null,
      "created_at": "2025-12-19T03:56:42.50469Z",
      "updated_at": "2025-12-19T03:56:42.50469Z",
      "agent_name": "marcus",
      "total_tasks": 1,
      "completed_tasks": 0
    }
  ]
}
```

**Status:** ✅ COMPLETE - Endpoint now returns actual data from workflows table
