# SkyRas Product Vision Alignment Analysis

**Date:** 2025-12-29  
**Status:** Gap Analysis & Implementation Roadmap

---

## Executive Summary

Current implementation has **partial alignment** with the PM vision. Core infrastructure exists (storyboards, references, workflow system) but **critical gates and object boundaries are missing**.

**Key Gaps:**
- ⚠️ Reference-first generation is **optional**, not enforced
- ❌ No Style Card system
- ❌ No Project Bible system  
- ❌ No workflow gates (storyboard approval → video)
- ❌ No mode separation (Continuity vs Ad Mode)
- ⚠️ Missing core objects (Shot List, Edit Recipe, Campaign Pack)

---

## Current State Assessment

### ✅ What Exists

1. **Storyboard Generation** (`/api/tools/nanobanana`)
   - ✅ Supports reference images
   - ✅ Character sheet integration
   - ✅ Frame count control (9-12 frames)
   - ⚠️ **Missing:** Approval state tracking

2. **Reference Support**
   - ✅ `referenceImages` array in storyboard requests
   - ✅ Character sheet URLs
   - ⚠️ **Missing:** Reference Library with approval/tagging
   - ⚠️ **Missing:** Reference requirement enforcement

3. **Image Generation** (`/api/tools/generateImage`)
   - ✅ Supports "create" and "edit" actions
   - ✅ Edit action requires `image_ref`
   - ❌ **Violation:** Create action allows generation without references

4. **Workflow System**
   - ✅ Multi-agent orchestration (Marcus, Giorgio, Letitia, Jamal)
   - ✅ Task dependencies
   - ⚠️ **Missing:** Workflow gates enforcement

5. **Project System**
   - ✅ `projects` table exists
   - ✅ Project metadata (JSONB)
   - ❌ **Missing:** Project Bible structure
   - ❌ **Missing:** Style Card structure

### ❌ Critical Missing Components

#### 1. **Core Objects Not Implemented**

| Object | Status | Location Needed |
|--------|--------|----------------|
| **Project Bible** | ❌ Missing | `projects.metadata.bible` or separate table |
| **Reference Library** | ⚠️ Partial | No approval/tagging system |
| **Style Card** | ❌ Missing | Need `style_cards` table |
| **Shot List** | ❌ Missing | Need `shot_lists` table |
| **Storyboard Frames** | ⚠️ Partial | No approval state tracking |
| **Video Takes** | ⚠️ Partial | No rating/selection system |
| **Edit Recipe** | ❌ Missing | Need `edit_recipes` table |
| **Campaign Pack** | ⚠️ Partial | `campaigns` table exists but incomplete |

#### 2. **Workflow Gates Not Enforced**

**Gate 1: Style Card → Storyboard**
- ❌ No check for Style Card existence
- ❌ Storyboard generation proceeds without Style Card validation

**Gate 2: Storyboard Approval → Video**
- ❌ No approval state on storyboard frames
- ❌ Video generation can proceed without approval
- ❌ No blocking mechanism

**Gate 3: Final Selects → Campaign Export**
- ⚠️ Campaign system exists
- ❌ No "final selects" concept
- ❌ No export blocking

#### 3. **Mode Separation Missing**

- ❌ No distinction between "Continuity Mode" and "Ad Mode"
- ❌ Same workflow for long-form and rapid iteration
- ❌ Project Bible requirement not enforced for Continuity Mode

---

## Implementation Roadmap

### Phase 1: Core Object Foundation (Week 1)

#### 1.1 Style Cards Table
```sql
CREATE TABLE style_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  trigger_words TEXT[],
  visual_rules JSONB,
  reference_urls TEXT[],
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 1.2 Reference Library Table
```sql
CREATE TABLE reference_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  user_id TEXT NOT NULL,
  file_id UUID REFERENCES files(id),
  tags TEXT[],
  approval_state TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 1.3 Storyboard Frames Table
```sql
CREATE TABLE storyboard_frames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storyboard_id UUID,
  frame_index INTEGER,
  frame_url TEXT,
  approval_state TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'needs_revision'
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 1.4 Project Bible Extension
```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_bible JSONB DEFAULT '{}';
-- Structure:
-- {
--   "canon": {},
--   "characters": [],
--   "visual_rules": {},
--   "style_constraints": {}
-- }
```

### Phase 2: Workflow Gates (Week 2)

#### 2.1 Style Card Gate
**File:** `frontend/src/app/api/tools/nanobanana/route.ts`

```typescript
// Before storyboard generation:
const styleCard = await styleCardsDb.getByProject(projectId);
if (!styleCard || !styleCard.approved) {
  return NextResponse.json(
    { 
      success: false, 
      error: 'Style Card must exist and be approved before storyboard generation' 
    },
    { status: 400 }
  );
}
```

#### 2.2 Storyboard Approval Gate
**File:** `frontend/src/app/api/tools/generateVideo/route.ts`

```typescript
// Before video generation:
const storyboardFrames = await storyboardFramesDb.getByStoryboard(storyboardId);
const allApproved = storyboardFrames.every(f => f.approval_state === 'approved');

if (!allApproved) {
  return NextResponse.json(
    { 
      success: false, 
      error: 'All storyboard frames must be approved before video generation',
      pendingFrames: storyboardFrames.filter(f => f.approval_state !== 'approved')
    },
    { status: 400 }
  );
}
```

#### 2.3 Reference Enforcement
**File:** `frontend/src/app/api/tools/generateImage/route.ts`

```typescript
// For "create" action, require at least one reference:
if (action === "create" && !body.reference_images?.length) {
  return NextResponse.json(
    { error: "Reference-first generation required. Provide reference_images array." },
    { status: 400 }
  );
}
```

### Phase 3: Mode Separation (Week 3)

#### 3.1 Project Mode Field
```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'continuity';
-- 'continuity' | 'ad'
```

#### 3.2 Continuity Mode Validation
- Require Project Bible
- Require Style Card
- Enforce approval gates strictly

#### 3.3 Ad Mode Optimization
- Relax Project Bible requirement
- Streamline approval (single approval for storyboard)
- Faster iteration paths

### Phase 4: Missing Objects (Week 4)

#### 4.1 Shot List
```sql
CREATE TABLE shot_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  scene_number INTEGER,
  shot_number INTEGER,
  intent TEXT,
  camera_instruction TEXT,
  duration_seconds INTEGER,
  storyboard_frame_id UUID REFERENCES storyboard_frames(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4.2 Video Takes & Selection
```sql
CREATE TABLE video_takes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shot_list_id UUID REFERENCES shot_lists(id),
  file_id UUID REFERENCES files(id),
  take_number INTEGER,
  rating INTEGER, -- 1-5
  selected BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4.3 Edit Recipe
```sql
CREATE TABLE edit_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  name TEXT,
  de_ai_instructions JSONB, -- color grading, stabilization, etc.
  selected_take_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Immediate Action Items

### Priority 1: Block Violations
1. ✅ **Fix:** Require references for image "create" action
2. ✅ **Fix:** Add storyboard approval gate to video generation
3. ✅ **Fix:** Add Style Card check before storyboard generation

### Priority 2: Core Objects
1. Create Style Card table and UI
2. Extend Project Bible structure
3. Build Reference Library with approval workflow

### Priority 3: Gates Enforcement
1. Implement approval state tracking for storyboards
2. Add gate checks to API routes
3. Build approval UI components

---

## Success Metrics

- ✅ 100% reference-first generation (zero "create" without references)
- ✅ 100% storyboard approval before video generation
- ✅ Style Card exists for all Continuity Mode projects
- ✅ All workflow gates enforced programmatically
- ✅ Clear mode separation in UI and workflows

---

## Notes

- **Risk:** Breaking existing workflows that don't have Style Cards
  - **Mitigation:** Grandfather existing projects, require for new projects
- **Risk:** Users may find gates frustrating
  - **Mitigation:** Clear UI messaging, allow "skip" with logging for Ad Mode
- **Technical Debt:** Current `projects.metadata` JSONB may need migration
  - **Mitigation:** Version the metadata structure
