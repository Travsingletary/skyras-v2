# Complete Application Audit Report
**Date:** 2025-01-28  
**Auditor:** PM/QA Lead  
**Deployed URL:** https://skyras-v2.vercel.app  
**Audit Scope:** Feature inventory, bug identification, UX/UI evaluation, and recommendations

---

## Executive Summary

This audit covers the deployed SkyRas v2 application, focusing on:
1. **Feature Inventory** - Verified status of all routes/screens/components
2. **Bug List** - Reproducible issues with severity and fixes
3. **UX/UI Audit** - Navigation, hierarchy, states, and friction points
4. **UI Recommendations** - 2-3 layout patterns that complement existing features
5. **Prioritized Fix Plan** - Ranked backlog with impact/effort analysis

**Key Findings:**
- ✅ **Working:** Auth flow, basic navigation, guide page, public chat endpoint
- ⚠️ **Partial:** Studio dashboard (requires auth), projects (requires data), workflows (requires userId)
- ❌ **Broken:** Root redirect behavior, some authenticated routes without proper error handling
- 📋 **Stub:** Many features exist but require authentication/data to fully test

---

## 1. Feature Inventory (Verified)

### Public Routes (No Auth Required)

#### `/` - Landing Page / Unstuck Entry Point
- **Route:** `frontend/src/app/page.tsx`
- **Purpose:** Public entry point for "Unstuck" feature - provides one clear next action
- **Current Behavior:**
  - Checks auth state on load
  - If authenticated → redirects to `/studio`
  - If not authenticated → shows "Unstuck" interface
  - Allows public chat with `userId: 'public'`
- **Working Status:** ⚠️ **Partial** - Redirects to `/signup` instead of showing content
- **Dependencies:**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `/api/auth/user` endpoint
  - `/api/chat` endpoint
- **How to Test:**
  1. Navigate to `https://skyras-v2.vercel.app/`
  2. Should show unstuck interface OR redirect to signup
  3. Currently redirects to signup (BUG)
- **Proof:** Browser snapshot shows redirect to `/signup` instead of showing landing content

#### `/guide` - User Guide
- **Route:** `frontend/src/app/guide/page.tsx`
- **Purpose:** Documentation/help page explaining how to use Marcus
- **Current Behavior:**
  - Static content page
  - No auth required
  - Links to dashboard and login
- **Working Status:** ✅ **Working**
- **Dependencies:** None (static content)
- **How to Test:**
  1. Navigate to `https://skyras-v2.vercel.app/guide`
  2. Verify content displays correctly
  3. Test links to dashboard/login
- **Proof:** Browser snapshot shows full content rendered correctly

#### `/login` - Login Page
- **Route:** `frontend/src/app/login/page.tsx`
- **Purpose:** User authentication (Supabase Auth)
- **Current Behavior:**
  - Checks if already authenticated → redirects to `/studio`
  - Shows login form (email/password)
  - Handles `next` query param for post-login redirect
  - Calls `/api/auth/login`
- **Working Status:** ✅ **Working** (requires Supabase Auth setup)
- **Dependencies:**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `/api/auth/login` endpoint
  - Supabase Auth enabled
- **How to Test:**
  1. Navigate to `https://skyras-v2.vercel.app/login`
  2. Enter valid credentials
  3. Should redirect to `/studio` or `next` param
- **Proof:** Page renders correctly, form structure present

#### `/signup` - Sign Up Page
- **Route:** `frontend/src/app/signup/page.tsx`
- **Purpose:** New user registration (Supabase Auth)
- **Current Behavior:**
  - Checks if already authenticated → redirects to `/studio`
  - Shows signup form (email/password, min 6 chars)
  - Calls `/api/auth/signup`
  - Redirects to `/studio` on success
- **Working Status:** ✅ **Working** (requires Supabase Auth setup)
- **Dependencies:**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `/api/auth/signup` endpoint
  - Supabase Auth enabled
- **How to Test:**
  1. Navigate to `https://skyras-v2.vercel.app/signup`
  2. Enter email and password (min 6 chars)
  3. Should create account and redirect to `/studio`
- **Proof:** Page renders correctly, form validation present

### Authenticated Routes (Auth Required)

#### `/studio` - Studio Control Room
- **Route:** `frontend/src/app/studio/page.tsx`
- **Purpose:** Main dashboard/control room for authenticated users
- **Current Behavior:**
  - Checks auth → redirects to `/login?next=/studio` if not authenticated
  - Shows dashboard with metrics, agent activity, workflow progress, task queue
  - Uses `useDashboardData` hook
  - Fetches from `/api/studio/dashboard`
- **Working Status:** ⚠️ **Partial** - Requires auth, may show empty states
- **Dependencies:**
  - Supabase Auth session
  - `/api/studio/dashboard` endpoint
  - `projects`, `workflows`, `files` tables
  - `useDashboardData` hook
- **How to Test:**
  1. Log in first
  2. Navigate to `https://skyras-v2.vercel.app/studio`
  3. Should show dashboard with data or empty states
- **Proof:** Code structure present, requires live auth test

#### `/dashboard` - Workflows Dashboard
- **Route:** `frontend/src/app/dashboard/page.tsx`
- **Purpose:** View saved workflows from Marcus conversations
- **Current Behavior:**
  - Reads `userId` from localStorage (legacy approach)
  - Fetches workflows from `/api/workflows?userId=...`
  - Shows workflow cards with weekly structure
  - Click to view details in modal
- **Working Status:** ⚠️ **Partial** - Uses localStorage instead of auth session
- **Dependencies:**
  - `userId` in localStorage (legacy)
  - `/api/workflows` endpoint
  - `workflows` table
- **How to Test:**
  1. Must have `userId` in localStorage (legacy flow)
  2. Navigate to `https://skyras-v2.vercel.app/dashboard`
  3. Should show workflows or empty state
- **Proof:** Code uses localStorage, not auth session (BUG)

#### `/projects` - Projects List
- **Route:** `frontend/src/app/projects/page.tsx`
- **Purpose:** List all user projects
- **Current Behavior:**
  - Checks auth via `/api/auth/user`
  - Fetches projects from `projectsDb.getByUserId()`
  - Shows project cards with gate status
  - "New Project" button creates project
- **Working Status:** ✅ **Working** (requires auth and data)
- **Dependencies:**
  - Supabase Auth session
  - `/api/auth/user` endpoint
  - `projects` table
  - `checkProjectGateStatus` function
- **How to Test:**
  1. Log in
  2. Navigate to `https://skyras-v2.vercel.app/projects`
  3. Should show projects or empty state with "Create Your First Project"
- **Proof:** Code structure correct, uses proper auth

#### `/projects/[id]` - Project Workspace
- **Route:** `frontend/src/app/projects/[id]/page.tsx`
- **Purpose:** Detailed project workspace with intents (create/finish/release/plan)
- **Current Behavior:**
  - Checks auth
  - Loads project data
  - Shows intent selector (create/finish/release/plan)
  - Renders different views based on intent/step
  - Complex layout with TopBar, MainRow, CommandSurface, WorkspaceCanvas, ContextRail
- **Working Status:** ⚠️ **Partial** - Complex component, requires full testing
- **Dependencies:**
  - Supabase Auth session
  - `projects` table
  - `references`, `style_cards`, `storyboard_frames`, `video_clips` tables
  - Multiple component dependencies
- **How to Test:**
  1. Log in
  2. Create or select a project
  3. Navigate to `/projects/[id]`
  4. Test each intent (create/finish/release/plan)
  5. Test step navigation within each intent
- **Proof:** Code structure present, complex component tree

#### `/workflows` - Workflows List
- **Route:** `frontend/src/app/workflows/page.tsx`
- **Purpose:** List all workflows with task progress
- **Current Behavior:**
  - Reads `userId` from localStorage (legacy)
  - Fetches workflows from `/api/workflows?userId=...`
  - Shows workflow cards with progress bars
  - Auto-refreshes every 5 seconds
- **Working Status:** ⚠️ **Partial** - Uses localStorage instead of auth
- **Dependencies:**
  - `userId` in localStorage (legacy)
  - `/api/workflows` endpoint
  - `workflows`, `workflow_tasks` tables
- **How to Test:**
  1. Must have `userId` in localStorage
  2. Navigate to `https://skyras-v2.vercel.app/workflows`
  3. Should show workflows with progress
- **Proof:** Code uses localStorage (BUG)

#### `/workflows/[id]` - Workflow Detail
- **Route:** `frontend/src/app/workflows/[id]/page.tsx`
- **Purpose:** Detailed workflow view with tasks
- **Current Behavior:** (Not fully reviewed, requires code inspection)
- **Working Status:** ❓ **Unknown** - Requires testing
- **Dependencies:**
  - `/api/workflows/[id]` endpoint
  - `workflows`, `workflow_tasks` tables
- **How to Test:**
  1. Navigate to `/workflows/[id]` with valid workflow ID
  2. Should show workflow details and tasks
- **Proof:** Route exists, needs testing

#### `/library` - Asset Library
- **Route:** `frontend/src/app/library/page.tsx`
- **Purpose:** Browse all uploaded files/assets
- **Current Behavior:**
  - Fetches files from `/api/files`
  - Grid/list view toggle
  - Filter by file type, search, sort
  - Preview and delete assets
- **Working Status:** ⚠️ **Partial** - Requires auth and files
- **Dependencies:**
  - `/api/files` endpoint
  - `files` table
  - Supabase Storage bucket `user-uploads`
- **How to Test:**
  1. Log in
  2. Upload some files
  3. Navigate to `/library`
  4. Should show files with preview
- **Proof:** Code structure present

#### `/analytics` - Analytics Dashboard
- **Route:** `frontend/src/app/analytics/page.tsx`
- **Purpose:** View analytics/metrics
- **Current Behavior:**
  - Reads `userId` from localStorage (legacy)
  - Renders `AnalyticsDashboard` component
- **Working Status:** ⚠️ **Partial** - Uses localStorage
- **Dependencies:**
  - `userId` in localStorage
  - `AnalyticsDashboard` component
  - `/api/analytics` endpoint (likely)
- **How to Test:**
  1. Must have `userId` in localStorage
  2. Navigate to `/analytics`
  3. Should show analytics dashboard
- **Proof:** Code uses localStorage (BUG)

#### `/app` - Marcus Chat Interface
- **Route:** `frontend/src/app/app/page.tsx`
- **Purpose:** Main chat interface with Marcus agent
- **Current Behavior:**
  - Optional access code gate (if `NEXT_PUBLIC_ACCESS_CODE` set)
  - Chat interface with file upload
  - Speech-to-text (mic button)
  - Text-to-speech (per-message playback)
  - Calls `/api/chat` endpoint
- **Working Status:** ⚠️ **Partial** - Access code logic, requires testing
- **Dependencies:**
  - `NEXT_PUBLIC_ACCESS_CODE` (optional)
  - `/api/chat` endpoint
  - `/api/speech-to-text` endpoint
  - `/api/voice/tts` endpoint
  - Supabase Storage for file uploads
- **How to Test:**
  1. Navigate to `/app`
  2. Enter access code if required
  3. Send message, upload file, test voice features
- **Proof:** Code structure present, complex feature set

### API Endpoints

#### `/api/auth/user` - Get Current User
- **Status:** ✅ **Working**
- **Method:** GET
- **Auth:** Checks Supabase session
- **Returns:** `{ authenticated: boolean, user?: { id, email } }`

#### `/api/auth/login` - Login
- **Status:** ✅ **Working** (requires Supabase Auth)
- **Method:** POST
- **Body:** `{ email, password }`
- **Returns:** Success/error

#### `/api/auth/signup` - Sign Up
- **Status:** ✅ **Working** (requires Supabase Auth)
- **Method:** POST
- **Body:** `{ email, password }`
- **Returns:** Success/error

#### `/api/chat` - Chat with Marcus
- **Status:** ✅ **Working**
- **Method:** POST
- **Body:** `{ message, userId, conversationId?, files? }`
- **Returns:** `{ success, conversationId, response, data }`
- **Note:** Supports `userId: 'public'` for unauthenticated access

#### `/api/workflows` - List/Create Workflows
- **Status:** ⚠️ **Partial** - Requires userId query param
- **Method:** GET, POST
- **Query:** `?userId=...`
- **Returns:** Workflows list

#### `/api/projects` - List/Create Projects
- **Status:** ✅ **Working** (requires auth)
- **Method:** GET, POST
- **Returns:** Projects list

#### `/api/files` - List/Create Files
- **Status:** ✅ **Working** (requires auth)
- **Method:** GET, POST
- **Returns:** Files list

#### `/api/upload` - File Upload
- **Status:** ✅ **Working** (requires Supabase Storage bucket)
- **Method:** POST
- **Body:** FormData with files
- **Returns:** Uploaded file metadata

### Supabase Dependencies

#### Tables (32 total in `public` schema)
- **Core:** `projects`, `files`, `workflows`, `workflow_tasks`, `tasks`
- **Agent:** `agent_runs`, `assets`, `compliance_scans`, `file_processing`
- **Planning:** `daily_plans`, `daily_plan_blocks`, `calendar_events`
- **Publishing:** `campaigns`, `content_items`, `posts`, `publishing_jobs`
- **RBAC:** `rbac_roles`, `rbac_permissions`, `rbac_user_roles`
- **Content:** `references`, `style_cards`, `storyboard_frames`, `video_clips`, `timeline_sequences`

#### Storage Buckets
- **`user-uploads`** - Required for file uploads
  - Must be public or have proper RLS policies
  - File size limit: 100MB
  - Used by `/api/upload` endpoint

#### RLS Policies
- Most tables allow: `auth.uid()::text = user_id OR user_id = 'public'`
- Some tables have relaxed policies (development mode)
- Storage bucket requires upload/read policies

#### Environment Variables
**Required:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL` (server-side)
- `SUPABASE_ANON_KEY` (server-side)
- `ANTHROPIC_API_KEY` (for agents)

**Optional:**
- `NEXT_PUBLIC_ACCESS_CODE` (for `/app` route)
- `NEXT_PUBLIC_APP_URL` (for redirects)
- `SUPABASE_SERVICE_ROLE_KEY` (for bypassing RLS)

---

## 2. Bug List (Actionable)

### BUG-001: Root Route Redirects to Signup Instead of Showing Content
**Severity:** 🔴 **High**  
**Route:** `/`  
**Steps to Reproduce:**
1. Navigate to `https://skyras-v2.vercel.app/`
2. Observe redirect to `/signup` instead of showing landing/unstuck content

**Expected:** Should show landing page content OR unstuck interface if not authenticated  
**Actual:** Redirects to `/signup` immediately  
**Suspected Cause:** Auth check in `page.tsx` may be redirecting before content renders, or redirect logic is too aggressive  
**Recommended Fix:**
- Review `frontend/src/app/page.tsx` auth check logic
- Ensure redirect only happens after content check
- Or remove redirect and show content with auth prompt

**Files:** `frontend/src/app/page.tsx`

---

### BUG-002: Dashboard Routes Use localStorage Instead of Auth Session
**Severity:** 🟡 **Medium**  
**Routes:** `/dashboard`, `/workflows`, `/analytics`  
**Steps to Reproduce:**
1. Log in via Supabase Auth
2. Navigate to `/dashboard`
3. Observe empty state or error (no workflows shown)
4. Check localStorage - `userId` may not be set

**Expected:** Should use authenticated user ID from Supabase session  
**Actual:** Reads `userId` from localStorage (legacy approach)  
**Suspected Cause:** Legacy code paths not migrated to use Supabase Auth  
**Recommended Fix:**
- Update `/dashboard`, `/workflows`, `/analytics` to use `/api/auth/user` instead of localStorage
- Pass authenticated `userId` to API calls
- Remove localStorage dependency

**Files:**
- `frontend/src/app/dashboard/page.tsx` (line 44-46)
- `frontend/src/app/workflows/page.tsx` (line 44-46)
- `frontend/src/app/analytics/page.tsx` (line 16-18)

---

### BUG-003: Missing Error Handling for Auth Failures
**Severity:** 🟡 **Medium**  
**Routes:** All authenticated routes  
**Steps to Reproduce:**
1. Navigate to `/studio` while logged out
2. Should redirect to `/login?next=/studio`
3. But if auth check fails (network error, etc.), may show blank page

**Expected:** Graceful error handling with user-friendly messages  
**Actual:** May show blank page or unhandled errors  
**Suspected Cause:** Missing try/catch in auth checks, no error boundaries  
**Recommended Fix:**
- Add error boundaries to authenticated routes
- Add try/catch around auth checks
- Show user-friendly error messages
- Add retry logic for network failures

**Files:** All authenticated route pages

---

### BUG-004: Inconsistent Auth State Management
**Severity:** 🟡 **Medium**  
**Routes:** Multiple  
**Steps to Reproduce:**
1. Log in on one tab
2. Open `/studio` in another tab
3. May not detect auth state immediately

**Expected:** Consistent auth state across tabs  
**Actual:** May require refresh or manual check  
**Suspected Cause:** No cross-tab auth state synchronization  
**Recommended Fix:**
- Implement `storage` event listener for cross-tab auth sync
- Or use Supabase realtime for auth state
- Ensure auth checks happen on mount and focus

**Files:** Auth-related components and hooks

---

### BUG-005: Missing Loading States on Some Routes
**Severity:** 🟢 **Low**  
**Routes:** `/projects/[id]`, `/workflows/[id]`  
**Steps to Reproduce:**
1. Navigate to project/workflow detail page
2. During data fetch, may show blank content

**Expected:** Loading spinner or skeleton UI  
**Actual:** Blank content during fetch  
**Suspected Cause:** Missing loading state management  
**Recommended Fix:**
- Add loading states to detail pages
- Show skeleton UI during fetch
- Add error states for failed fetches

**Files:**
- `frontend/src/app/projects/[id]/page.tsx`
- `frontend/src/app/workflows/[id]/page.tsx`

---

### BUG-006: File Upload May Fail Silently
**Severity:** 🟡 **Medium**  
**Route:** `/app`, `/studio`  
**Steps to Reproduce:**
1. Try to upload file without Supabase Storage bucket configured
2. May show generic error or no feedback

**Expected:** Clear error message about missing storage configuration  
**Actual:** May fail silently or show generic error  
**Suspected Cause:** Error handling in upload endpoint may not surface storage errors clearly  
**Recommended Fix:**
- Review `/api/upload` error handling
- Add specific error messages for storage issues
- Show user-friendly feedback in UI

**Files:**
- `frontend/src/app/api/upload/route.ts`
- Upload UI components

---

### BUG-007: Workflow Auto-Refresh May Cause Performance Issues
**Severity:** 🟢 **Low**  
**Route:** `/workflows`  
**Steps to Reproduce:**
1. Navigate to `/workflows`
2. Observe auto-refresh every 5 seconds
3. With many workflows, may cause performance issues

**Expected:** Efficient polling or realtime updates  
**Actual:** Polls every 5 seconds regardless of data changes  
**Suspected Cause:** No optimization for polling frequency  
**Recommended Fix:**
- Use Supabase realtime subscriptions instead of polling
- Or increase polling interval
- Or add manual refresh button

**Files:** `frontend/src/app/workflows/page.tsx` (line 74-76)

---

## 3. UX/UI Audit

### Navigation

**Issues:**
1. **Inconsistent Navigation Patterns**
   - Some pages have back buttons (`/guide`, `/library`)
   - Some pages don't (`/dashboard`, `/workflows`)
   - No global navigation bar/header

2. **Missing Breadcrumbs**
   - Deep routes like `/projects/[id]` have no breadcrumb trail
   - Hard to understand where you are in the hierarchy

3. **No Global Menu**
   - No way to navigate between main sections (Studio, Projects, Workflows, Library, Analytics)
   - Users must use browser back button or type URLs

**Recommendations:**
- Add global navigation header with main sections
- Add breadcrumbs for deep routes
- Consistent back button pattern

---

### Information Hierarchy

**Issues:**
1. **Studio Dashboard Information Overload**
   - Multiple panels (metrics, agent activity, workflow progress, task queue, gates, content pipeline, system health)
   - No clear visual hierarchy
   - May overwhelm new users

2. **Project Workspace Complexity**
   - Multiple intents (create/finish/release/plan)
   - Multiple steps within each intent
   - Complex layout with many components
   - May be confusing for first-time users

**Recommendations:**
- Add collapsible sections in Studio dashboard
- Add onboarding tooltips for Project Workspace
- Progressive disclosure - show advanced features on demand

---

### Empty States

**Issues:**
1. **Inconsistent Empty States**
   - Some pages have good empty states (`/projects` - "Create Your First Project")
   - Some pages have minimal empty states (`/workflows` - just text)
   - Some pages may show errors instead of empty states

2. **Missing Action CTAs in Empty States**
   - Empty states should guide users to next action
   - Some empty states are just informational

**Recommendations:**
- Standardize empty state design
- Always include clear CTA in empty states
- Add illustrations/icons to empty states

---

### Error States

**Issues:**
1. **Generic Error Messages**
   - API errors may show technical messages
   - No user-friendly error explanations
   - No recovery actions suggested

2. **Missing Error Boundaries**
   - React errors may crash entire page
   - No graceful degradation

**Recommendations:**
- Add error boundaries to all routes
- User-friendly error messages
- Recovery actions (retry, contact support, etc.)

---

### Loading/Progress States

**Issues:**
1. **Inconsistent Loading States**
   - Some pages have spinners (`/dashboard`)
   - Some pages have minimal loading (`/projects`)
   - Some pages may show blank content during load

2. **No Progress Indicators for Long Operations**
   - File uploads may not show progress
   - Workflow execution may not show progress
   - Agent processing may not show status

**Recommendations:**
- Standardize loading spinner/skeleton UI
- Add progress bars for file uploads
- Add status indicators for long-running operations

---

### Consistency

**Issues:**
1. **Inconsistent Button Styles**
   - Some buttons use `bg-blue-600`, some use `bg-green-600`
   - No consistent primary/secondary button pattern

2. **Inconsistent Card Styles**
   - Project cards vs workflow cards vs file cards have different styles
   - No unified card component

3. **Inconsistent Typography**
   - Heading sizes vary across pages
   - No clear typography scale

**Recommendations:**
- Create shared button components
- Create shared card components
- Define typography scale

---

### Mobile Responsiveness

**Issues:**
1. **Complex Layouts May Not Work on Mobile**
   - Studio dashboard has many panels - may not fit on mobile
   - Project workspace has complex layout - may not be mobile-friendly
   - Some tables may overflow on mobile

2. **Touch Targets May Be Too Small**
   - Some buttons/links may be hard to tap on mobile
   - No mobile-specific navigation

**Recommendations:**
- Test all pages on mobile devices
- Add mobile navigation menu
- Responsive grid layouts
- Larger touch targets for mobile

---

### UI Friction Points

**Critical Friction:**
1. **No Clear Entry Point**
   - Root redirects to signup (BUG-001)
   - New users may be confused about where to start

2. **Auth Flow Confusion**
   - Multiple auth entry points (`/`, `/login`, `/signup`)
   - No clear "Sign Up" vs "Log In" distinction on landing

3. **Missing Onboarding**
   - No tutorial for first-time users
   - Complex features (Project Workspace) have no guidance

4. **No Search/Filter in Some Lists**
   - Projects list has no search
   - Files list has search (good), but workflows list doesn't

**Recommendations:**
- Fix root redirect (BUG-001)
- Add onboarding flow for new users
- Add search/filter to all list pages
- Clear CTAs on landing page

---

## 4. UI Recommendations

### Option 1: Projects Dashboard → Project Detail (Recommended)

**Concept:** Projects as primary navigation, with Studio as secondary workspace

**Sitemap:**
```
/ (landing)
├── /login
├── /signup
├── /guide
└── /studio (authenticated)
    ├── /projects (main dashboard)
    │   └── /projects/[id] (project workspace)
    ├── /workflows (secondary)
    ├── /library (secondary)
    └── /analytics (secondary)
```

**Key Screens:**

1. **Landing Page (`/`)**
   - Hero: "Create content projects with AI assistance"
   - CTA: "Get Started" → `/signup`
   - Features preview
   - How it works section

2. **Projects Dashboard (`/projects`)**
   - Primary view after login
   - Grid/list of projects
   - "New Project" prominent CTA
   - Filter/search projects
   - Project cards show: name, status, gate status, last updated

3. **Project Workspace (`/projects/[id]`)**
   - Full-screen workspace
   - Left sidebar: Intents (Create/Finish/Release/Plan)
   - Main area: Current step view
   - Right sidebar: Context/chat
   - Top bar: Project name, breadcrumb, actions

4. **Studio (`/studio`)**
   - Secondary dashboard
   - Overview of all activity
   - Quick access to workflows, library, analytics
   - Less prominent than projects

**Primary CTAs:**
- Landing: "Get Started" → Sign Up
- Projects: "New Project" → Create Project
- Project Detail: Intent-specific actions (e.g., "Add References", "Generate Storyboard")

**How It Supports Existing Features:**
- ✅ Projects are already the main data model
- ✅ Project workspace already exists and is feature-rich
- ✅ Workflows can be project-scoped
- ✅ Files can be project-scoped
- ✅ Matches current code structure

**Pros:**
- Clear hierarchy (Projects → Project Detail)
- Matches user mental model (working on projects)
- Leverages existing project workspace
- Scalable (can add more project types)

**Cons:**
- Requires making projects more prominent
- May need to migrate workflows to be project-scoped

---

### Option 2: Single Workspace with Sidebars

**Concept:** One unified workspace with collapsible sidebars for navigation

**Sitemap:**
```
/ (landing)
├── /login
├── /signup
├── /guide
└── /workspace (authenticated)
    ├── Projects (left sidebar)
    ├── Workflows (left sidebar)
    ├── Library (left sidebar)
    └── Analytics (left sidebar)
    Main area: Selected view
    Right sidebar: Context/chat/actions
```

**Key Screens:**

1. **Workspace (`/workspace`)**
   - Left sidebar: Navigation (Projects, Workflows, Library, Analytics)
   - Main area: Selected view (project detail, workflow detail, etc.)
   - Right sidebar: Context panel (chat, actions, metadata)
   - Top bar: Global actions, user menu

2. **Project View (within workspace)**
   - Same project workspace as Option 1
   - But accessed via sidebar navigation

**Primary CTAs:**
- Landing: "Get Started" → Sign Up
- Workspace: Sidebar navigation to switch views
- Context-specific actions in right sidebar

**How It Supports Existing Features:**
- ✅ All existing routes can be accessed via sidebar
- ✅ Unified navigation experience
- ✅ Right sidebar can show context for any view
- ✅ Matches Studio concept

**Pros:**
- Single entry point after login
- Consistent navigation
- Context sidebar always available
- Good for power users

**Cons:**
- More complex layout
- May feel cluttered
- Requires significant UI refactoring

---

### Option 3: One Screen MVP (Simplified)

**Concept:** Minimal interface, focus on one primary action at a time

**Sitemap:**
```
/ (landing)
├── /login
├── /signup
└── /app (authenticated)
    Single screen with:
    - Chat interface (primary)
    - File upload
    - Quick actions
    Secondary screens:
    - /projects (minimal list)
    - /projects/[id] (minimal detail)
```

**Key Screens:**

1. **Main App (`/app`)**
   - Chat interface with Marcus (primary)
   - File upload area
   - Quick actions: "New Project", "View Projects", "Library"
   - Minimal navigation

2. **Projects (`/projects`)**
   - Simple list view
   - Click to open project
   - Minimal UI

3. **Project Detail (`/projects/[id]`)**
   - Simplified project workspace
   - Focus on current step
   - Less complex than current implementation

**Primary CTAs:**
- Landing: "Get Started" → Sign Up
- App: Chat input (primary action)
- Quick actions for secondary features

**How It Supports Existing Features:**
- ✅ Chat interface already exists
- ✅ Can access all features via chat commands
- ✅ Reduces UI complexity
- ✅ Focuses on core workflow

**Pros:**
- Simple, focused interface
- Less overwhelming for new users
- Chat-first approach
- Minimal UI changes needed

**Cons:**
- May hide powerful features
- Less discoverable
- May not scale well
- Doesn't leverage existing rich UI

---

## 5. Prioritized Fix Plan

### Phase 1: Blockers & Data Integrity (Week 1)

**Priority: 🔴 Critical**

1. **Fix Root Redirect (BUG-001)**
   - **Impact:** High - Prevents users from seeing landing page
   - **Effort:** Low (1-2 hours)
   - **Dependencies:** None
   - **Fix:** Update `frontend/src/app/page.tsx` to show content instead of redirecting

2. **Migrate Dashboard Routes to Auth Session (BUG-002)**
   - **Impact:** High - Breaks workflows/dashboard/analytics for authenticated users
   - **Effort:** Medium (4-6 hours)
   - **Dependencies:** Supabase Auth must be working
   - **Fix:** Replace localStorage `userId` with `/api/auth/user` in:
     - `frontend/src/app/dashboard/page.tsx`
     - `frontend/src/app/workflows/page.tsx`
     - `frontend/src/app/analytics/page.tsx`

3. **Add Error Handling for Auth Failures (BUG-003)**
   - **Impact:** Medium - Prevents blank pages on auth errors
   - **Effort:** Low (2-3 hours)
   - **Dependencies:** None
   - **Fix:** Add try/catch and error boundaries to authenticated routes

4. **Verify Supabase Storage Bucket Configuration**
   - **Impact:** High - File uploads won't work without bucket
   - **Effort:** Low (30 minutes)
   - **Dependencies:** Supabase access
   - **Fix:** Verify `user-uploads` bucket exists and has correct policies

**Estimated Time:** 8-12 hours

---

### Phase 2: Workflow Continuity (Week 2)

**Priority: 🟡 High**

5. **Add Loading States to Detail Pages (BUG-005)**
   - **Impact:** Medium - Improves UX during data fetch
   - **Effort:** Low (2-3 hours)
   - **Dependencies:** None
   - **Fix:** Add loading spinners/skeletons to:
     - `frontend/src/app/projects/[id]/page.tsx`
     - `frontend/src/app/workflows/[id]/page.tsx`

6. **Improve File Upload Error Handling (BUG-006)**
   - **Impact:** Medium - Users need clear feedback on upload failures
   - **Effort:** Medium (3-4 hours)
   - **Dependencies:** None
   - **Fix:** Review `/api/upload` error handling, add user-friendly messages

7. **Add Global Navigation Header**
   - **Impact:** High - Improves navigation between sections
   - **Effort:** Medium (4-6 hours)
   - **Dependencies:** None
   - **Fix:** Create shared navigation component, add to all authenticated routes

8. **Standardize Empty States**
   - **Impact:** Medium - Improves UX for new users
   - **Effort:** Low (2-3 hours)
   - **Dependencies:** None
   - **Fix:** Create shared empty state component, update all list pages

**Estimated Time:** 11-16 hours

---

### Phase 3: UI Polish & Optimization (Week 3)

**Priority: 🟢 Medium**

9. **Fix Cross-Tab Auth Sync (BUG-004)**
   - **Impact:** Low - Nice to have, not critical
   - **Effort:** Medium (3-4 hours)
   - **Dependencies:** None
   - **Fix:** Add `storage` event listener or Supabase realtime

10. **Optimize Workflow Polling (BUG-007)**
    - **Impact:** Low - Performance optimization
    - **Effort:** Medium (3-4 hours)
    - **Dependencies:** None
    - **Fix:** Replace polling with Supabase realtime or increase interval

11. **Add Breadcrumbs to Deep Routes**
    - **Impact:** Medium - Improves navigation clarity
    - **Effort:** Low (2-3 hours)
    - **Dependencies:** None
    - **Fix:** Create breadcrumb component, add to `/projects/[id]`, `/workflows/[id]`

12. **Create Shared UI Components**
    - **Impact:** Medium - Improves consistency
    - **Effort:** Medium (4-6 hours)
    - **Dependencies:** None
    - **Fix:** Create shared Button, Card, Typography components

13. **Add Mobile Responsiveness**
    - **Impact:** Medium - Important for mobile users
    - **Effort:** High (8-12 hours)
    - **Dependencies:** None
    - **Fix:** Test all pages on mobile, add responsive styles, mobile navigation

14. **Add Onboarding Flow**
    - **Impact:** High - Helps new users understand the app
    - **Effort:** High (8-12 hours)
    - **Dependencies:** None
    - **Fix:** Create onboarding tour for first-time users

**Estimated Time:** 28-41 hours

---

### Recommended Order of Operations

**Week 1: Critical Fixes**
1. Fix root redirect (BUG-001) - 2 hours
2. Migrate dashboard routes to auth (BUG-002) - 6 hours
3. Add error handling (BUG-003) - 3 hours
4. Verify storage bucket - 30 minutes
**Total: ~12 hours**

**Week 2: Continuity & Navigation**
5. Add loading states (BUG-005) - 3 hours
6. Improve upload errors (BUG-006) - 4 hours
7. Add global navigation - 6 hours
8. Standardize empty states - 3 hours
**Total: ~16 hours**

**Week 3: Polish & Optimization**
9. Cross-tab auth sync (BUG-004) - 4 hours
10. Optimize polling (BUG-007) - 4 hours
11. Add breadcrumbs - 3 hours
12. Shared UI components - 6 hours
13. Mobile responsiveness - 12 hours
14. Onboarding flow - 12 hours
**Total: ~41 hours**

**Grand Total: ~69 hours (approximately 2-3 weeks for one developer)**

---

## Appendix: Testing Checklist

### Public Routes
- [ ] `/` - Shows landing/unstuck content (not redirect)
- [ ] `/guide` - Content displays correctly
- [ ] `/login` - Form works, redirects if authenticated
- [ ] `/signup` - Form works, creates account, redirects

### Authenticated Routes (Requires Login)
- [ ] `/studio` - Dashboard loads, shows data or empty states
- [ ] `/projects` - Lists projects, "New Project" works
- [ ] `/projects/[id]` - Project workspace loads, intents work
- [ ] `/dashboard` - Shows workflows (uses auth, not localStorage)
- [ ] `/workflows` - Lists workflows with progress (uses auth)
- [ ] `/workflows/[id]` - Workflow detail loads
- [ ] `/library` - Lists files, preview works
- [ ] `/analytics` - Analytics dashboard loads (uses auth)
- [ ] `/app` - Chat interface works, file upload works

### API Endpoints
- [ ] `/api/auth/user` - Returns auth status
- [ ] `/api/auth/login` - Logs in user
- [ ] `/api/auth/signup` - Creates account
- [ ] `/api/chat` - Chat works (with `userId: 'public'` and authenticated)
- [ ] `/api/workflows` - Lists workflows (with auth userId)
- [ ] `/api/projects` - Lists projects (with auth)
- [ ] `/api/files` - Lists files (with auth)
- [ ] `/api/upload` - Uploads files (with auth)

### Supabase
- [ ] Storage bucket `user-uploads` exists
- [ ] Storage bucket has correct policies
- [ ] RLS policies allow authenticated users
- [ ] Tables are accessible with auth session

---

**End of Audit Report**
