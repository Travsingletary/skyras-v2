# Agent Capabilities - SkyRas v2

**Last Updated:** 2025-01-27  
**Purpose:** Document what each agent CAN and CANNOT do. Verified from code only.

---

## Marcus (Orchestrator)

### Inputs Accepted
- **Prompt:** User message text
- **Metadata:**
  - `userId` (string) - User identifier
  - `projectId` or `project` (string) - Project identifier
  - `conversationId` (string) - Conversation identifier
  - `files` (array) - For licensing audits
  - `creativeAction` (string) - For creative generation
  - `context`, `mood`, `style`, `characters`, `beats` - For creative generation
  - `campaignName`, `platforms`, `slots` - For distribution planning
  - `workflowName`, `workflowType`, `workflowTasks` - For workflow creation

### Tools Available
- **Memory:** Conversation history (last 20 messages)
- **Anthropic Claude API:** AI response generation (if `ANTHROPIC_API_KEY` set)
- **Delegation:** Can delegate to Giorgio, Jamal, Letitia, Cassidy
- **Link Fetching:** Fetches content from URLs in prompts
- **Workflow Creation:** Creates workflows via `/api/workflows` POST

### Outputs Produced
- **Text Response:** AI-generated or keyword-triggered responses
- **Delegations:** Array of agent delegations with results
- **Notes:** Metadata about actions taken

### Routing Logic
- **Licensing Keywords:** `license`, `licensing`, `watermark`, `demo` → Delegates to Cassidy
- **Creative Keywords:** `idea`, `script`, `prompt`, `concept`, `scene`, `treatment`, `story`, `cover art`, `sora`, `skit`, `marketing hook`, `shot`, `outline` → Delegates to Giorgio
- **Distribution Keywords:** `post`, `posting plan`, `schedule`, `distribution`, `publish`, `rollout`, `slots` → Delegates to Jamal
- **Catalog Keywords:** `catalog`, `tag`, `metadata`, `save asset`, `store asset` → Delegates to Letitia
- **Workflow Keywords:** `create workflow`, `make workflow`, `new workflow`, `workflow plan`, `build workflow`, `generate workflow` → Creates workflow
- **URLs:** Automatically fetches content from URLs

### Limitations
- ❌ Cannot generate creative content directly (must delegate to Giorgio)
- ❌ Cannot publish to social media (must delegate to Jamal)
- ❌ Cannot catalog assets (must delegate to Letitia)
- ❌ Cannot check licensing (must delegate to Cassidy)
- ⚠️ AI responses require `ANTHROPIC_API_KEY` - falls back to keyword-only mode if missing
- ⚠️ User preferences are hard-coded (not loaded from database yet)

---

## Giorgio (Creative)

### Inputs Accepted
- **Action:** One of: `generateScriptOutline`, `generateSceneBeats`, `generateCharacterSheet`, `generateSocialHook`, `generateShotIdeas`, `generateBrandConcept`, `generateCoverArtPrompt`, `generateSoraPrompt`, `generateImage`
- **Payload (CreativeInput):**
  - `project` (string, required) - Project identifier
  - `context` (string, optional) - Context for generation
  - `mood` (string, optional) - Mood/tone
  - `style` (string, optional) - Visual style
  - `characters` (string[], optional) - Character names
  - `beats` (string[], optional) - Story beats
  - `size` (string, optional) - For image generation: "512x512" | "1024x1024" | "1536x1536"

### Tools Available
- **Anthropic Claude API:** For AI-generated creative content (if `ANTHROPIC_API_KEY` set)
- **Image Generation API:** Calls `/api/tools/generateImage` for image generation
- **Memory:** Agent-specific memory namespace (`creative_giorgio`)

### Outputs Produced
- **Text Response:** Creative output (script, prompt, concept, etc.)
- **Creativity Object:** Structured creative output with metadata
- **File URLs:** For generated images

### Actions Implemented
1. ✅ `generateScriptOutline` - Creates script outlines via AI
2. ✅ `generateSceneBeats` - Generates scene breakdowns
3. ✅ `generateCharacterSheet` - Creates character profiles
4. ✅ `generateSocialHook` - Creates social media hooks
5. ✅ `generateShotIdeas` - Generates shot concepts
6. ✅ `generateBrandConcept` - Creates brand concepts
7. ✅ `generateCoverArtPrompt` - Creates cover art prompts
8. ✅ `generateSoraPrompt` - Creates Sora video prompts
9. ✅ `generateImage` - Generates images via Runway/Replicate

### Limitations
- ❌ Cannot generate music prompts (deferred to future Music Agent)
- ❌ Cannot generate video directly (only prompts for Sora/Runway)
- ⚠️ Image generation requires `RUNWAY_API_KEY` or `REPLICATE_API_TOKEN`
- ⚠️ AI generation requires `ANTHROPIC_API_KEY` - will fail if missing
- ❌ Cannot edit existing creative content (only generation)

---

## Jamal (Distribution)

### Inputs Accepted
- **Action:** One of: `generateDrafts`, `schedulePost`, `reactivePublish`, `getPosts`, `approvePost`, `getSettings`, `updateSettings`, `handleFileUpload`
- **Payload:** Varies by action
  - `generateDrafts`: `contentItemId`, `userId`, `platforms`, `scheduledAt`
  - `schedulePost`: `contentItemId`, `userId`, `caption`, `platform`, `scheduledAt`
  - `reactivePublish`: `contentItemId`, `userId`
  - `getPosts`: `userId`, optional filters
  - `approvePost`: `postId`, `userId`
  - `getSettings`: `userId`
  - `updateSettings`: `userId`, settings object
  - `handleFileUpload`: `fileId`, `userId`

### Tools Available
- **Publishing Queue:** Queue management system
- **Settings Management:** Publishing settings (approval, rate limits, kill switches)
- **Guardrails:** Rate limit checking, approval workflow
- **Supabase:** Database operations for posts

### Outputs Produced
- **Post Drafts:** Generated post content for platforms
- **Scheduled Posts:** Post scheduling confirmations
- **Post Lists:** Lists of posts with filters
- **Settings:** Publishing configuration

### Actions Implemented
1. ✅ `generateDrafts` - Creates post drafts (structure exists)
2. ✅ `schedulePost` - Schedules posts (structure exists)
3. ✅ `reactivePublish` - Triggers reactive publishing (structure exists)
4. ✅ `getPosts` - Retrieves posts (structure exists)
5. ✅ `approvePost` - Approves posts (structure exists)
6. ✅ `getSettings` - Gets publishing settings
7. ✅ `updateSettings` - Updates publishing settings
8. ✅ `handleFileUpload` - Processes file upload events

### Limitations
- ❌ **NO actual platform API integrations** - All platform calls are TODO comments
- ❌ Cannot publish to Instagram, TikTok, LinkedIn, Twitter, Facebook, YouTube (not implemented)
- ❌ Rate limit tracking is stubbed (TODO comments in code)
- ❌ Actual publishing worker calls are mocked
- ⚠️ Queue structure exists but publishing is not functional
- ❌ Cannot scrape trends (explicitly excluded from MVP)

### Platforms Supported (Structure Only)
- Instagram (not implemented)
- TikTok (not implemented)
- LinkedIn (not implemented)
- Twitter/X (not implemented)
- Facebook (not implemented)
- YouTube (not implemented)

---

## Letitia (Cataloging)

### Inputs Accepted
- **Action:** One of: `saveAssetMetadata`, `listAssets`, `findAssets`
- **Payload:**
  - `saveAssetMetadata`: `project` (required), `name` (required), `type`, `tags`, `metadata`
  - `listAssets`: `project` (required), `tags` (optional)
  - `findAssets`: `project` (required), `query` (required)

### Tools Available
- **Supabase:** Database operations on `assets` table
- **Memory:** Agent-specific memory namespace (`letitia_assets`)

### Outputs Produced
- **Asset Records:** Saved asset metadata
- **Asset Lists:** Lists of assets by project/tags
- **Search Results:** Assets matching search query

### Actions Implemented
1. ✅ `saveAssetMetadata` - Saves asset to Supabase `assets` table
2. ✅ `listAssets` - Lists assets by project/tags
3. ✅ `findAssets` - Searches assets by query

### Limitations
- ❌ Cannot perform file I/O directly (only metadata)
- ❌ Cannot search file contents (only metadata search)
- ⚠️ Requires `assets` table in Supabase (may not exist)
- ❌ Cannot generate thumbnails or previews
- ❌ Cannot extract metadata from files automatically

---

## Compliance (Cassidy)

### Inputs Accepted
- **Action:** One of: `scanFilesForLicensing`, `listUnlicensedAssets`, `markAssetLicensed`
- **Payload:**
  - `scanFilesForLicensing`: `projectId` (required), `files` (array, required)
  - `listUnlicensedAssets`: `projectId` (required)
  - `markAssetLicensed`: `projectId` (required), `filePath` (required), `licenseInfo` (optional)

### Tools Available
- **Keyword Detection:** Scans for DEMO, WATERMARK, PREVIEW, TEMP
- **Provider Detection:** Detects artlist, epidemic, pond5, motionarray, storyblocks, envato, pixabay, pexels
- **File Type Inference:** Infers type from file extension
- **Supabase:** Database operations for licensing records

### Outputs Produced
- **Scan Results:** List of suspicious files with reasons
- **Unlicensed Assets:** List of unlicensed assets
- **Licensing Status:** Confirmation of licensing updates

### Actions Implemented
1. ✅ `scanFilesForLicensing` - Scans files for watermark/demo keywords
2. ✅ `listUnlicensedAssets` - Lists unlicensed assets
3. ✅ `markAssetLicensed` - Marks assets as licensed

### Limitations
- ❌ Cannot verify actual license validity (only keyword detection)
- ❌ Cannot check license expiration dates
- ❌ Cannot integrate with license provider APIs
- ⚠️ Keyword detection is basic (exact match only)
- ❌ Cannot detect watermarks in images/videos (only filename/keyword detection)

---

## Common Limitations (All Agents)

### Memory
- ⚠️ Memory is Redis-backed but Redis connection not verified in all contexts
- ⚠️ Memory namespace isolation exists but not tested

### Error Handling
- ⚠️ Error handling exists but may not cover all edge cases
- ⚠️ Some actions throw errors without graceful degradation

### Authentication
- ⚠️ No user authentication/authorization in agent layer
- ⚠️ Relies on API route authentication

### Database
- ⚠️ Assumes Supabase tables exist (may not be created)
- ⚠️ No migration system verified

---

## Verification Method

This document was created by:
1. Reading agent class files
2. Reading action implementation files
3. Checking for TODO/FIXME comments
4. Verifying tool/API usage
5. No assumptions about functionality

