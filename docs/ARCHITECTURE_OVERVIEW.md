# Architecture Overview - SkyRas v2

**Last Updated:** 2025-01-27  
**Purpose:** Document the ACTUAL current architecture. Only what exists in code.

---

## Frontend

### Technology Stack
- **Framework:** Next.js 14.2.25
- **Language:** TypeScript
- **UI:** React 18.3.1
- **Styling:** Tailwind CSS 4
- **Location:** `frontend/` directory

### Main Application
- **Entry Point:** `frontend/src/app/app/page.tsx`
- **Type:** Client-side React component
- **Features:**
  - Chat interface
  - File upload UI
  - Speech-to-text (mic button)
  - Text-to-speech (per-message playback)
  - Authentication (optional access code)

### API Routes (Next.js API Routes)
**Location:** `frontend/src/app/api/`

#### Chat & Agents
- `/api/chat` - Main chat endpoint, routes to Marcus
- `/api/agents/status` - Agent status (if implemented)
- `/api/agents/tasks` - Agent tasks (if implemented)
- `/api/agents/poll` - Polling endpoint (if implemented)
- `/api/agents/giorgio/test` - Giorgio test endpoint
- `/api/agents/jamal/test` - Jamal test endpoint
- `/api/agents/letitia/test` - Letitia test endpoint
- `/api/agents/compliance/scan` - Compliance scanning

#### File Management
- `/api/files` - List/create files
- `/api/files/[id]` - Get/update file
- `/api/upload` - Legacy upload endpoint
- `/api/uploads/sign` - Generate signed URL for direct upload
- `/api/uploads/confirm` - Confirm upload completion

#### Projects & Workflows
- `/api/projects` - List/create projects
- `/api/projects/[id]` - Get/update project
- `/api/workflows` - List/create workflows
- `/api/workflows/[id]` - Get/update workflow
- `/api/workflows/[id]/execute` - Execute workflow
- `/api/workflows/[id]/tasks` - Get workflow tasks
- `/api/workflows/tasks/[taskId]` - Get/update task
- `/api/tasks/[taskId]/execute` - Execute task

#### Tools & Generation
- `/api/tools/generateImage` - Image generation (Runway/Replicate)
- `/api/tools/generateVideo` - Video generation (Runway)

#### Voice Features
- `/api/speech-to-text` - OpenAI Whisper transcription
- `/api/voice/tts` - Text-to-speech (OpenAI/ElevenLabs)
- `/api/voice/voices` - List available voices

#### Morning Meeting
- `/api/morning-meeting/generate` - Generate daily plan
- `/api/morning-meeting/approve` - Approve plan
- `/api/morning-meeting/reject` - Reject plan
- `/api/morning-meeting/today` - Get today's plan
- `/api/cron/morning-meeting` - Cron trigger

#### Other
- `/api/analytics` - Analytics data (returns mock data)
- `/api/data/assets` - Asset data
- `/api/data/licensing` - Licensing data
- `/api/data/plans` - Plan data
- `/api/push/register` - Register push notification token
- `/api/auth/google/authorize` - Google OAuth start
- `/api/auth/google/callback` - Google OAuth callback
- `/api/auth/google/disconnect` - Google OAuth disconnect
- `/api/_env` - Environment variable check (dev only)
- `/api/test/marcus` - Marcus test endpoint
- `/api/test/storage` - Storage test endpoint

---

## Backend

### Database Layer
- **Location:** `src/lib/database.ts`
- **Database:** Supabase (PostgreSQL)
- **Client:** Supabase JS client
- **Operations:**
  - Projects CRUD
  - Files CRUD
  - Workflows CRUD
  - WorkflowTasks CRUD
  - FileProcessing CRUD
  - CalendarEvent CRUD
  - DailyPlan CRUD
  - DailyPlanBlock CRUD
  - GoogleOAuthToken CRUD
  - PushNotificationToken CRUD

### Supabase Client
- **Location:** `frontend/src/backend/supabaseClient.ts`
- **Functions:**
  - `getSupabaseClient()` - Main client (anon key)
  - `getSupabaseStorageClient()` - Storage client (service role/secret key)
- **Environment Variables:**
  - `SUPABASE_URL` (required)
  - `SUPABASE_ANON_KEY` (required)
  - `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY` (for storage)

### File Storage
- **Location:** `src/lib/fileStorage.supabase.ts`
- **Provider:** Supabase Storage
- **Bucket:** `user-uploads` (default)
- **Method:** Direct upload via signed URLs

---

## Agents

### Base Agent Infrastructure
- **Location:** `src/agents/core/BaseAgent.ts`
- **Features:**
  - Memory management (Redis-backed, via context)
  - Logging
  - Delegation tracking
  - Execution context

### Agent Implementations

#### Marcus (Orchestrator)
- **Location:** `src/agents/marcus/`
- **Files:**
  - `marcusAgent.ts` - Main agent class
  - `marcusActions.ts` - Action implementations
  - `marcusSystemPrompt.ts` - System prompt
  - `marcusPreferences.ts` - User preferences
- **Capabilities:**
  - Keyword-based routing
  - Delegation to other agents
  - AI response generation (Anthropic Claude)
  - Link fetching
  - Workflow creation

#### Giorgio (Creative)
- **Location:** `src/agents/giorgio/`
- **Files:**
  - `giorgioAgent.ts` - Main agent class
  - `giorgioActions.ts` - Action implementations
  - `giorgioSystemPrompt.md` - System prompt
- **Actions:**
  - generateScriptOutline
  - generateSceneBeats
  - generateCharacterSheet
  - generateSocialHook
  - generateShotIdeas
  - generateBrandConcept
  - generateCoverArtPrompt
  - generateSoraPrompt
  - generateImage

#### Jamal (Distribution)
- **Location:** `src/agents/jamal/`
- **Files:**
  - `jamalAgent.ts` - Main agent class
  - `jamalActionsV2.ts` - Action implementations (V2)
  - `jamalSystemPrompt.md` - System prompt
- **Actions:**
  - generateDrafts
  - schedulePost
  - reactivePublish
  - getPosts
  - approvePost
  - getSettings
  - updateSettings
  - handleFileUpload

#### Letitia (Cataloging)
- **Location:** `src/agents/letitia/`
- **Files:**
  - `letitiaAgent.ts` - Main agent class
  - `letitiaActions.ts` - Action implementations
  - `letitiaSystemPrompt.md` - System prompt
- **Actions:**
  - saveAssetMetadata
  - listAssets
  - findAssets

#### Compliance (Cassidy)
- **Location:** `src/agents/compliance/`
- **Files:**
  - `complianceAgent.ts` - Main agent class
  - `complianceActions.ts` - Action implementations
  - `complianceSystemPrompt.md` - System prompt
- **Actions:**
  - scanFilesForLicensing
  - listUnlicensedAssets
  - markAssetLicensed

### Agent Processing
- **Location:** `src/lib/agentProcessor.ts`
- **Function:** Routes agent requests, processes delegations

---

## External Services

### Supabase
- **Purpose:** Database + Storage
- **Configuration:** Environment variables
- **Status:** ✅ WORKING

### OpenAI
- **Purpose:** 
  - Chat completion (if OPENAI_API_KEY set)
  - Whisper (speech-to-text)
  - TTS (text-to-speech, default provider)
- **Configuration:** `OPENAI_API_KEY`
- **Status:** ✅ WORKING

### Anthropic (Claude)
- **Purpose:** AI responses for Marcus
- **Configuration:** `ANTHROPIC_API_KEY`
- **Status:** ✅ WORKING (if key configured)

### ElevenLabs
- **Purpose:** Premium TTS
- **Configuration:** `ELEVENLABS_API_KEY`, `TTS_PROVIDER=elevenlabs`
- **Status:** ✅ WORKING (if configured)

### Runway ML
- **Purpose:** Video + Image generation
- **Configuration:** `RUNWAY_API_KEY`, `RUNWAY_API_BASE_URL`, `RUNWAY_API_VERSION`
- **Status:** ⚠️ PARTIALLY WORKING (video generation incomplete)

### Replicate
- **Purpose:** Image generation (Stable Diffusion fallback)
- **Configuration:** `REPLICATE_API_TOKEN`, `REPLICATE_MODEL_ID`
- **Status:** ✅ WORKING

### Google Calendar
- **Purpose:** Morning meeting calendar integration
- **Configuration:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_OAUTH_ENCRYPTION_KEY`
- **Status:** ⚠️ PARTIALLY WORKING (OAuth flow exists, not fully tested)

### Firebase
- **Purpose:** Push notifications
- **Configuration:** `FIREBASE_SERVICE_ACCOUNT` or `FIREBASE_SERVICE_ACCOUNT_FILE`
- **Status:** ⚠️ PARTIALLY WORKING (token registration exists, sending not implemented)

---

## Data Flow

### Chat Flow
1. User sends message → `/api/chat` POST
2. Route to Marcus agent
3. Marcus detects keywords → delegates to specialist agent
4. Specialist agent processes → returns result
5. Marcus wraps result → returns to user

### File Upload Flow
1. User selects file → Frontend
2. Frontend calls `/api/uploads/sign` → Get signed URL
3. Frontend uploads directly to Supabase Storage
4. Frontend calls `/api/uploads/confirm` → Confirm completion
5. Backend creates file record in database

### Workflow Execution Flow
1. User creates workflow → `/api/workflows` POST
2. User executes workflow → `/api/workflows/[id]/execute` POST
3. System creates tasks → Database
4. Tasks execute → Agent processing
5. Status updates → Database

---

## Deployment

### Vercel
- **Status:** ✅ DEPLOYED
- **Configuration:** Environment variables in Vercel dashboard
- **Build:** Next.js build process

### Environment Variables
See `env.example` and `frontend/env.example` for required variables.

---

## What's NOT in This Architecture

### Python Microservices
- FastAPI services exist in `services/` but are NOT integrated
- No evidence of deployment or usage

### AgentKit
- Separate workflow system in `agentkit/` directory
- NOT integrated with main Next.js app

### Social Media APIs
- Structure exists but NO actual API integrations
- All platform calls are TODO comments

---

## Verification

This architecture is based on:
1. Actual file structure
2. Import statements
3. API route definitions
4. Agent class implementations
5. No assumptions about functionality

