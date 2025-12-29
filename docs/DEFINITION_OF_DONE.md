# Definition of Done - SkyRas v2

**Last Updated:** 2025-01-27  
**Purpose:** Strict definitions for feature status. No ambiguity. Proof required.

---

## Status Definitions

### ✅ WORKING

A feature is **WORKING** only if ALL of the following are true:

1. **End-to-end user-triggered flow exists**
   - A real user action (click, submit, type, etc.) initiates the feature
   - The feature completes without manual intervention

2. **Visible output reaches UI**
   - User sees a result in the browser/interface
   - Output is not just in logs or database
   - Output is meaningful (not just "success" message)

3. **Repeatable at least 2 times**
   - Feature works when triggered multiple times
   - No one-time setup required (or setup is documented)
   - Consistent behavior across attempts

4. **Repro steps documented**
   - Exact steps to reproduce are written down
   - Steps are testable by someone other than the developer
   - Steps include expected result

**If ANY of these criteria are missing, the feature is NOT WORKING.**

---

### ⚠️ PARTIAL

A feature is **PARTIAL** if:

- Some code exists, but end-to-end proof is missing
- Feature depends on mocked/disabled parts
- Feature works in some environments but not others (without clear reason)
- Feature requires manual intervention to complete
- Feature works but output is not visible to user

**Examples:**
- API route exists but returns mock data
- Agent action exists but not called from UI
- Feature works locally but fails in production (unexplained)
- Feature requires manual database setup

---

### ❌ BROKEN

A feature is **BROKEN** if:

- Code exists but fails in current environment
- Feature throws errors when triggered
- Feature returns error messages to user
- Feature was working but no longer works

**Examples:**
- API route returns 500 error
- Agent throws exception
- UI shows error message
- Database operations fail

---

### 🚫 NOT BUILT

A feature is **NOT BUILT** if:

- No code exists in codebase
- Only documentation/stubs exist
- Only TODO comments exist
- Referenced in prompts but not implemented

**Examples:**
- Social media API integrations (only TODO comments)
- Trend scraping (explicitly not in MVP)
- Music agent (referenced as "future")

---

## Proof Requirements

### For WORKING Status

Must provide:
1. **File/Route Location:** Exact code path that implements the feature
2. **Repro Steps:** Step-by-step instructions to trigger and verify
3. **Expected Output:** What user should see
4. **Last Verified Date:** When it was last tested and confirmed working
5. **Test Environment:** Local, Production, or both

### For PARTIAL Status

Must provide:
1. **What Works:** Specific parts that function
2. **What's Missing:** What prevents full E2E flow
3. **Dependencies:** What mocked/disabled parts it relies on
4. **Environment Notes:** Where it works vs where it doesn't

### For BROKEN Status

Must provide:
1. **Error Details:** What error occurs
2. **When It Fails:** Under what conditions
3. **Error Location:** Where in code the failure happens
4. **Last Known Working:** When it last worked (if ever)

### For NOT BUILT Status

Must provide:
1. **Evidence of Absence:** Why we know it doesn't exist
2. **Related Code:** Any stubs or references that exist
3. **Future Plans:** If documented anywhere

---

## Verification Process

### Before Claiming WORKING

1. **Test the feature yourself**
   - Follow the documented repro steps
   - Verify output appears in UI
   - Test at least 2 times

2. **Document the proof**
   - Add to PROOF_MATRIX.md
   - Include exact repro steps
   - Note test environment and date

3. **Verify no dependencies on mocked code**
   - Check for TODO comments
   - Verify no mock data returns
   - Confirm external APIs are actually called

4. **Use real email addresses for email confirmation testing**
   - ⚠️ **Do not use fake emails** (e.g., `test@test.com`, `user@example.com`) for email confirmation flows
   - Fake emails will bounce and cannot be confirmed, blocking E2E verification
   - Use a real email address you can access (e.g., Gmail, Outlook) for testing
   - See `INCIDENT_CLOSED_EMAIL_CONFIRMATION.md` for details on why this matters

### Before Claiming PARTIAL

1. **Identify what works**
   - Test the working parts
   - Document what succeeds

2. **Identify what's missing**
   - Find the blocking issue
   - Document why it's incomplete

### Before Claiming BROKEN

1. **Reproduce the failure**
   - Trigger the feature
   - Capture the error
   - Document the failure point

2. **Check if it's environment-specific**
   - Test in different environments
   - Note where it fails vs works

---

## Status Change Rules

### Upgrading Status

- **NOT BUILT → BROKEN:** Code was added but doesn't work
- **NOT BUILT → PARTIAL:** Code was added but incomplete
- **NOT BUILT → WORKING:** Code was added and fully tested
- **BROKEN → PARTIAL:** Some parts now work
- **BROKEN → WORKING:** Fully fixed and tested
- **PARTIAL → WORKING:** Completed and tested

### Downgrading Status

- **WORKING → PARTIAL:** E2E proof is missing or incomplete
- **WORKING → BROKEN:** Feature no longer works
- **PARTIAL → BROKEN:** Previously working parts now fail
- **PARTIAL → NOT BUILT:** Code was removed

### When to Change Status

- **Immediately:** When status is proven wrong
- **After testing:** When new evidence is gathered
- **Never:** Based on assumptions or code inspection alone

---

## Examples

### ✅ WORKING Example

**Feature:** Chat message display
- **Proof:** User types message → clicks send → message appears in chat UI
- **Repro:** Type "hello" and click send
- **Expected:** Message "hello" appears in chat
- **Verified:** 2025-01-27, Local environment
- **Repeatable:** Yes, tested 3 times

### ⚠️ PARTIAL Example

**Feature:** Jamal publishing
- **What Works:** Queue structure, settings management
- **What's Missing:** Actual platform API calls (all TODO comments)
- **Dependencies:** Mock implementations
- **Status:** PARTIAL (structure exists, publishing doesn't work)

### ❌ BROKEN Example

**Feature:** File upload (if failing)
- **Error:** 503 "Storage not configured"
- **When:** On production deployment
- **Location:** `/api/uploads/sign` route
- **Cause:** Missing SUPABASE_SECRET_KEY in environment

### 🚫 NOT BUILT Example

**Feature:** Social media platform integrations
- **Evidence:** All platform API calls are TODO comments
- **Related Code:** `src/lib/jamal/publishingWorker.ts` line 85, 186, 195
- **Future Plans:** Not in MVP per system prompt

---

## Enforcement

### Reality Enforcer Mode Rules

1. **No assumptions** - If proof is missing, downgrade status
2. **No "probably works"** - Either proven or not
3. **No code inspection as proof** - Must test actual execution
4. **Document contradictions** - If status doesn't match reality, note it
5. **Update immediately** - When status is proven wrong, update docs

### Review Process

Before marking anything as WORKING:
1. Read the code
2. Test the feature
3. Verify output in UI
4. Test twice
5. Document proof

---

## Update Log

- **2025-01-27:** Initial definition created
- **Enforcement:** Active - all status claims must meet these criteria

