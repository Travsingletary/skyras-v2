# Phase 1 AI Pre-Validation Harness

## Overview

This script tests routing and relevance for Phase 1 validation by:
- Generating 100 prompts (10 categories × 10 prompts each)
- Calling production `/api/chat` for each prompt
- Recording: prompt, expectedCategory, response, templateId, latency
- Grading responses with deterministic rules
- Outputting a comprehensive report

## Usage

### Prerequisites

Install TypeScript runner:
```bash
npm install -g tsx
# OR
npm install -g ts-node
```

### Run the test

```bash
# Option 1: Using the shell script
./scripts/run-ai-pretest.sh

# Option 2: Direct execution
npx tsx scripts/ai-pretest-phase1.ts

# Option 3: With custom API URL
API_URL=https://your-api.com/api/chat npx tsx scripts/ai-pretest-phase1.ts
```

## Test Categories

1. **email** - Email-related prompts
2. **blog** - Blog post creation
3. **presentation** - Slide/presentation work
4. **calendar** - Content calendar planning
5. **directions** - Creative direction exploration
6. **video** - Video script/content
7. **overwhelm** - Overwhelmed/stuck scenarios
8. **start_idea** - Ideas needing starting point
9. **organize** - Workflow organization
10. **default** - Catch-all category

## Grading Criteria

Each response is graded PASS/FAIL based on:

1. **One sentence** - Response must be exactly one sentence
2. **One action** - Response must start with an action verb
3. **TemplateId match** - `templateId` must match `expectedCategory`
4. **Semantic relevance** - Response must be semantically on-category

## Report Output

The script generates a report with:
- Overall pass rate
- Failures by category
- Failures by templateId
- Suggested keyword gaps (mismatched prompts)
- Failure breakdown by reason

## Exit Codes

- `0` - All tests passed (100% pass rate)
- `1` - Some tests failed (< 100% pass rate)

## Notes

- Adds 100ms delay between requests to avoid rate limiting
- Uses deterministic semantic checks (not LLM-based)
- Only adjusts keyword patterns if failures show routing gaps (per requirements)
