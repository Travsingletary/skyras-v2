# Phase 1 Output Quality Analysis

**Date:** 2025-01-28  
**Status:** ⏳ **ANALYZING - Ready to Test**

---

## Current System Analysis

### Marcus System Prompt Issues

**Problem:** The current `MARCUS_SYSTEM_PROMPT` is heavily tailored to Trav's specific workflow:
- References Trav-specific projects (SteadyStream, SkyRas, SkySky)
- Assumes user context (Trav's vision, projects, preferences)
- May not work for general public users

**Current Directive:**
- "ONE Clear Next Step" ✅ (good)
- "Give ONE immediate, concrete action" ✅ (good)
- But lacks emphasis on: Concrete, Specific, Small, Immediately Actionable

### Wrapper Prompt Issues

**Location:** `marcusAgent.ts` line 340

**Current:**
```
"Now explain to the user what happened, WHY it matters to their goals, and give them ONE clear next step. Keep it direct and action-oriented."
```

**Problem:**
- Doesn't emphasize "concrete, specific, small, immediately actionable"
- May produce advice/reflection instead of action
- May produce multi-step plans instead of one step

---

## Required Adjustments

### 1. Enhance System Prompt for Phase 1

**Add explicit Phase 1 directive:**

```
**PHASE 1 REQUIREMENT: Next Action Output**
Every response must end with ONE next action that is:
- CONCRETE: Specific action, not abstract (e.g., "Write the first sentence" not "Start writing")
- SPECIFIC: Clear what to do, not general (e.g., "Email john@example.com with subject 'Project Update'" not "Reach out to your contact")
- SMALL: One step, not multiple (e.g., "Create a new folder called 'drafts'" not "Set up your workspace, organize files, and start writing")
- IMMEDIATELY ACTIONABLE: Can do it now, not later (e.g., "Open your notes app and write down 3 ideas" not "Plan your content strategy for next quarter")

CRITICAL: The next action must be a DO statement, not advice, reflection, or planning.
- ✅ DO: "Open your calendar and block 2 hours for writing"
- ❌ DON'T: "You should consider blocking time for writing"
- ❌ DON'T: "Think about when you can write"
- ❌ DON'T: "Plan your writing schedule for the week"
```

### 2. Enhance Wrapper Prompt

**Current wrapper prompt (line 340):**
```
"Now explain to the user what happened, WHY it matters to their goals, and give them ONE clear next step. Keep it direct and action-oriented."
```

**Enhanced wrapper prompt:**
```
"Now explain to the user what happened, WHY it matters to their goals, and give them ONE clear next step.

CRITICAL: The next step must be:
- CONCRETE: Specific action, not abstract
- SPECIFIC: Clear what to do, not general  
- SMALL: One step, not multiple
- IMMEDIATELY ACTIONABLE: Can do it now, not later

Format: Start with a DO statement (e.g., 'Open your...', 'Write...', 'Email...', 'Create...').
Do NOT give advice, reflection, or multi-step plans. Give ONE concrete action the user can do right now."
```

### 3. General Chat Response Enhancement

**Current:** Uses `generateAIResponse()` with system prompt

**Enhancement:** Add post-processing to extract/format single action if response is too long or contains multiple steps

---

## Test Plan

1. **Run 10-15 test prompts** (see `PHASE_1_OUTPUT_QUALITY_TEST_PLAN.md`)
2. **Score each output** (1-4 for each criterion)
3. **Identify patterns:**
   - Which prompts fail?
   - What type of failure (vagueness, advice, multi-step)?
   - Is it in general chat or delegated responses?
4. **Apply adjustments** based on patterns
5. **Re-test** until all outputs score 4/4

---

## Adjustment Priority

**If scores fall below 4:**

1. **First:** Enhance wrapper prompt (affects delegated responses)
2. **Second:** Enhance system prompt (affects general chat)
3. **Third:** Add post-processing (extract single action from long responses)

---

**Status:** ⏳ **READY TO TEST THEN ADJUST**
