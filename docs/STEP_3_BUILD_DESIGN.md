# Step 3: Build - Design Package

## Overview

Step 3: Build consolidates Style Card and Storyboard into a unified step. This combines visual style definition (Style Card) with storyboard frame generation (Storyboard) into a single focused workflow step.

## 1. Wireframe

### Main View (Style Card Required First)

```
┌─────────────────────────────────────────────────────────┐
│                                                           │
│  [Step 3]  Build                                         │
│  Define visual style and create storyboard frames       │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐│
│  │  Part 1: Style Card                                  ││
│  │  ┌──────────────────────────────────────────────┐   ││
│  │  │  Name: [Style Card 1]                         │   ││
│  │  │  Description: [Short description...]          │   ││
│  │  │  Visual References: [Upload/URL]              │   ││
│  │  │  Color Palette: [Select colors]               │   ││
│  │  │  Typography: [Select fonts]                   │   ││
│  │  │                                                │   ││
│  │  │  [Approve Style & Lock Direction]  (primary)  │   ││
│  │  └──────────────────────────────────────────────┘   ││
│  │                                                      ││
│  │  [+ Create Style Card]                              ││
│  └─────────────────────────────────────────────────────┘│
│                                                           │
│  ┌─────────────────────────────────────────────────────┐│
│  │  Part 2: Storyboard (locked until Style Card approved)││
│  │  ┌──────────────────────────────────────────────┐   ││
│  │  │  🔒 Approve Style Card to unlock Storyboard  │   ││
│  │  └──────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────┘│
│                                                           │
│  ┌─────────────────────────────────────────────────────┐│
│  │  [Continue to Step 4]  (disabled until ready)      ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

**Note**: Style Card simplified - only Name, Description, References, Color, Typography (no prompts/sliders/generation controls)

### Storyboard Unlocked (After Style Card Approval)

```
┌─────────────────────────────────────────────────────────┐
│                                                           │
│  [Step 3]  Build                                         │
│  Define visual style and create storyboard frames       │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐│
│  │  Part 1: Style Card  ✓ Approved                    ││
│  │  [View Style Card Details]                          ││
│  └─────────────────────────────────────────────────────┘│
│                                                           │
│  ┌─────────────────────────────────────────────────────┐│
│  │  Part 2: Storyboard                                 ││
│  │  ┌──────────────────────────────────────────────┐   ││
│  │  │  Storyboard frames visualize your structure  │   ││
│  │  │  and pacing before final video generation.   │   ││
│  │  │                                               │   ││
│  │  │  [Generate Storyboard]  (primary action)     │   ││
│  │  │                                               │   ││
│  │  │  Frames: [Grid of storyboard frames]         │   ││
│  │  │  • Frame 1 [Approved ✓] [Needs Changes ✗]   │   ││
│  │  │  • Frame 2 [Approved ✓] [Needs Changes ✗]   │   ││
│  │  │  • Frame 3 [Approved ✓] [Needs Changes ✗]   │   ││
│  │  │  ...                                          │   ││
│  │  │                                               │   ││
│  │  │  Progress: [X/12 frames approved]            │   ││
│  │  └──────────────────────────────────────────────┘   ││
│  └─────────────────────────────────────────────────────┘│
```

**Note**: 
- Storyboard empty state explains purpose (visualize structure/pacing)
- Approval states are binary: Approved / Needs Changes (visible badges)
│                                                           │
│  ┌─────────────────────────────────────────────────────┐│
│  │  [Continue to Step 4]  (enabled when all approved) ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### Visual Hierarchy
- **Header**: Step badge + title + description
- **Part 1**: Style Card section (always visible)
- **Part 2**: Storyboard section (locked until Style Card approved)
- **Primary CTA**: "Continue to Step 4" (disabled until requirements met)

## 2. State Behaviors

### Empty State
- **Style Card**: Shows "Create Style Card" button
- **Storyboard**: Locked (shows lock icon + message: "Approve Style Card to unlock Storyboard")
- **CTA**: Disabled (gray) with tooltip: "Complete Style Card and Storyboard to continue"

### Style Card States
- **No Style Card**: Show "Create Style Card" button
- **Pending**: Show "Approve Style & Lock Direction" primary button
- **Approved**: Show checkmark + "Style Card Approved & Locked" badge, unlock Storyboard section
- **Rejected**: Show "Needs Changes" badge, allow edit/create new

### Storyboard States
- **Locked**: Show lock UI + message "Approve Style Card to unlock Storyboard"
- **Unlocked (no frames)**: Show explanatory copy + "Generate Storyboard" button
  - Copy: "Storyboard frames visualize your structure and pacing before final video generation."
- **Has frames (pending approval)**: Show grid with binary approval states
  - Each frame shows: "Approved ✓" or "Needs Changes ✗" (visible badges)
- **All frames approved**: Show progress badge + enable "Continue to Step 4"

### Validation Rules
- **Block Continue if**:
  - No approved Style Card
  - OR Storyboard frames exist but not all approved
- **Enable Continue if**:
  - Style Card is approved
  - AND all storyboard frames are approved (if any exist)
- **CTA Text reflects progress**:
  - "Continue to Step 4" (default)
  - "Approve Style & Lock Direction" (when Style Card not approved)
  - "X/12 frames approved" (progress indicator when frames exist)

### Save Behavior
- **Style Card**: Auto-save on edit (debounced 500ms)
- **Storyboard**: Auto-save on frame approval/rejection
- **On Continue**: Final save + navigate to Step 4 (Review/Video)

## 3. Mapping to Existing Components/Data

### Existing Components to Reuse
- **StyleCardView**: Reuse the form/modal logic for creating/editing style cards
- **StoryboardFramesReview**: Reuse the frame review/approval logic
- **NanoBananaControls**: Reuse the storyboard generation component

### Data Structure Mapping

#### Style Card (Existing)
```typescript
interface StyleCard {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  description?: string;
  visual_references: string[];
  color_palette?: string[];
  typography?: Record<string, any>;
  mood_board?: string[];
  approval_status: ApprovalStatus;  // 'pending' | 'approved' | 'rejected'
  is_locked: boolean;
  approved_by?: string;
  approved_at?: string;
}

// Stored in: style_cards table
```

#### Storyboard Frames (Existing)
```typescript
interface StoryboardFrame {
  id: string;
  project_id: string;
  user_id: string;
  frame_number: number;
  image_url: string;
  description?: string;
  approval_status: ApprovalStatus;  // 'pending' | 'approved' | 'rejected'
  approved_by?: string;
  approved_at?: string;
}

// Stored in: storyboard_frames table
```

#### No New Schema Required
- Uses existing `style_cards` table
- Uses existing `storyboard_frames` table
- No new tables or fields needed

### Gate Logic (Existing)
```typescript
// From checkProjectGateStatus
gateStatus.hasApprovedStyleCard: boolean;
gateStatus.storyboardFrameCounts: {
  total: number;
  approved: number;
};
gateStatus.allStoryboardFramesApproved: boolean;
```

## 4. Step Flow & Gating

### Flow Sequence
1. **Style Card Creation**: User creates/edits style card
2. **Style Card Approval**: User approves style card → unlocks Storyboard
3. **Storyboard Generation**: User generates storyboard frames (optional)
4. **Frame Approval**: User approves all frames (if any generated)
5. **Continue**: Navigate to Step 4 (Review/Video)

### Gate Behavior
- **Style Card**: Required before Storyboard
- **Storyboard**: Optional, but if generated, all frames must be approved
- **Continue**: Enabled only when:
  - Style Card approved
  - AND (no storyboard frames OR all frames approved)

### Implementation Notes
- **Part 1 (Style Card)**: Always visible, can be edited
- **Part 2 (Storyboard)**: Locked until Style Card approved
- **Locked State**: Visual lock icon + message
- **Unlocked State**: Full storyboard generation/review UI

## 5. UI Consolidation Strategy

### Option A: Single Unified View (Recommended)
- Show Style Card section at top
- Show Storyboard section below (locked/unlocked based on Style Card)
- Single "Continue to Step 4" button at bottom
- No tabs or sub-navigation

### Option B: Tabs (Not Recommended)
- Tab 1: Style Card
- Tab 2: Storyboard (locked until Style Card approved)
- **Cons**: Adds complexity, breaks focused flow

### Recommendation: Option A
- Maintains focused, directional flow (like Foundation and Structure)
- Clear visual hierarchy (Style Card → Storyboard)
- Locked state is visually obvious
- Single CTA keeps users oriented

## 6. Implementation Checklist

- [ ] Create `BuildView.tsx` component
- [ ] Integrate Style Card creation/editing
- [ ] Implement Style Card approval workflow
- [ ] Show locked Storyboard section when Style Card not approved
- [ ] Unlock Storyboard when Style Card approved
- [ ] Integrate storyboard generation (NanoBananaControls)
- [ ] Integrate frame review/approval (StoryboardFramesReview logic)
- [ ] Implement validation (block Continue until requirements met)
- [ ] Update PipelineSidebar navigation (Step 3: Build)
- [ ] Update StructureView to navigate to Build
- [ ] Test gate logic (Style Card → Storyboard → Continue)

## 7. Constraints Compliance

✅ **No new backend logic**
- Uses existing `styleCardsDb` methods
- Uses existing `storyboardFramesDb` methods
- Uses existing `checkProjectGateStatus` function

✅ **No extra UI panels**
- Focused view (no sidebars during Step 3)
- Single unified view (no tabs)

✅ **Step language maintained**
- Step 1: Foundation
- Step 2: Structure
- Step 3: Build
- Step 4: Review
- Step 5: Finish

## 8. Edge Cases

1. **User rejects Style Card**: Allow edit or create new, Storyboard remains locked
2. **User generates storyboard then rejects Style Card**: Lock Storyboard again, mark frames as needs revision
3. **User approves Style Card but generates 0 frames**: Allow Continue (storyboard is optional)
4. **User approves some frames but not all**: Block Continue until all approved
5. **User deletes all frames**: Allow Continue (if Style Card approved)

## 9. Future Enhancements (Not in v1)

- Style Card templates
- Batch frame approval
- Frame reordering
- Frame notes/comments
- Style Card versioning
