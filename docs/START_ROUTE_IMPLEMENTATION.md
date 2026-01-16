# Start Route Implementation

## Overview

Implemented a new authenticated entry route `/start` that serves as the front door for starting new projects. Users land directly in Step 1 (Project Foundation) of the guided workflow - no dashboards, no project lists, just the workflow itself.

## Deliverables

### 1. Wireframe for `/start`

**Route:** `/start`

**Layout:**
```
┌─────────────────────────────────────┐
│                                     │
│         Start a Project             │
│  Begin your guided content          │
│  creation journey                   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Start a Project           │   │
│  └─────────────────────────────┘   │
│                                     │
│  You'll be guided through each      │
│  step of your project               │
│                                     │
└─────────────────────────────────────┘
```

**Features:**
- Centered card layout
- Single primary action button: "Start a Project"
- Authentication check with redirect to login if not authenticated
- Loading and error states
- Minimal, focused UI copy aligned with guided process

### 2. Project Creation + Redirect Flow

**Flow:**
1. User navigates to `/start`
2. Authentication check runs (with retry logic)
3. If not authenticated → redirect to `/login?next=/start`
4. User clicks "Start a Project"
5. Project is created via `projectsDb.create()` with defaults:
   - Name: "New Project"
   - Type: "campaign"
   - Status: "active"
   - Mode: "ad"
6. **Direct redirect to `/projects/:id`** (no query params)
7. Project detail page loads with **Step 1: Project Foundation** (References step in Create intent)
8. User is immediately in the guided workflow

**Implementation Details:**
- Uses existing backend logic (`projectsDb.create()`)
- No new backend endpoints required
- **No query params** - state-driven navigation
- Steps are UI/state-driven, not route-driven
- **No redirect to `/projects` list** - goes straight to workflow
- **No dashboard** - workflow is the first screen

### 3. Minimal UI Copy

**Copy Strategy:**
- **Start Page:** "Begin your guided content creation journey"
- **Step 1 Label:** "Project Foundation" (instead of "References")
- **Step Numbers:** Visual step numbers in PipelineSidebar (Step 1, Step 2, etc.)

**Guided Process Framing:**
- First step in Create intent is labeled "Project Foundation" (Step 1)
- All steps are visually numbered in the sidebar
- Steps are state-driven (not route-driven)
- Workflow starts immediately - no overview or introduction screens

## Implementation Files

### New Files
1. `frontend/src/app/start/page.tsx` - Start route page

### Modified Files
1. `frontend/src/app/projects/[id]/page.tsx` - Removed Overview, defaults to Step 1
2. `frontend/src/components/project/PipelineSidebar.tsx` - Added step numbering, renamed first step to "Project Foundation"

## Step Numbering System

**Visual Step Numbers:**
- **Step 1:** Project Foundation (References step in Create intent)
- **Step 2:** Style Card (Create intent)
- **Step 3:** Storyboard (Create intent)
- **Step 4:** Video (Create intent)
- **Step 5+:** Finish intent steps (Takes, Assembly, Look & Feel, Final Cut)
- **Step 9+:** Release intent steps (Assets, Narrative, Formats, Schedule, Distribution, Campaign Pack)
- **Step 15+:** Plan intent steps (Goals, Brief, Roadmap, Risks)

**Implementation:**
- Step numbers are calculated based on intent and step index
- Numbers are displayed in circular badges in PipelineSidebar
- Active step is highlighted with dark background
- Locked steps are visually disabled
- **Steps are state-driven, not route-driven** (no URL changes when navigating steps)

## User Flow

```
/start
  ↓ (auth check)
  ↓ (click "Start a Project")
  ↓ (create project)
/projects/:id
  ↓ (Step 1: Project Foundation - Create intent, References step)
  ↓ (navigate through steps - state-driven, no route changes)
```

## Requirements Met

✅ New authenticated entry route `/start`  
✅ Single primary action: "Start a Project"  
✅ Project creation using existing backend logic  
✅ **Direct redirect to `/projects/:id`** (no query params)  
✅ **Land directly in Step 1: Project Foundation** (no overview screen)  
✅ Steps visually reframed as numbered steps (UI-only)  
✅ **No redirect to `/projects` list**  
✅ **No dashboard as first screen**  
✅ **Steps are UI/state-driven, not route-driven**  
✅ Projects remain core container  
✅ Minimal UI copy aligned with guided system
