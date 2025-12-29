# Phase 1 Template Simplification

**Date:** 2025-01-28  
**Status:** ✅ **COMPLETE**

---

## Changes Made

### 1. Simplified All Structured Templates to Single-Field Actions

**Removed:**
- Multi-slot formats (no "|" or multiple blanks)
- Examples from all templates

**Created:** `frontend/src/agents/marcus/intentTemplates.ts`
- Centralized template definitions
- All templates are single-field actions only

### 2. Replaced Failing Templates

**Before:**
- "Write: 'Last task: _ | Next 10-min step: _.'"
- "Write one task name in the format 'verb + object' (e.g. …)"

**After:**
- "Write the last task you worked on."
- "Write one task name using a verb and an object."

### 3. Added 3 Narrow Intent Templates

All single-field only:
- **Content calendar:** "Write the platform you're planning content for."
- **Creative directions:** "Write one sentence describing the direction you want to explore."
- **Idea but don't know how to start:** "Write the core idea in one sentence."

### 4. Updated Marcus System Prompt

Added guidance in `frontend/src/agents/marcus/marcusSystemPrompt.ts`:
- Section on "Clarifying Questions (Phase 1 Requirement)"
- Explicit DO/DON'T examples for template usage
- Removed multi-slot format examples

---

## Template Definitions

All templates are defined in `frontend/src/agents/marcus/intentTemplates.ts`:

```typescript
export const INTENT_TEMPLATES = {
  lastTask: "Write the last task you worked on.",
  taskName: "Write one task name using a verb and an object.",
  contentCalendar: "Write the platform you're planning content for.",
  creativeDirections: "Write one sentence describing the direction you want to explore.",
  ideaButDontKnowHowToStart: "Write the core idea in one sentence.",
}
```

---

## Validation

**Rubric remains strict:**
- ✅ Do NOT relax the rubric
- ✅ Do NOT accept Sm=1 (Small score must be 4)
- ✅ All outputs must score 4/4 to pass

**Next step:** Re-run `validate-output-quality.js` after deploy to verify improvements.

---

## Files Changed

1. `frontend/src/agents/marcus/intentTemplates.ts` (new)
2. `frontend/src/agents/marcus/marcusSystemPrompt.ts` (updated)

---

**Status:** ✅ **READY FOR VALIDATION**
