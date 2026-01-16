# Step 2: Structure - Design Package

## 1. Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [Step 2]  Structure                                       │
│  Organize your project into sections/outline before        │
│  generation                                                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  [Generate a starting outline]  (secondary button) │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Section 1: Opening                    [⋮] [×]     │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ • Hook                                       │   │   │
│  │  │ • Introduction                               │   │   │
│  │  │ • Setup                                      │   │   │
│  │  │ [+ Add Beat]                                 │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ • Create opening visuals                     │   │   │
│  │  │ • Write intro script                         │   │   │
│  │  │ [+ Add Task]                                 │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Section 2: Development                 [⋮] [×]     │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ • Main content                               │   │   │
│  │  │ • Key points                                 │   │   │
│  │  │ [+ Add Beat]                                 │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ • Develop main content                        │   │   │
│  │  │ [+ Add Task]                                 │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [+ Add Section]                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [Continue to Step 3]  (primary CTA, full width)   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Visual Hierarchy
- **Header**: Step badge + title + description
- **Secondary Action**: "Generate a starting outline" (small, top-right or below header)
- **Dominant Object**: Editable outline with sections (cards/list)
- **Section Controls**: 
  - Drag handle (⋮) for reorder
  - Delete (×) button
  - Expand/collapse for notes (optional)
- **Primary CTA**: Full-width button at bottom

### Section Card Structure (Collapsed by Default)
```
┌─────────────────────────────────────────┐
│ Section Title (editable)        [▼] [×] │
│                                         │
│ (Beats and Tasks hidden when collapsed) │
└─────────────────────────────────────────┘

### Section Card Structure (Expanded)
```
┌─────────────────────────────────────────┐
│ Section Title (editable)        [▲] [×] │
│                                         │
│ Key Points:                              │
│ • Key Point 1 (editable)          [×]    │
│ • Key Point 2 (editable)          [×]    │
│ [+ Add Key Point]                        │
│                                         │
│ Tasks:                                  │
│ • Task 1 (editable)               [×]    │
│ • Task 2 (editable)               [×]    │
│ [+ Add Task]                             │
└─────────────────────────────────────────┘
```

**Note**: "Beats" renamed to "Key Points" for clarity

## 2. State Behaviors

### Empty State
```
┌─────────────────────────────────────────────────────┐
│  [Step 2]  Structure                                │
│  Organize your project into sections/outline before  │
│  generation                                          │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │                                                │  │
│  │  [Generate a starting outline]                │  │
│  │                                                │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  No sections yet. Add your first section to   │  │
│  │  get started.                                 │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  [+ Add Section]                             │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │  [Continue to Step 3]  (disabled - gray)    │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Validation Rules
- **Block Continue if**: `outline.length === 0` (no sections)
- **Enable Continue if**: `outline.length > 0` (at least one section)
- **Visual feedback**: Disabled button state + tooltip: "Add at least one section to continue"

### Save Behavior
- **On Edit**: Auto-save to `project.metadata.outline` (debounced, 500ms)
- **On Continue**: 
  1. Final save to `project.metadata.outline`
  2. Navigate to Step 3 (References/Build)
  3. Show loading state during save

### Edit Interactions
- **Section Title**: Click to edit inline (or dedicated input field)
- **Expand/Collapse**: Click chevron (▼/▲) to toggle section expansion
- **Key Points/Tasks**: Click to edit inline (only visible when expanded)
- **Add**: Button adds empty item, focuses input
- **Delete**: Confirms if section has content, immediate if empty
- **Reorder**: Deferred unless trivial to implement

## 3. Mapping to Existing Components/Data

### Existing Components to Reuse
- **None** - This is a new focused view component
- **Pattern**: Similar to FoundationView (focused, no sidebars)
- **Layout**: Same centered card layout as FoundationView

### Data Structure Mapping

#### Current Project Metadata Schema
```typescript
project.metadata = {
  intent: string,              // From Step 1
  outputDirection: string,      // From Step 1
  existingMaterial?: string,   // From Step 1
  uploadedMaterialUrls?: string[], // From Step 1
  outline?: OutlineSection[]   // NEW - Step 2
}
```

#### Minimal Outline Schema
```typescript
interface OutlineSection {
  id: string;              // UUID or timestamp-based
  title: string;           // Section name (editable)
  order_index: number;     // For reordering (0, 1, 2...) - optional, defer if not trivial
  keyPoints: string[];     // Array of key point descriptions (renamed from "beats")
  tasks: string[];         // Array of task descriptions
  expanded?: boolean;      // Track expanded/collapsed state (default: false)
  notes?: string;          // Optional expanded notes (v2)
}

// Stored in: project.metadata.outline
```

**Note**: Reordering deferred unless trivial to implement. Sections collapsed by default.

#### State Management
```typescript
// Component state
const [outline, setOutline] = useState<OutlineSection[]>([]);

// Load from project.metadata.outline on mount
useEffect(() => {
  const savedOutline = project.metadata?.outline;
  if (savedOutline && Array.isArray(savedOutline)) {
    setOutline(savedOutline);
  } else {
    setOutline([]); // Empty state
  }
}, [project]);

// Save to project.metadata.outline
const saveOutline = async () => {
  await projectsDb.update(project.id, {
    metadata: {
      ...project.metadata,
      outline,
    },
  });
};
```

### No New Backend Required
- Uses existing `projectsDb.update()` method
- Stores in existing `project.metadata` JSONB field
- No new tables, no new API endpoints
- No new database migrations

## 4. Step Language Alignment

### Step Mapping
- **Step 1**: Foundation (existing)
- **Step 2**: Structure (this component)
- **Step 3**: Build (maps to Style Card + Storyboard)
- **Step 4**: Review (maps to Video)
- **Step 5**: Finish (placeholder)

### PipelineSidebar Update
```typescript
case 'create':
  return [
    { id: 'foundation', label: 'Foundation' },      // Step 1
    { id: 'structure', label: 'Structure' },        // Step 2
    { id: 'style-card', label: 'Build' },           // Step 3
    { id: 'storyboard', label: 'Build' },           // Step 3 (sub-step)
    { id: 'video', label: 'Review' },               // Step 4
    { id: 'finish', label: 'Finish' },              // Step 5
  ];
```

## 5. Constraints Compliance

✅ **No new backend logic**
- Uses existing `projectsDb.update()`
- Stores in existing `project.metadata` JSONB

✅ **No extra panels or features**
- Single focused view
- No sidebars, no context rail
- No chat panel during Step 2

✅ **Step language matches tabs**
- Step 1: Foundation
- Step 2: Structure
- Step 3: Build
- Step 4: Review
- Step 5: Finish

## 6. Implementation Checklist

- [ ] Create `StructureView.tsx` component
- [ ] Implement empty state with disabled CTA
- [ ] Implement section add/remove/edit
- [ ] Implement expand/collapse for sections (collapsed by default)
- [ ] Implement key points add/remove/edit (renamed from "beats")
- [ ] Implement tasks add/remove/edit
- [ ] Defer section reordering (unless trivial)
- [ ] Add "Generate a starting outline" button (secondary)
- [ ] Implement validation (block Continue if 0 sections)
- [ ] Implement auto-save on edits (debounced)
- [ ] Implement save on Continue + navigation
- [ ] Update PipelineSidebar to show Structure as Step 2
- [ ] Update FoundationView to navigate to Structure
- [ ] Hide sidebars during Step 2 (same as Step 1)
- [ ] Test empty state → add section → continue flow

## 7. Edge Cases

1. **User deletes all sections**: Show empty state, disable Continue
2. **User generates outline then edits**: Merge generated with existing or replace?
   - **Decision**: Replace (simpler, clearer)
3. **User navigates away without saving**: Auto-save should handle this
4. **Large outlines (10+ sections)**: Should scroll, no pagination needed
5. **Empty beats/tasks**: Allow empty arrays, validation only checks section count

## 8. Future Enhancements (Not in v1)

- Drag-and-drop reordering
- Expandable notes per section
- Section templates
- Import outline from file
- Export outline
- Collaboration (multiple users editing)
