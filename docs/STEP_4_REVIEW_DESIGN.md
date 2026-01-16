# Step 4: Review - Design Specification

**Status:** ✅ Implemented (Updated 2026-01-16)
**Component:** `ReviewChecklistView.tsx`
**Purpose:** Verify project readiness before final video generation

---

## IMPORTANT: Scope Change

**Previous Design:** Step 4 included video generation + approval
**New Design:** Step 4 is a **checklist only** - NO video generation

Video generation has been moved to Step 5 (Finish). This prevents drift and ensures Step 4 focuses solely on verification.

---

## Overview

Step 4 (Review) serves as a **pre-flight checklist** to ensure all prerequisites are complete before moving to Step 5 (Finish) where video generation occurs. This step does NOT generate videos - it only validates readiness.

## Core Responsibility

**Dominant Object:** Review Checklist (verification only, no video generation)

The checklist verifies:
1. Foundation complete (name + intent defined)
2. Structure has >= 1 section
3. Approved Style Card exists
4. If storyboard frames exist, all are approved

## 1. Wireframe

### Main View (All Checks Pass)

```
┌─────────────────────────────────────────────────────┐
│ [Step 4] Review                                      │
│ Verify that all prerequisites are complete...        │
├─────────────────────────────────────────────────────┤
│ Checklist Progress: 4 / 4 complete                   │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                    │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ ✓  Foundation Complete                          │ │
│ │    Project has name and intent defined          │ │
│ │    Name: "My Project", Intent: "Create..."      │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ✓  Structure Defined                            │ │
│ │    Project has at least one content section     │ │
│ │    3 sections defined                           │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ✓  Approved Style Card                          │ │
│ │    Style Card has been created and approved     │ │
│ │    Style Card approved                          │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ✓  Storyboard Frames                            │ │
│ │    All storyboard frames are approved (if any)  │ │
│ │    All 5 frames approved                        │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ ✓ Ready to Continue!                                 │
│   All prerequisites complete. Proceed to Step 5.    │
├─────────────────────────────────────────────────────┤
│ [Continue to Step 5: Finish]  (enabled)              │
└─────────────────────────────────────────────────────┘
```

### Main View (Incomplete)

```
┌─────────────────────────────────────────────────────┐
│ [Step 4] Review                                      │
│ Verify that all prerequisites are complete...        │
├─────────────────────────────────────────────────────┤
│ Checklist Progress: 3 / 4 complete                   │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░                    │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ ✓  Foundation Complete                          │ │
│ │    Name: "My Project", Intent: "Create..."      │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ✓  Structure Defined                            │ │
│ │    3 sections defined                           │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ✓  Approved Style Card                          │ │
│ │    Style Card approved                          │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ✗  Storyboard Frames                   [Go to   │ │
│ │    All storyboard frames must be approved        │ │
│ │    Only 2 of 5 frames approved         Storyboard]│ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ ⚠ Action Required                                    │
│   Complete checklist items above. Use action buttons│
├─────────────────────────────────────────────────────┤
│ [Continue to Step 5: Finish]  (disabled)             │
│ Complete 1 remaining item to continue                │
└─────────────────────────────────────────────────────┘
```

## 2. Checklist Items

### Item 1: Foundation Complete

**Checks:**
- `project.name` exists and not empty
- `project.metadata.intent` exists and not empty

**Pass State:**
- Details: `Name: "Project Name", Intent: "Intent text"`

**Fail State:**
- Details: "Missing project name or intent"
- Action Link: [Go to Foundation] → `/projects/{id}?intent=create&step=foundation`

### Item 2: Structure Defined

**Checks:**
- `project.metadata.outline` is array with length > 0

**Pass State:**
- Details: `{count} section(s) defined`

**Fail State:**
- Details: "No content sections created"
- Action Link: [Go to Structure] → `/projects/{id}?intent=create&step=structure`

### Item 3: Approved Style Card

**Checks:**
- `styleCardsDb.getApprovedByProjectId()` returns a record

**Pass State:**
- Details: "Style Card approved"

**Fail State:**
- Details: "Create and approve a Style Card"
- Action Link: [Go to Style Card] → `/projects/{id}?intent=create&step=style-card`

### Item 4: Storyboard Frames

**Checks:**
- If `totalFrames === 0`: **PASS** (no frames yet is OK)
- If `totalFrames > 0` and `approvedFrames === totalFrames`: **PASS**
- If `totalFrames > 0` and `approvedFrames < totalFrames`: **FAIL**

**Pass State (no frames):**
- Details: "No storyboard frames yet"

**Pass State (all approved):**
- Details: `All {count} frame(s) approved`

**Fail State:**
- Details: `Only {approved} of {total} frames approved`
- Action Link: [Go to Storyboard] → `/projects/{id}?intent=create&step=storyboard`

## 3. Visual States

### Pass Item
- **Border:** Green (2px solid)
- **Background:** Green tint (#f0fdf4)
- **Icon:** Green checkmark circle
- **Text:** Green for status labels
- **Action:** No button (already complete)

### Fail Item
- **Border:** Red (2px solid)
- **Background:** Red tint (#fef2f2)
- **Icon:** Red X circle
- **Text:** Red for status labels
- **Action:** Blue button "Go to [Step Name]"

### Progress Bar
- **0-99% complete:** Blue fill (#3b82f6)
- **100% complete:** Green fill (#10b981)
- **Background:** Gray (#e5e7eb)

### Summary Banner

**All Complete:**
- Green background, green border
- Title: "Ready to Continue!"
- Message: "All prerequisites complete. You can now proceed to Step 5 to generate and finalize your video."

**Incomplete:**
- Yellow background, yellow border
- Title: "Action Required"
- Message: "Complete all checklist items above before continuing. Use the action buttons to navigate to incomplete steps."

## 4. Data Sources

| Data | Source | API |
|------|--------|-----|
| Project name | `project.name` | `projectsDb.getById()` |
| Project intent | `project.metadata.intent` | `projectsDb.getById()` |
| Outline sections | `project.metadata.outline` | `projectsDb.getById()` |
| Approved Style Card | Style Cards table | `styleCardsDb.getApprovedByProjectId()` |
| Storyboard frames | Storyboard Frames table | `storyboardFramesDb.getByProjectId()` |

## 5. Gating Logic

### Continue Button

**Enabled when:** All 4 checklist items pass
**Disabled when:** Any checklist item fails
**Action:** `onContinue()` → Navigate to Step 5 (Finish)
**Error:** Clicking when disabled shows: "Please complete all checklist items before continuing"

### No Video Generation

**Important:** Step 4 does NOT include:
- ❌ Video generation button
- ❌ Video preview
- ❌ Video approval
- ❌ Video download
- ❌ Any video-related functionality

All video operations are in Step 5 (Finish).

## 6. Loading & Error States

### Loading State
- Spinner + "Loading checklist..."
- Checklist items hidden until loaded
- Continue button disabled

### Error State (Failed to Load)
- Red error banner with message
- Empty checklist (or partial if some data loaded)
- Continue button disabled

### Item-Level Errors
- Individual items can fail independently
- Failed items show red state + action link
- Other items continue to display normally

## 7. Implementation Details

### Component
**File:** `frontend/src/components/project/views/ReviewChecklistView.tsx`

**Props:**
```typescript
interface ReviewChecklistViewProps {
  projectId: string;
  userId: string;
  onContinue: () => void;
  onUpdate?: () => void;
}
```

### State Management
```typescript
const [project, setProject] = useState<Project | null>(null);
const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

### Checklist Item Structure
```typescript
interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  status: 'pass' | 'fail' | 'checking';
  linkTo?: { step: string; label: string };
  details?: string;
}
```

## 8. Step Flow

```
Step 3: Build → Step 4: Review → Step 5: Finish
                     ↓
              [Checklist Verification]
                     ↓
         Foundation? Structure? Style Card? Storyboard?
                     ↓
              All Pass? → Enable Continue
              Any Fail? → Show Action Links
```

## 9. Edge Cases

| Scenario | Behavior |
|----------|----------|
| No project found | Show error, disable continue |
| Foundation incomplete | Fail Item 1, show link to Foundation |
| No outline sections | Fail Item 2, show link to Structure |
| No Style Card | Fail Item 3, show link to Style Card |
| Some frames unapproved | Fail Item 4, show link to Storyboard |
| No frames yet | Pass Item 4 (frames optional) |
| All checks pass initially | Green banner, enable continue |
| User clicks continue with failures | Show error message |

## 10. Testing Checklist

- [ ] All 4 items pass → Continue enabled → Navigate to Step 5
- [ ] Missing foundation → Item 1 fails → Link to Foundation
- [ ] No outline sections → Item 2 fails → Link to Structure
- [ ] No Style Card → Item 3 fails → Link to Style Card
- [ ] Unapproved frames → Item 4 fails → Link to Storyboard
- [ ] No frames yet → Item 4 passes
- [ ] Progress bar updates correctly
- [ ] Loading state displays properly
- [ ] Error state displays properly
- [ ] Action links navigate correctly

## 11. Constraints Compliance

✅ **No new backend logic**
- Uses existing database queries
- No new API endpoints
- No new tables or columns

✅ **No video generation in Step 4**
- Pure checklist verification
- All video operations moved to Step 5

✅ **Focused view**
- No sidebars during Step 4
- Single unified checklist
- Clear pass/fail indicators

✅ **Step language maintained**
- Step 1: Foundation
- Step 2: Structure
- Step 3: Build
- Step 4: Review (checklist only)
- Step 5: Finish (video generation)

---

**Updated:** 2026-01-16
**Related:** STEP_5_FINISH_DESIGN.md
**Component:** ReviewChecklistView.tsx
