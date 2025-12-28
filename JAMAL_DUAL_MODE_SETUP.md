# Jamal Dual-Mode Publishing System

Jamal now supports two publishing modes with a unified job queue and decision router.

## Architecture Overview

### Two Modes

**A) Scheduled Publishing Mode:**
- Generate drafts from content items
- Schedule posts for future publication
- Automatic publishing at scheduled times
- Workflow: `generateDrafts` → `schedule` → `approval` → `queue` → `publish`

**B) Reactive Publishing Mode:**
- Triggers from app events (file uploads, drop flags, campaign starts)
- Immediate publishing when content is ready
- MVP: App events only (no trend scraping)
- Workflow: `event` → `reactivePublish` → `approval` → `queue` → `publish`

### Core Components

1. **Database Schema** (`0009_jamal_dual_mode.sql`)
   - `content_items` - Assets with metadata and status
   - `campaigns` - Campaign configuration (theme, CTA, platforms, cadence)
   - `post_templates` - Tone/style presets for generating variants
   - `posts` - Generated posts (drafts, variants, approval, scheduling, publishing)
   - `publishing_jobs` - Unified job queue for both modes
   - `publishing_settings` - Guardrails configuration
   - `publishing_logs` - Audit trail

2. **Job Queue System** (`src/lib/jamal/publishingQueue.ts`)
   - Unified queue for scheduled and reactive jobs
   - Priority-based processing
   - Rate limit tracking
   - Retry logic

3. **Decision Router** (`src/lib/jamal/decisionRouter.ts`)
   - Routes posts to appropriate mode
   - Checks approval requirements
   - Validates scheduled times
   - Respects kill switches

4. **Publishing Worker** (`src/lib/jamal/publishingWorker.ts`)
   - Processes jobs from queue
   - Applies rate limits
   - Handles retries
   - Calls platform APIs (stubs for now)

5. **Guardrails** (`src/lib/jamal/guardrails.ts`)
   - Rate limiting per platform
   - Approval workflow
   - Reactive kill switch
   - Retry configuration

## Setup

### 1. Apply Database Migration

```sql
-- Run in Supabase SQL Editor
-- File: frontend/supabase/migrations/0009_jamal_dual_mode.sql
```

### 2. Start Services

#### Scheduler (for scheduled mode)
Processes scheduled posts that are due:

```bash
# Manual trigger
curl http://localhost:3000/api/jamal/scheduler

# Or set up cron (every minute)
* * * * * curl -s http://localhost:3000/api/jamal/scheduler > /dev/null
```

#### Worker (publishes posts)
Processes jobs from the queue:

```bash
# Manual trigger
curl http://localhost:3000/api/jamal/worker?batchSize=10

# Or run as background service
import { startJamalWorker } from "@/services/jamalWorker";
const stopWorker = startJamalWorker();
```

### 3. Configure Settings

```typescript
// Get settings
await jamal.run({
  prompt: "Get publishing settings",
  metadata: {
    action: "getSettings",
    payload: { userId: "user_123" },
  },
});

// Update settings
await jamal.run({
  prompt: "Disable reactive mode kill switch",
  metadata: {
    action: "updateSettings",
    payload: {
      userId: "user_123",
      reactiveKillSwitch: false,
    },
  },
});
```

## Usage

### Scheduled Publishing

```typescript
// 1. Generate drafts from content item
await jamal.run({
  prompt: "Generate post drafts for content item",
  metadata: {
    action: "generateDrafts",
    payload: {
      project: "Summer Campaign",
      userId: "user_123",
      contentItemId: "content_abc",
      platforms: ["instagram", "tiktok"],
      scheduledAt: "2024-06-01T12:00:00Z",
    },
  },
});

// 2. Schedule a single post
await jamal.run({
  prompt: "Schedule Instagram post",
  metadata: {
    action: "schedulePost",
    payload: {
      project: "Summer Campaign",
      userId: "user_123",
      contentItemId: "content_abc",
      platform: "instagram",
      caption: "Check out our new collection!",
      scheduledAt: "2024-06-01T14:00:00Z",
    },
  },
});
```

### Reactive Publishing

```typescript
// Trigger reactive publishing
await jamal.run({
  prompt: "Publish content item reactively",
  metadata: {
    action: "reactivePublish",
    payload: {
      project: "Summer Campaign",
      userId: "user_123",
      contentItemId: "content_abc",
      triggerEvent: "drop_flag", // or "file_upload", "campaign_start", "manual"
      platforms: ["instagram", "tiktok"],
      immediate: true, // Skip approval
    },
  },
});

// Handle file upload event
await jamal.run({
  prompt: "Handle file upload",
  metadata: {
    action: "handleFileUpload",
    payload: {
      fileId: "file_xyz",
      userId: "user_123",
      contentItemId: "content_abc", // Optional if linked by file_id
    },
  },
});
```

### Approval Workflow

```typescript
// Approve a post
await jamal.run({
  prompt: "Approve post for publishing",
  metadata: {
    action: "approvePost",
    payload: {
      postId: "post_123",
      userId: "user_123",
      notes: "Looks good!",
    },
  },
});
```

### View Posts

```typescript
// Get all posts
await jamal.run({
  prompt: "Show my scheduled posts",
  metadata: {
    action: "getPosts",
    payload: {
      userId: "user_123",
      mode: "scheduled",
      status: "queued",
    },
  },
});
```

## Guardrails

### Rate Limits (per platform)
- Instagram: 3 posts/hour, 20 min cooldown
- TikTok: 5 posts/hour, 15 min cooldown
- Twitter: 10 posts/hour, 10 min cooldown
- LinkedIn: 5 posts/hour, 15 min cooldown
- Facebook: 10 posts/hour, 10 min cooldown
- YouTube: 2 posts/hour, 30 min cooldown

### Approval
- Default: Approval required
- Can be auto-approved for campaigns
- Can be disabled per user

### Reactive Kill Switch
- Emergency stop for reactive publishing
- Can be set globally or per user
- Prevents all reactive posts from being queued

### Retries
- Default: 3 attempts
- Exponential backoff (15min, 30min, 60min)
- Configurable per user

## Data Flow

### Scheduled Mode
```
Content Item → Generate Drafts → Posts (draft) → Approval → Queue Job → Worker → Platform API
```

### Reactive Mode
```
App Event → Reactive Publish → Posts (draft) → Approval → Queue Job → Worker → Platform API
```

## Next Steps

1. **Platform API Integration**: Implement actual API calls in `publishingWorker.ts`
2. **Trend Watcher**: Add behind feature flag (future)
3. **Rate Limit Tracking**: Use Redis for accurate rate limiting
4. **Analytics**: Collect and store post performance metrics
5. **OAuth Flows**: Implement platform authentication

## Migration Notes

This replaces the old `scheduled_posts` table with the new dual-mode system. The old `0008_social_posts.sql` migration is superseded by `0009_jamal_dual_mode.sql`.








