# Phase 1 Output Quality Validation Instructions

**Date:** 2025-01-28  
**Status:** ⏳ **READY TO RUN**

---

## Prerequisites

1. **Development server running:**
   ```bash
   cd frontend
   npm run dev
   ```
   Server should be running on `http://localhost:3000`

2. **Or test against production:**
   ```bash
   export API_URL=https://skyras-v2.vercel.app/api/chat
   ```

---

## Validation Steps

### Step 1: Run Automated Test Script

```bash
# From project root
cd /Users/user/Sites/skyras-v2

# Test against local dev server (default)
node scripts/validate-output-quality.js

# Or test against production
API_URL=https://skyras-v2.vercel.app/api/chat node scripts/validate-output-quality.js
```

**What it does:**
- Runs all 15 test prompts
- Scores each output automatically (with heuristics)
- Generates summary and failure analysis
- Exits with code 0 (pass) or 1 (fail)

---

### Step 2: Manual Review (If Needed)

If automated scoring is uncertain, manually review outputs:

1. **Open:** `docs/PHASE_1_OUTPUT_QUALITY_VALIDATION_RESULTS.md`
2. **For each output, score:**
   - **Concrete (1-4):** Is it a specific action, not abstract?
   - **Specific (1-4):** Is it clear what to do, not general?
   - **Small (1-4):** Is it one step, not multiple?
   - **Actionable (1-4):** Can it be done now, not later?
3. **Update results log** with scores
4. **Identify patterns** in failures

---

### Step 3: Adjust if Needed

**If scores fall below 4:**

1. **Review failure patterns:**
   - Which prompts fail?
   - What type of failure (vagueness, advice, multi-step)?
   - Is it in general chat or delegated responses?

2. **Tighten constraints:**
   - Update `frontend/src/agents/marcus/marcusSystemPrompt.ts`
   - Update wrapper prompt in `frontend/src/agents/marcus/marcusAgent.ts`
   - Add more explicit examples of DO vs DON'T

3. **Re-test:**
   - Run validation again
   - Verify scores improve to 4/4
   - Test new prompts to ensure no regression

---

## Pass Criteria

**Phase 1 passes only when:**
- ✅ All outputs consistently score 4/4
- ✅ No recurring failure patterns
- ✅ Users can immediately act on every output
- ✅ Outputs are reliably executable without interpretation

---

## Test Prompts

The validation script tests 15 prompts across 5 categories:

1. **Creative Requests** (3 prompts)
2. **Planning/Organization** (3 prompts)
3. **Problem/Stuck States** (3 prompts)
4. **Exploration/Discovery** (3 prompts)
5. **Specific Tasks** (3 prompts)

See `docs/PHASE_1_OUTPUT_QUALITY_VALIDATION_RESULTS.md` for full list.

---

## Expected Output

**If all tests pass:**
```
=== Validation Summary ===

Total tests: 15
✅ Passed: 15
❌ Failed: 0
Pass rate: 100.0%
```

**If some tests fail:**
```
=== Validation Summary ===

Total tests: 15
✅ Passed: 10
❌ Failed: 5
Pass rate: 66.7%

=== Failure Analysis ===
[Details of failures and patterns]
```

---

## Next Steps After Validation

**If PASS:**
- Document results in validation results file
- Mark Phase 1 output quality as VALIDATED
- Proceed with user validation testing

**If FAIL:**
- Review failure patterns
- Tighten prompt constraints
- Re-test until all outputs score 4/4

---

**Status:** ⏳ **READY TO RUN**

**Command to start:**
```bash
node scripts/validate-output-quality.js
```
