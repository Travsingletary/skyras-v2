# SkyRas v2 - Nuclear UI Redesign Blueprint

**Date:** 2026-01-15
**Status:** 🔴 **PLANNING PHASE**
**Approach:** Complete UI rebuild from scratch
**Timeline:** 2-3 weeks (40-60 hours)
**Goal:** Expose powerful backend, remove confusion, delight users

---

## Executive Summary

**Current State:** Powerful 6-agent backend wrapped in confusing UI that hides 80% of capabilities.

**Target State:** Modern, intuitive interface that exposes all features with clarity, guides users through workflows, and demonstrates value immediately.

**Philosophy:** "Show, don't hide. Simple, not simplistic. Power with clarity."

---

## Part 1: What to Keep vs Trash

### ✅ KEEP (Backend - Don't Touch)

**Preserve 100% of backend:**
- All API routes (`/api/*`)
- Agent implementations (Marcus, Giorgio, Cassidy, Jamal, Letitia, Atlas)
- Database schema and migrations
- Workflow engine
- File processing pipeline
- Auth system (Supabase)
- Generation providers (SDXL, Kling, Runway, Pollo)
- Storage integration (Supabase + QNAP)

**Preserve specific UI components:**
- `AuthErrorBoundary.tsx` (just created, solid pattern)
- `auth-utils.ts` (just created, solid pattern)
- File upload components from `/app/page.tsx` (work well)
- WorkflowSuggestions component (useful)

### 🗑️ TRASH (Frontend - Rebuild)

**Delete entire directories:**
- `/src/app/projects/[id]/page.tsx` (complex workspace, rebuild simpler)
- `/src/components/project/*` (intent-based system too complex)
- `/src/components/layout/*` (confusing nav patterns)
- `/src/app/studio/page.tsx` (merge into unified chat)
- `/src/app/app/page.tsx` (merge into unified chat)
- `/src/app/dashboard/page.tsx` (already deprecated)

**Rewrite from scratch:**
- All page layouts
- Navigation system
- Project management UI
- Workflow display
- Agent activity visualization

**Remove concepts entirely:**
- "Intents" (Create/Finish/Release/Plan) - replace with simple steps
- "Gates" - replace with checklists
- "Command Surface" - merge into chat
- "Context Rail" - remove
- Three-column layouts - simplify to one or two columns

---

## Part 2: New Information Architecture

### Sitemap v2.0

```
PUBLIC (No Login)
├─ / - Landing Page
│   ├─ Hero with demo video
│   ├─ Feature showcase (6 agents)
│   ├─ Use cases
│   ├─ Pricing
│   └─ CTA: "Start Creating"
│
├─ /login - Standard auth
├─ /signup - Standard auth
└─ /docs - Help & guides

AUTHENTICATED
├─ /home - Command Center (new dashboard)
│   ├─ Welcome banner
│   ├─ Quick Actions (4 big buttons)
│   ├─ Today's Tasks (Atlas-powered)
│   ├─ Recent Activity feed
│   └─ Stats at a glance
│
├─ /create - Generation Hub
│   ├─ /create/image - Image generator
│   ├─ /create/video - Video generator
│   ├─ /create/music - Music generator
│   └─ /create/animate - Image animator
│
├─ /projects - Project Manager
│   ├─ Grid/list view
│   ├─ /projects/[id] - Simple project workspace
│   │   ├─ Overview tab
│   │   ├─ Assets tab
│   │   ├─ Timeline tab
│   │   └─ Share tab
│   └─ /projects/new - Project wizard
│
├─ /library - Asset Manager
│   ├─ All files view
│   ├─ By project filter
│   ├─ By type filter
│   ├─ Search
│   └─ Actions: Scan, Tag, Export
│
├─ /distribute - Distribution Hub
│   ├─ Schedule creator
│   ├─ Calendar view
│   ├─ Platform optimizer
│   └─ Posted content tracker
│
├─ /chat - Unified Chat Interface
│   ├─ Conversation history
│   ├─ Agent delegation visibility
│   ├─ Inline asset preview
│   ├─ Workflow creation notifications
│   └─ File upload
│
├─ /workflows - Workflow Monitor
│   ├─ Active workflows
│   ├─ Templates library
│   └─ /workflows/[id] - Detail view
│
└─ /settings - Account & Configuration
    ├─ Profile
    ├─ Team (future)
    ├─ API providers
    ├─ Billing
    └─ Preferences
```

### URL Structure Changes

| Old URL | New URL | Change |
|---------|---------|--------|
| `/` | `/` | Landing (keep) |
| `/studio` | `/home` | Rename (simplify) |
| `/app` | `/chat` | Rename + merge with /studio |
| `/projects` | `/projects` | Keep but simplify UI |
| `/projects/[id]` | `/projects/[id]` | Complete rebuild |
| `/workflows` | `/workflows` | Keep but add templates |
| `/library` | `/library` | Keep but add actions |
| `/dashboard` | **DELETE** | Already redirects |
| `/analytics` | `/home` (tab) | Merge into home |
| `/agent-console` | `/admin/agents` | Move to admin section |
| **NEW** | `/create` | Expose generation tools |
| **NEW** | `/distribute` | Expose distribution planner |

---

## Part 3: Page-by-Page Redesign

### Page 1: Landing Page `/`

**Current Problems:**
- "Unstuck" concept unclear
- No value proposition
- Redirects authenticated users immediately
- No feature showcase

**New Design:**

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] SkyRas                     Login    Start Creating  │
└─────────────────────────────────────────────────────────────┘

       CREATE CONTENT WITH AI THAT ACTUALLY HELPS

    From idea to finished content in minutes, not days.
           Your team of 6 AI specialists.

         [Watch 60s Demo] [Start Free Trial]

┌─────────────────────────────────────────────────────────────┐
│                    HOW IT WORKS                             │
│                                                             │
│  1. Tell Marcus what you need                              │
│  2. Your AI team gets to work                              │
│  3. Review, adjust, and ship                               │
│                                                             │
│  [Animated demo showing agent delegation]                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│               YOUR AI CREATIVE TEAM                         │
│                                                             │
│  🎨 Giorgio - Creative Director                            │
│     "I'll generate images, videos, and bring your vision   │
│      to life"                                              │
│                                                             │
│  📋 Cassidy - Compliance Guardian                          │
│     "I'll scan for licensing issues before you publish"    │
│                                                             │
│  📢 Jamal - Distribution Manager                           │
│     "I'll optimize and schedule your content for every     │
│      platform"                                             │
│                                                             │
│  📁 Letitia - Asset Organizer                             │
│     "I'll tag, catalog, and keep your library organized"   │
│                                                             │
│  ⚡ Atlas - Priority Manager                               │
│     "I'll help you focus on what matters today"           │
│                                                             │
│  🎯 Marcus - Project Manager                               │
│     "I coordinate everyone and keep you on track"          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   USE CASES                                 │
│                                                             │
│  [Card] Content Creators                                   │
│  Generate thumbnails, short videos, and music              │
│                                                             │
│  [Card] Marketing Teams                                    │
│  Create campaign assets and multi-platform content         │
│                                                             │
│  [Card] Agencies                                           │
│  Manage client projects with built-in compliance           │
└─────────────────────────────────────────────────────────────┘

            [Start Creating - It's Free]

      Footer: Features | Pricing | Docs | Blog
```

**Key Changes:**
- Clear value prop in 5 seconds
- Visual demo before signup
- Showcase all 6 agents with faces/personalities
- Concrete use cases
- No "unstuck" confusion

---

### Page 2: Home (Dashboard) `/home`

**Current Problems:**
- Two different dashboards (/studio and /dashboard)
- No clear "what to do next"
- Hidden features

**New Design:**

```
┌─────────────────────────────────────────────────────────────┐
│  [≡] SkyRas   Home  Create  Projects  Library  Chat       [⚙] │
└─────────────────────────────────────────────────────────────┘

Welcome back, Trav! ☀️
Here's what's happening today.

┌────────────── QUICK ACTIONS ──────────────────────────────┐
│                                                             │
│  [🎨 Generate Image]  [🎬 Generate Video]                 │
│                                                             │
│  [📁 View Library]    [💬 Chat with Marcus]               │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌────────────── TODAY'S TASKS ─────────────────────────────┐
│  Powered by Atlas                              [View All] │
│                                                             │
│  □ Review storyboard frames for "Product Demo"            │
│     Priority: High | Project: Product Demo                │
│                                                             │
│  □ Approve Giorgio's generated thumbnail                  │
│     Priority: Medium | Asset: thumb_v2.png                │
│                                                             │
│  □ Schedule Instagram post for Friday                     │
│     Priority: Low | Campaign: Spring Launch               │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌────────────── RECENT ACTIVITY ──────────────────────────┐
│                                                             │
│  🎨 Giorgio generated 3 images                 2 min ago  │
│     Project: Product Demo                                 │
│                                                             │
│  📋 Cassidy scanned 12 files                   1 hour ago │
│     Result: 2 warnings found                              │
│                                                             │
│  🎬 Giorgio completed video generation         3 hours ago │
│     Project: Brand Video                                  │
│                                                             │
│  [View all activity →]                                     │
└─────────────────────────────────────────────────────────────┘

┌───────────── AT A GLANCE ────────────────────────────────┐
│                                                             │
│  Projects          Active Workflows      Total Assets     │
│     12                    3                  247          │
│                                                             │
│  This Month        Generated             Cost Saved       │
│    +3 projects        156 assets           $1,240        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Key Changes:**
- Single unified dashboard
- Atlas-powered task prioritization visible
- Quick actions expose main features
- Real-time activity feed shows agent work
- Stats provide context

---

### Page 3: Create Hub `/create`

**Current Problems:**
- Generation features 100% hidden
- Must go through chat to generate
- No direct access to Giorgio

**New Design - Landing:**

```
┌─────────────────────────────────────────────────────────────┐
│  [≡] SkyRas   Home  CREATE  Projects  Library  Chat      [⚙] │
└─────────────────────────────────────────────────────────────┘

                  WHAT DO YOU WANT TO CREATE?

┌──────────────────────────────┐ ┌─────────────────────────────┐
│                              │ │                             │
│          🎨                  │ │          🎬                 │
│     GENERATE IMAGE           │ │     GENERATE VIDEO          │
│                              │ │                             │
│  Text-to-image or edit       │ │  Text or image to video     │
│  existing images             │ │  with AI                    │
│                              │ │                             │
│  [Start Creating →]          │ │  [Start Creating →]         │
│                              │ │                             │
└──────────────────────────────┘ └─────────────────────────────┘

┌──────────────────────────────┐ ┌─────────────────────────────┐
│                              │ │                             │
│          🎵                  │ │          ✨                 │
│     GENERATE MUSIC           │ │     ANIMATE IMAGE           │
│                              │ │                             │
│  AI-composed music from      │ │  Bring still images to      │
│  text descriptions           │ │  life with Pollo AI         │
│                              │ │                             │
│  [Start Creating →]          │ │  [Start Creating →]         │
│                              │ │                             │
└──────────────────────────────┘ └─────────────────────────────┘

┌────────────── RECENT GENERATIONS ────────────────────────┐
│                                                            │
│  [Thumbnail] video_demo.mp4        2 hours ago | Video    │
│  [Thumbnail] thumbnail_v3.png      1 day ago | Image      │
│  [Thumbnail] background_music.mp3  2 days ago | Audio     │
│                                                            │
│  [View All History →]                                      │
└────────────────────────────────────────────────────────────┘
```

**New Design - Image Generator `/create/image`:**

```
┌─────────────────────────────────────────────────────────────┐
│  [≡] SkyRas   Home  Create  Projects  Library  Chat      [⚙] │
└─────────────────────────────────────────────────────────────┘

   ← Back to Create                    GENERATE IMAGE

┌──────────────────────────────────────────────────────────────┐
│                       MAIN COLUMN                            │
│                                                              │
│  What do you want to create?                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ A professional headshot of a woman in business attire  │ │
│  │ with modern office background, natural lighting       │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Style (optional)                                           │
│  [Photorealistic ▾] [Add reference image]                  │
│                                                              │
│  Size                                                       │
│  ○ Square (1024x1024)  ○ Portrait (512x768)               │
│  ● Landscape (1024x512)                                    │
│                                                              │
│  [ ] Save to project: [Product Demo ▾]                     │
│                                                              │
│  ┌────────────────────────────────────┐                    │
│  │  💰 Estimated Cost: $0.02          │                    │
│  │  ⏱ Time: ~10 seconds                │                    │
│  │  🎨 Provider: SDXL (Replicate)     │                    │
│  └────────────────────────────────────┘                    │
│                                                              │
│  [Generate Image]  [Save as Draft]                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                       SIDEBAR                                │
│                                                              │
│  💡 Tips for great images                                    │
│  • Be specific about style and mood                         │
│  • Include lighting details                                 │
│  • Reference compositions (e.g., "portrait", "wide shot")  │
│                                                              │
│  [View example prompts →]                                    │
│                                                              │
│  ─────────────────────────────                              │
│                                                              │
│  Recent Generations                                          │
│  [Thumbnail] headshot_v1.png                                │
│  [Thumbnail] logo_concept.png                               │
│  [Thumbnail] background.png                                 │
│                                                              │
│  [View All →]                                                │
└──────────────────────────────────────────────────────────────┘

// After generation shows preview with:
// - Download button
// - Save to library
// - Use in project
// - Regenerate with variations
// - Edit prompt
```

**Key Changes:**
- Direct access to generation (no chat required)
- Cost and time estimates upfront
- Provider visibility
- Tips and examples inline
- Easy save to project workflow
- Clear iteration path

---

### Page 4: Projects `/projects`

**Current Problems:**
- Gate system confusing
- No onboarding
- Complex workspace overwhelming

**New Design - List View:**

```
┌─────────────────────────────────────────────────────────────┐
│  [≡] SkyRas   Home  Create  PROJECTS  Library  Chat      [⚙] │
└─────────────────────────────────────────────────────────────┘

Projects                                  [+ New Project]

[All ▾] [Active] [Completed] [Archived]         [⊞ Grid] [≡ List]

┌────────────────────────────────────────────────────────────┐
│  🎬 Product Demo Video                           In Progress │
│  Album • Campaign Mode                                      │
│                                                             │
│  Progress: ████████░░░░ 65%                                │
│  Next: Review 3 storyboard frames                          │
│                                                             │
│  Assets: 12 files • Team: You • Updated 2 hours ago       │
│                                                             │
│  [Open Project]                                             │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  🎨 Brand Identity Refresh                         Planning │
│  Client Work • Standard Mode                                │
│                                                             │
│  Progress: ██░░░░░░░░░░ 15%                                │
│  Next: Upload brand guidelines                             │
│                                                             │
│  Assets: 3 files • Team: You, 2 others • Updated 1 day ago│
│                                                             │
│  [Open Project]                                             │
└────────────────────────────────────────────────────────────┘

[Load More Projects]
```

**New Design - Project Detail `/projects/[id]`:**

```
┌─────────────────────────────────────────────────────────────┐
│  [≡] SkyRas   Home  Create  Projects  Library  Chat      [⚙] │
└─────────────────────────────────────────────────────────────┘

← Back to Projects              Product Demo Video         [⋮]

[Overview] [Assets] [Timeline] [Share]

┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  PROJECT CHECKLIST                                [Edit ▾]   │
│                                                              │
│  ✅ 1. Gather References                                    │
│      Uploaded 8 reference images                            │
│                                                              │
│  ✅ 2. Create Style Guide                                   │
│      Style card approved                                    │
│                                                              │
│  ⏳ 3. Design Storyboard                                    │
│      3 frames ready for review                 [Review Now] │
│                                                              │
│  ⏸ 4. Generate Video                                        │
│      Waiting for storyboard approval                        │
│                                                              │
│  ⏸ 5. Polish & Effects                                      │
│      Not started                                            │
│                                                              │
│  ⏸ 6. Export & Share                                        │
│      Not started                                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  QUICK ACTIONS                                               │
│                                                              │
│  [🎨 Generate Image] [🎬 Generate Video] [💬 Ask Marcus]   │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  RECENT ACTIVITY                                             │
│                                                              │
│  🎨 Giorgio created 3 storyboard frames       2 hours ago   │
│  📁 You uploaded reference_video.mp4          1 day ago     │
│  ✅ Style card approved                       2 days ago    │
│                                                              │
│  [View All Activity →]                                       │
└──────────────────────────────────────────────────────────────┘

// When clicking "Review Now" on storyboard step:
// Opens modal/drawer with frame thumbnails
// Approve/reject each frame
// Add comments
// Request changes
```

**Key Changes:**
- Removed "Intent" terminology completely
- Simple checklist replaces gate system
- Progress bar visual
- Quick actions embedded
- Activity feed shows what happened
- Each step has clear "Next Action"
- Can edit checklist per project needs

---

### Page 5: Library `/library`

**Current Problems:**
- Compliance scanning hidden
- Tagging features hidden
- No connection to projects

**New Design:**

```
┌─────────────────────────────────────────────────────────────┐
│  [≡] SkyRas   Home  Create  Projects  LIBRARY  Chat      [⚙] │
└─────────────────────────────────────────────────────────────┘

Library                                    [Upload Files]

┌────────────────────────────────────────────────────────────┐
│  [🔍 Search files...]                                       │
│                                                             │
│  Filter: [All Types ▾] [All Projects ▾] [Date ▾]          │
│                                                             │
│  Actions: [📋 Scan for Issues] [🏷 Bulk Tag] [📤 Export]   │
└────────────────────────────────────────────────────────────┘

247 files                      [⊞ Grid] [≡ List] [⚙ Settings]

[Select All] [Select None]

┌──────┬──────┬──────┬──────┐
│ [✓]  │ [✓]  │ [ ]  │ [ ]  │  // Grid of thumbnails
│ IMG  │ VID  │ IMG  │ AUD  │
│ 01   │ 02   │ 03   │ 04   │
└──────┴──────┴──────┴──────┘

// When clicking "Scan for Issues":
┌────────────────────────────────────────────────────────────┐
│  COMPLIANCE SCAN RESULTS            Powered by Cassidy 📋  │
│                                                             │
│  Scanned: 247 files                                        │
│  Duration: 3.2 seconds                                     │
│                                                             │
│  ⚠️ 2 Warnings Found                                        │
│  ✅ 245 files passed                                        │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ ⚠️ demo_track.mp3                        WARNING      │ │
│  │    Contains "DEMO" watermark in filename             │ │
│  │    Recommendation: Replace with licensed version     │ │
│  │    [View File] [Dismiss] [Replace]                   │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ ⚠️ stock_video_preview.mp4              WARNING      │ │
│  │    Contains "PREVIEW" in filename                    │ │
│  │    Recommendation: Purchase full license             │ │
│  │    [View File] [Dismiss] [Purchase]                  │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  [Export Report] [Scan Again]                              │
└────────────────────────────────────────────────────────────┘

// When clicking "Bulk Tag":
┌────────────────────────────────────────────────────────────┐
│  TAG FILES                             Powered by Letitia 📁│
│                                                             │
│  2 files selected                                          │
│                                                             │
│  Tags: [Add tag...]                                        │
│  • product-demo                                    [x]     │
│  • thumbnail                                       [x]     │
│  • approved                                        [x]     │
│                                                             │
│  Project: [Product Demo ▾]                                 │
│  Category: [Images ▾]                                      │
│                                                             │
│  [Apply Tags] [Cancel]                                     │
└────────────────────────────────────────────────────────────┘
```

**Key Changes:**
- Compliance scanning exposed as button
- Cassidy's work visible and attributed
- Letitia's tagging accessible
- Bulk operations supported
- Clear scan results with recommendations
- Export reports capability

---

### Page 6: Distribute `/distribute`

**Current Problems:**
- Distribution planning 100% hidden
- Jamal's capabilities unused
- No scheduling interface

**New Design:**

```
┌─────────────────────────────────────────────────────────────┐
│  [≡] SkyRas   Home  Create  Projects  Library  DISTRIBUTE [⚙] │
└─────────────────────────────────────────────────────────────┘

Distribution Hub                    Powered by Jamal 📢

[Schedule] [Calendar] [Posted] [Analytics]

┌────────────────────────────────────────────────────────────┐
│  CREATE POSTING SCHEDULE                                    │
│                                                             │
│  Campaign Name                                              │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Spring Product Launch                                 │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  Platforms                                                  │
│  [✓] Instagram  [✓] TikTok  [✓] YouTube  [ ] Twitter      │
│  [✓] Facebook  [ ] LinkedIn                                │
│                                                             │
│  Content Type                                               │
│  ● Short videos  ○ Images  ○ Mixed                         │
│                                                             │
│  Frequency                                                  │
│  Post [3 ▾] times per [Week ▾]                             │
│  Starting [Jan 20, 2026 ▾]                                 │
│                                                             │
│  Best times: Jamal recommends posting at:                  │
│  • Instagram: 9am, 2pm, 7pm EST                           │
│  • TikTok: 6am, 12pm, 9pm EST                             │
│  • YouTube: Upload 2pm, publish 6pm EST                    │
│                                                             │
│  [Generate Schedule] [Save Draft]                          │
└────────────────────────────────────────────────────────────┘

// After generating:
┌────────────────────────────────────────────────────────────┐
│  PROPOSED SCHEDULE                                  [Edit]  │
│                                                             │
│  Week 1 (Jan 20-26)                                        │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Mon Jan 20, 9:00 AM - Instagram                      │ │
│  │ Launch teaser video                                  │ │
│  │ [📹 Select asset] [✏️ Edit caption] [Approve]        │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  [View Full Calendar] [Export to Google Calendar]          │
│  [Connect Social Accounts] [Schedule All]                  │
└────────────────────────────────────────────────────────────┘
```

**Key Changes:**
- Jamal's capabilities front and center
- Platform-specific optimization visible
- Calendar integration
- Best time recommendations
- Asset selection workflow
- Social account connection

---

### Page 7: Chat `/chat`

**Current Problems:**
- Two separate chat interfaces (/studio and /app)
- Agent delegation hidden
- No inline asset preview
- Workflow creation silent

**New Design:**

```
┌─────────────────────────────────────────────────────────────┐
│  [≡] SkyRas   Home  Create  Projects  Library  CHAT      [⚙] │
└─────────────────────────────────────────────────────────────┘

Chat with Marcus                             [New Conversation]

┌────────────────────────────────────────────────────────────┐
│  CONVERSATION HISTORY                                       │
│                                                             │
│  YOU: I need a 30-second product demo video                │
│       9:45 AM                                               │
│                                                             │
│  MARCUS: Got it! I'll coordinate with the team.            │
│          9:45 AM                                            │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 🎯 WORKFLOW CREATED                                  │ │
│  │ "Product Demo Video"                                 │ │
│  │                                                      │ │
│  │ Steps:                                               │ │
│  │ 1. Giorgio will generate storyboard frames          │ │
│  │ 2. You'll review and approve                        │ │
│  │ 3. Giorgio will create the video                    │ │
│  │ 4. Letitia will catalog the final asset             │ │
│  │                                                      │ │
│  │ [View Workflow →]                                    │ │
│  └──────────────────────────────────────────────────────┘ │
│  9:45 AM                                                    │
│                                                             │
│  🎨 GIORGIO: Creating storyboard frames...                 │
│             9:46 AM                                         │
│                                                             │
│  ┌────────┐ ┌────────┐ ┌────────┐                         │
│  │ Frame  │ │ Frame  │ │ Frame  │                         │
│  │   1    │ │   2    │ │   3    │   // Inline previews    │
│  │ [View] │ │ [View] │ │ [View] │                         │
│  └────────┘ └────────┘ └────────┘                         │
│  9:47 AM                                                    │
│                                                             │
│  MARCUS: Giorgio finished the storyboard. Ready to review? │
│          [Approve All] [Review Each] [Request Changes]     │
│          9:47 AM                                            │
│                                                             │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│  [📎] [🎤] Type your message...                   [Send →] │
└────────────────────────────────────────────────────────────┘

// Sidebar shows:
// - Active workflows (3)
// - Recent files (5)
// - Available agents
// - Quick actions
```

**Key Changes:**
- Single unified chat (merged /studio and /app)
- Agent delegation visible ("Giorgio: Creating...")
- Workflow creation shown inline with steps
- Asset previews embedded in conversation
- Action buttons for approval workflows
- Shows who's working on what
- Marcus coordinates but agents speak

---

### Page 8: Workflows `/workflows`

**Current Problems:**
- Not clear when/how workflows created
- Template library hidden
- Progress tracking basic

**New Design:**

```
┌─────────────────────────────────────────────────────────────┐
│  [≡] SkyRas   Home  Create  Projects  Library  Chat      [⚙] │
└─────────────────────────────────────────────────────────────┘

Workflows                            [+ New from Template]

[Active (3)] [Completed] [Templates]

┌────────────────────────────────────────────────────────────┐
│  🎬 Product Demo Video                    In Progress       │
│  Created from conversation • 3 tasks • 2 hours ago         │
│                                                             │
│  Progress: ████████░░░░ 65% complete                       │
│                                                             │
│  ✅ Giorgio generated storyboard frames                    │
│  ⏳ Waiting for your review                                │
│  ⏸ Giorgio will generate video (blocked)                   │
│                                                             │
│  [Review Now →]                                             │
└────────────────────────────────────────────────────────────┘

// When clicking "Templates" tab:
┌────────────────────────────────────────────────────────────┐
│  WORKFLOW TEMPLATES                                         │
│                                                             │
│  ┌────────────────────────────┐                            │
│  │ 📋 Licensing Workflow      │                            │
│  │ Scan, review, and fix      │                            │
│  │ compliance issues          │                            │
│  │                            │                            │
│  │ [Use Template]             │                            │
│  └────────────────────────────┘                            │
│                                                             │
│  ┌────────────────────────────┐                            │
│  │ 🎨 Creative Project        │                            │
│  │ From concept to final      │                            │
│  │ polished content           │                            │
│  │                            │                            │
│  │ [Use Template]             │                            │
│  └────────────────────────────┘                            │
└────────────────────────────────────────────────────────────┘
```

**Key Changes:**
- Template library exposed
- Clear creation source (chat vs manual)
- Visual progress tracking
- Blocking reasons clear
- Direct action buttons
- Agent attribution per task

---

## Part 4: Design System & Component Library

### UI Framework Stack

**Replace current:** Basic Tailwind + custom components
**New stack:**
- **Base:** Next.js 14 + TypeScript (keep)
- **UI Library:** [Shadcn/ui](https://ui.shadcn.com/) (Radix + Tailwind)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Animation:** Framer Motion
- **Forms:** React Hook Form + Zod validation
- **Tables:** TanStack Table
- **Charts:** Recharts
- **Dates:** date-fns

**Why Shadcn?**
- Copy-paste components (not npm package)
- Customizable
- Accessible (Radix primitives)
- Modern design
- TypeScript native

### Color Palette

```css
/* Primary - Blue (Actions, Links) */
--primary: 220 90% 56%;
--primary-foreground: 0 0% 100%;

/* Secondary - Purple (Agents, Special) */
--secondary: 262 83% 58%;
--secondary-foreground: 0 0% 100%;

/* Accent - Green (Success, Complete) */
--accent: 142 76% 36%;
--accent-foreground: 0 0% 100%;

/* Warning - Orange */
--warning: 38 92% 50%;

/* Destructive - Red */
--destructive: 0 84% 60%;

/* Muted - Gray (Backgrounds) */
--muted: 210 40% 96%;
--muted-foreground: 215 16% 47%;

/* Background */
--background: 0 0% 100%;
--foreground: 222 47% 11%;

/* Card */
--card: 0 0% 100%;
--card-foreground: 222 47% 11%;

/* Agent Colors */
--giorgio: 330 81% 60%;  /* Pink */
--cassidy: 271 91% 65%;  /* Purple */
--jamal: 217 91% 60%;    /* Blue */
--letitia: 142 71% 45%;  /* Green */
--atlas: 45 93% 47%;     /* Yellow */
--marcus: 262 83% 58%;   /* Deep Purple */
```

### Typography

```css
/* Headings */
font-family: 'Inter', -apple-system, sans-serif;
--heading-1: 2.5rem/3rem font-bold;
--heading-2: 2rem/2.5rem font-bold;
--heading-3: 1.5rem/2rem font-semibold;
--heading-4: 1.25rem/1.75rem font-semibold;

/* Body */
--body-lg: 1.125rem/1.75rem font-normal;
--body-md: 1rem/1.5rem font-normal;
--body-sm: 0.875rem/1.25rem font-normal;
--body-xs: 0.75rem/1rem font-normal;

/* Code */
font-family: 'JetBrains Mono', monospace;
```

### Component Checklist

**Install from Shadcn:**
- [ ] Button (all variants)
- [ ] Card
- [ ] Dialog/Modal
- [ ] Dropdown Menu
- [ ] Form (with validation)
- [ ] Input
- [ ] Textarea
- [ ] Select
- [ ] Checkbox
- [ ] Radio Group
- [ ] Switch
- [ ] Tabs
- [ ] Toast (notifications)
- [ ] Progress Bar
- [ ] Skeleton (loading)
- [ ] Badge
- [ ] Avatar
- [ ] Separator
- [ ] Sheet (drawer)
- [ ] Command (cmd+k)
- [ ] Calendar
- [ ] Date Picker
- [ ] Table

**Custom Components to Build:**
- [ ] AgentAvatar (with color coding)
- [ ] WorkflowCard
- [ ] ProjectCard
- [ ] AssetCard
- [ ] ActivityFeedItem
- [ ] TaskChecklist
- [ ] GenerationForm
- [ ] CostEstimator
- [ ] ScanResults
- [ ] CalendarSchedule
- [ ] ProviderBadge
- [ ] NavigationBar
- [ ] QuickActions

---

## Part 5: Migration Strategy

### Approach: **Parallel Build + Cut-Over**

**Phase 1: Foundation (Week 1)**
1. Install Shadcn + dependencies
2. Set up new design tokens
3. Create base layout component
4. Build navigation component
5. Create shared components (Button, Card, etc.)
6. Set up new `/v2` route prefix

**Phase 2: Core Pages (Week 2)**
7. Build new landing page (`/v2`)
8. Build new home dashboard (`/v2/home`)
9. Build create hub (`/v2/create`)
10. Build library with actions (`/v2/library`)
11. Test with real data

**Phase 3: Complex Pages (Week 3)**
12. Build unified chat (`/v2/chat`)
13. Build simplified projects (`/v2/projects`)
14. Build distribute hub (`/v2/distribute`)
15. Build workflows with templates (`/v2/workflows`)
16. Mobile responsive polish

**Phase 4: Cut-Over (Week 4)**
17. Feature flag: `/v2` routes available
18. Beta test with users
19. Collect feedback
20. Fix critical issues
21. **Cut-over:** Redirect `/` → `/v2`, `/studio` → `/v2/home`, etc.
22. Delete old UI code
23. Remove `/v2` prefix (make it default)

**Rollback Plan:**
- Keep old routes functional until v2 proven
- Feature flag to switch between old/new
- Database unchanged (UI only)
- Can revert in 5 minutes

---

## Part 6: Implementation Timeline

### Week 1: Foundation + Landing (16 hours)

**Day 1-2: Setup (6 hours)**
- [ ] Install Shadcn UI + dependencies
- [ ] Configure design tokens (colors, fonts)
- [ ] Create base layout component
- [ ] Build navigation bar
- [ ] Set up `/v2` route structure

**Day 3-4: Landing Page (6 hours)**
- [ ] Hero section with demo video
- [ ] Agent showcase section
- [ ] Use cases section
- [ ] Pricing section (simple)
- [ ] Footer
- [ ] Mobile responsive

**Day 5: Home Dashboard (4 hours)**
- [ ] Quick actions grid
- [ ] Today's tasks (Atlas integration)
- [ ] Recent activity feed
- [ ] Stats cards
- [ ] Mobile responsive

### Week 2: Generation + Library (18 hours)

**Day 1-2: Create Hub (8 hours)**
- [ ] Create landing page (4 cards)
- [ ] Image generator form
- [ ] Video generator form
- [ ] Music generator form
- [ ] Animation form
- [ ] Recent generations list
- [ ] Cost estimator component
- [ ] Generation history

**Day 3-4: Library Enhancement (10 hours)**
- [ ] File grid/list view
- [ ] Search and filters
- [ ] Compliance scan button
- [ ] Scan results modal (Cassidy integration)
- [ ] Bulk tag interface (Letitia integration)
- [ ] Export functionality
- [ ] Mobile responsive

### Week 3: Chat + Projects + Distribute (20 hours)

**Day 1-2: Unified Chat (8 hours)**
- [ ] Chat message list
- [ ] Agent delegation visibility
- [ ] Inline asset preview
- [ ] Workflow creation notifications
- [ ] File upload integration
- [ ] Voice input/output (reuse from /app)
- [ ] Sidebar with context

**Day 2-3: Simplified Projects (8 hours)**
- [ ] Projects list view
- [ ] Project detail with checklist
- [ ] Remove intent terminology
- [ ] Progress tracking
- [ ] Activity feed per project
- [ ] Quick actions embedded
- [ ] Mobile responsive

**Day 4: Distribute Hub (4 hours)**
- [ ] Schedule creation form
- [ ] Platform recommendations (Jamal)
- [ ] Calendar view
- [ ] Export to Google Calendar
- [ ] Posted content tracker

### Week 4: Workflows + Polish + Launch (12 hours)

**Day 1: Workflows (4 hours)**
- [ ] Active workflows list
- [ ] Workflow templates gallery
- [ ] Template selection flow
- [ ] Progress visualization
- [ ] Task detail view

**Day 2-3: Polish (6 hours)**
- [ ] Mobile responsive review all pages
- [ ] Loading states consistency
- [ ] Error states consistency
- [ ] Empty states with illustrations
- [ ] Keyboard shortcuts (cmd+k)
- [ ] Accessibility audit (WCAG AA)

**Day 4-5: Launch (2 hours)**
- [ ] User acceptance testing
- [ ] Fix critical bugs
- [ ] Update docs
- [ ] Cut-over to v2
- [ ] Delete old code
- [ ] Celebrate 🎉

**Total: 66 hours (~3 weeks at 20 hours/week)**

---

## Part 7: Success Metrics

### Before vs After

| Metric | Current | Target |
|--------|---------|--------|
| Time to first value | ~10 min | <60 seconds |
| Feature discovery rate | 20% | 80% |
| User confusion score | 8/10 | 2/10 |
| Mobile usability | 3/10 | 9/10 |
| Generation tool usage | 5% | 60% |
| Compliance scan usage | 0% | 40% |
| Distribution plan usage | 0% | 30% |
| Pages to complete task | 5+ | 2-3 |
| Bounce rate | 65% | <30% |

### User Testing Checklist

**Test with 5 new users:**
- [ ] Can they understand what SkyRas does in 30 seconds?
- [ ] Can they generate an image without help?
- [ ] Can they find the compliance scanner?
- [ ] Do they understand agents are helping them?
- [ ] Can they create a project and complete first step?
- [ ] Do they notice when Marcus delegates work?
- [ ] Can they navigate on mobile?
- [ ] Do they feel overwhelmed or confident?

### Launch Criteria

- [ ] All 8 core pages complete
- [ ] Mobile responsive (tested on 3 devices)
- [ ] Accessibility score >90 (Lighthouse)
- [ ] Performance score >80 (Lighthouse)
- [ ] 5 user tests passed
- [ ] No critical bugs
- [ ] Feature parity with old UI (all capabilities exposed)
- [ ] Docs updated
- [ ] Old UI deprecated

---

## Part 8: What Could Go Wrong

### Risk Analysis

**Risk 1: Timeline Slip**
- **Likelihood:** Medium
- **Impact:** Low (iterative rollout mitigates)
- **Mitigation:** Ship MVP first (landing, home, create), iterate on rest

**Risk 2: User Resistance to Change**
- **Likelihood:** Medium
- **Impact:** Medium
- **Mitigation:**
  - Keep old UI available during transition
  - Offer "Classic UI" toggle for 2 weeks
  - Collect feedback and iterate quickly

**Risk 3: Hidden Dependencies**
- **Likelihood:** Low
- **Impact:** High
- **Mitigation:**
  - UI is decoupled from backend
  - Same API routes
  - Test with production data early

**Risk 4: Mobile Performance**
- **Likelihood:** Low
- **Impact:** Medium
- **Mitigation:**
  - Mobile-first design
  - Test on real devices weekly
  - Lazy load images/components

**Risk 5: Accessibility Issues**
- **Likelihood:** Low (Radix primitives are accessible)
- **Impact:** Medium
- **Mitigation:**
  - Lighthouse audits weekly
  - Keyboard navigation testing
  - Screen reader testing

---

## Part 9: Quick Start Guide

### To Begin Tomorrow:

```bash
# Install Shadcn
npx shadcn-ui@latest init

# Install dependencies
npm install @radix-ui/react-icons framer-motion recharts date-fns

# Create new route structure
mkdir -p frontend/src/app/v2/{home,create,projects,library,distribute,chat,workflows}

# Install base components
npx shadcn-ui@latest add button card dialog input textarea select badge avatar

# Start with landing page
code frontend/src/app/v2/page.tsx
```

### First Sprint (Week 1):
1. **Monday:** Setup Shadcn, configure design system
2. **Tuesday:** Build navigation and layout
3. **Wednesday:** Start landing page hero
4. **Thursday:** Finish landing page
5. **Friday:** Build home dashboard

Ship v2 landing + home by end of Week 1 to validate approach.

---

## Part 10: Decision Points

### Requires Your Input

**1. Branding:**
- Keep "SkyRas" name?
- Logo refresh?
- Agent personalities/avatars?

**2. Pricing Page:**
- Include now or later?
- Tiers defined?

**3. Onboarding:**
- Guided tour for new users?
- Sample project with data?
- Video tutorials?

**4. Beta Testing:**
- Who should test v2 first?
- Private beta or public launch?

**5. Old UI Deprecation:**
- Hard cut-over or gradual transition?
- Classic UI toggle period?

---

## Conclusion

**This is doable. You have a solid backend. Time to give it the UI it deserves.**

**Next Steps:**
1. Review this blueprint
2. Approve design direction
3. Answer decision points
4. I'll create detailed wireframes
5. Start Week 1 implementation

**Ready to start?**

Let me know:
- Any changes to the plan?
- Which agent personalities/avatars you envision?
- Should I create detailed wireframes for each page?
- Want to start with landing page build today?

---

*Prepared by: Claude Sonnet 4.5*
*Date: 2026-01-15*
*Status: ✅ Ready for Approval & Implementation*
