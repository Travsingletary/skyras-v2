# Phase 1 Human Validation Guide

**Status:** 🟢 **IN PROGRESS**

---

## Overview

Phase 1 human validation tests the routing, relevance, and format of AI responses with real users. This validation must pass before proceeding to Phase 2.

**AI Pretest Status:** ✅ 100% pass rate (routing/relevance/format)

---

## Validation Plan

### Scope
- **10 user sessions**
- **2 prompts per user** (20 total prompts)
- **Do NOT explain the product** - let users interact naturally

### Data Collection

For each prompt, record:
1. **prompt text** - What the user typed
2. **response** - What Marcus returned
3. **clarity (Y/N)** - Was it clear what to do?
4. **will do now (Y/N)** - Will they do it immediately?
5. **confidence (0-10)** - How confident are they they can do it?
6. **signup after value (Y/N/N/A)** - Did they sign up? (N/A if already logged in)

### Gate Criteria

**Proceed to Phase 2 if ALL criteria met:**
- ✅ **Clarity ≥80%** - At least 80% found it clear
- ✅ **Will-do-now ≥60%** - At least 60% will do it immediately
- ✅ **Avg confidence ≥7/10** - Average confidence of 7 or higher
- ✅ **Signup-after-value ≥20-30%** - At least 20-30% signed up after receiving value

**Do NOT proceed if:**
- ❌ Any criterion not met
- ❌ Fix issues and re-run validation

---

## Engineering Constraints

**During validation, engineering changes are LIMITED to:**
- ✅ Keyword/routing fixes if wrong intent detected
- ✅ Single template wording tweaks only if humans are confused
- ❌ NO new features
- ❌ NO major changes
- ❌ NO UI changes

**After validation:**
- If gate passes → Proceed to Phase 2
- If gate fails → Fix issues, re-run validation

---

## Running Validation

### Option 1: Interactive Helper Script

```bash
# Start a new session
./scripts/phase1-validation-helper.sh

# Continue session (if SESSION_ID is set)
SESSION_ID=session_xxx ./scripts/phase1-validation-helper.sh
```

### Option 2: Direct CLI

```bash
# Create session
npx tsx scripts/phase1-human-validation.ts create-session <userId> <userType> <isLoggedOut>

# Add prompt result
npx tsx scripts/phase1-human-validation.ts add-prompt \
  <sessionId> \
  "<prompt text>" \
  "<response>" \
  <Y|N> \
  <Y|N> \
  <0-10> \
  <Y|N|N/A> \
  [templateId]

# View report
npx tsx scripts/phase1-human-validation.ts report
```

### Option 3: Manual Data Entry

Edit `data/phase1-validation/sessions.json` directly (not recommended).

---

## Validation Process

### Step 1: Recruit Users
- 10 users from target audience
- Mix of: first-time users, returning users
- Some logged out (to test signup conversion)

### Step 2: Run Sessions
1. User opens the app (don't explain product)
2. User types first prompt naturally
3. Record all data points
4. User types second prompt naturally
5. Record all data points
6. Check if user signs up (if logged out)

### Step 3: Monitor Progress
- Run `npx tsx scripts/phase1-human-validation.ts report` after each session
- Track progress toward gate criteria
- Identify issues early

### Step 4: Make Engineering Fixes (if needed)
- If wrong intent detected → Fix keyword patterns
- If confusion detected → Tweak template wording
- Re-test affected prompts

### Step 5: Gate Decision
- After 10 sessions complete
- Run final report
- Make Phase 2 gate decision

---

## Data Storage

- **Location:** `data/phase1-validation/sessions.json`
- **Format:** JSON with session and prompt data
- **Backup:** Commit to git after each session (optional)

---

## Example Session

```json
{
  "sessionId": "session_1234567890_abc123",
  "userId": "user_001",
  "userType": "first-time",
  "isLoggedOut": true,
  "prompts": [
    {
      "promptText": "I need to write a blog post",
      "response": "Write the headline for your blog post.",
      "clarity": "Y",
      "willDoNow": "Y",
      "confidence": 9,
      "signupAfterValue": "Y",
      "timestamp": "2025-01-28T15:30:00Z",
      "templateId": "blog"
    },
    {
      "promptText": "I want to plan my content calendar",
      "response": "Write the platform name where you will post content.",
      "clarity": "Y",
      "willDoNow": "N",
      "confidence": 8,
      "signupAfterValue": "N/A",
      "timestamp": "2025-01-28T15:32:00Z",
      "templateId": "calendar"
    }
  ],
  "startedAt": "2025-01-28T15:29:00Z",
  "completedAt": "2025-01-28T15:33:00Z"
}
```

---

## Troubleshooting

### Issue: Wrong intent detected
**Fix:** Update keyword patterns in `frontend/src/agents/marcus/marcusAgent.ts`
**Test:** Re-run AI pretest to verify

### Issue: Confusion about response
**Fix:** Tweak template wording in `frontend/src/agents/marcus/marcusAgent.ts`
**Test:** Re-test with affected users

### Issue: Low signup rate
**Investigate:** Check if value is clear, if signup flow works
**Fix:** May need Phase 2 improvements (not Phase 1 scope)

---

## Next Steps

1. ✅ AI pretest complete (100%)
2. ⏳ **Start human validation** (10 sessions)
3. ⏳ Monitor progress
4. ⏳ Make fixes if needed
5. ⏳ Gate decision

---

**Status:** 🟢 **READY TO START**
