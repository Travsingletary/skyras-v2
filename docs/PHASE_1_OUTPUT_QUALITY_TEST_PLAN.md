# Phase 1 Output Quality Test Plan

**Date:** 2025-01-28  
**Objective:** Ensure every next-action output scores 4/4 (Concrete, Specific, Small, Immediately Actionable)

---

## Test Process

1. Run 10-15 real prompts through the system
2. Score each output using the validation rubric (1-4 scale)
3. Identify recurring failure patterns (vagueness, advice, multi-step)
4. Adjust next-action generation logic if scores fall below 4

---

## Scoring Rubric

**4 - Excellent (Concrete, Specific, Small, Immediately Actionable)**
- Perfect: concrete, specific, small, immediately actionable
- Example: "Open your notes app and write: 'Three key points for my blog post about [topic]'"

**3 - Good (Specific Action)**
- Clear action but could be more specific
- Example: "Write the first paragraph"

**2 - Fair (General Suggestion)**
- Somewhat actionable but vague
- Example: "Start working on your project"

**1 - Poor (Advice/Reflection)**
- Abstract, vague, not actionable
- Example: "Think about your goals"

**Target:** 4 (Excellent) for all outputs

---

## Test Prompts

### Category 1: Creative Requests
1. "I want to write a blog post"
2. "I need to create content for my client"
3. "I'm working on a video script"

### Category 2: Planning/Organization
4. "I need to organize my workflow"
5. "I have too many projects and don't know where to start"
6. "I want to plan my content calendar"

### Category 3: Problem/Stuck States
7. "I'm stuck on my project"
8. "I don't know what to work on next"
9. "I feel overwhelmed with all my tasks"

### Category 4: Exploration/Discovery
10. "What should I work on?"
11. "I have an idea but don't know how to start"
12. "I want to explore new creative directions"

### Category 5: Specific Tasks
13. "I need to email my client about the project"
14. "I want to schedule social media posts"
15. "I need to finish my presentation"

---

## Test Execution

**For each prompt:**
1. Submit prompt to `/api/chat` with `userId: 'public'`
2. Capture the output
3. Score on 4 criteria:
   - [ ] Concrete (1-4)
   - [ ] Specific (1-4)
   - [ ] Small (1-4)
   - [ ] Immediately Actionable (1-4)
4. Calculate average score
5. Note any failure patterns

---

## Results Log

| # | Prompt | Output | Concrete | Specific | Small | Actionable | Avg | Pattern |
|---|--------|--------|----------|----------|-------|------------|-----|---------|
| 1 | | | | | | | | |
| 2 | | | | | | | |
| 3 | | | | | | | |
| 4 | | | | | | | |
| 5 | | | | | | | |
| 6 | | | | | | | |
| 7 | | | | | | | |
| 8 | | | | | | | |
| 9 | | | | | | | |
| 10 | | | | | | | |
| 11 | | | | | | | |
| 12 | | | | | | | |
| 13 | | | | | | | |
| 14 | | | | | | | |
| 15 | | | | | | | |

---

## Failure Patterns to Identify

- **Vagueness:** Outputs that are too general or abstract
- **Advice:** Outputs that tell user what to think/consider rather than what to do
- **Multi-step:** Outputs that contain multiple actions instead of one
- **Reflection:** Outputs that ask user to reflect rather than act
- **Future-oriented:** Outputs that can't be done immediately

---

## Adjustment Plan

**If scores fall below 4:**

1. **Identify patterns:**
   - Which prompts consistently fail?
   - What type of failure (vagueness, advice, multi-step)?
   - Is it in general chat or delegated responses?

2. **Adjust generation logic:**
   - Update Marcus system prompt to emphasize concrete, specific, small actions
   - Adjust wrapper prompt for delegated responses
   - Add post-processing to extract/format single action

3. **Re-test:**
   - Run same prompts again
   - Verify scores improve to 4/4
   - Test new prompts to ensure no regression

---

## Pass Criteria

**Phase 1 passes only when:**
- All outputs consistently score 4/4
- No recurring failure patterns
- Users can immediately act on every output

---

**Status:** ⏳ **READY TO TEST**
