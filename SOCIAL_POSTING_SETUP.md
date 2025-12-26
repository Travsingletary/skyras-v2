# Social Media Posting Setup

Jamal's self-hosted social media distribution system - no SaaS fees, full control.

## Overview

This is a minimal, self-hosted social media posting service that:
- Stores scheduled posts in Supabase
- Publishes posts via direct platform APIs
- Runs a scheduler service to check for due posts
- Supports Instagram, TikTok, LinkedIn, Twitter/X, Facebook, and YouTube

## Database Setup

1. Apply the migration:
   ```sql
   -- Run in Supabase SQL Editor
   -- File: frontend/supabase/migrations/0008_social_posts.sql
   ```

2. Tables created:
   - `scheduled_posts` - Posts waiting to be published
   - `social_accounts` - Connected platform accounts
   - `post_analytics` - Post performance metrics

## Scheduler Service

The scheduler checks for posts due for publishing and publishes them automatically.

### Option 1: API Endpoint (Recommended for Cron)

Call the scheduler endpoint periodically:

```bash
# Manual trigger
curl http://localhost:3000/api/social-posts/scheduler

# With batch size
curl http://localhost:3000/api/social-posts/scheduler?batchSize=20
```

Set up a cron job (e.g., every minute):
```bash
* * * * * curl -s http://localhost:3000/api/social-posts/scheduler > /dev/null
```

### Option 2: Background Service

Start the scheduler as a background process:

```typescript
import { startScheduler } from "@/services/socialPostScheduler";

// Start with custom options
const stopScheduler = startScheduler({
  intervalMs: 60 * 1000, // Check every minute
  batchSize: 10,          // Process 10 posts at a time
  enabled: true,
});

// To stop
stopScheduler();
```

### Option 3: PM2 Process

Add to `ecosystem.config.js`:

```javascript
{
  name: "social-post-scheduler",
  script: "./src/services/runScheduler.ts",
  instances: 1,
  autorestart: true,
  watch: false,
}
```

## Platform API Integration

Currently, platform adapters are stubs. To enable actual publishing, implement platform-specific API calls.

### Required Setup Per Platform

#### Instagram
- Requires Instagram Graph API
- Need Facebook Business account
- OAuth flow to get access tokens
- Store tokens in `social_accounts.access_token_encrypted`

#### TikTok
- Requires TikTok Business API access
- OAuth flow for authentication
- Store tokens securely

#### Twitter/X
- Twitter API v2 with elevated access
- Bearer token authentication
- Store tokens securely

#### LinkedIn
- LinkedIn Marketing API
- OAuth 2.0 flow
- Store tokens securely

#### Facebook
- Facebook Graph API (part of Meta)
- OAuth flow
- Can share tokens with Instagram if same account

#### YouTube
- YouTube Data API v3
- OAuth 2.0 flow
- Store client ID and client secret

### Implementation Steps

1. **Create platform adapter files** in `src/lib/socialPosting/platforms/`:
   - `instagram.ts`
   - `tiktok.ts`
   - `twitter.ts`
   - `linkedin.ts`
   - `facebook.ts`
   - `youtube.ts`

2. **Implement publish function** for each platform:
   ```typescript
   export async function publishToInstagram(post: ScheduledPost): Promise<PublishPostResult> {
     // 1. Get access token from database (social_accounts table)
     // 2. Make API call to Instagram Graph API
     // 3. Handle media upload if needed
     // 4. Return post ID and URL
   }
   ```

3. **Update `src/lib/socialPostingClient.ts`** to use real adapters instead of stubs.

4. **Add environment variables** for API keys (see `env.example`).

## Usage in Jamal

Jamal can schedule and publish posts:

```typescript
// Schedule a post
await jamal.run({
  prompt: "Schedule a post for Instagram",
  metadata: {
    action: "schedulePost",
    payload: {
      project: "Summer Campaign",
      userId: "user_123",
      platform: "instagram",
      caption: "Check out our new summer collection! 🌞",
      mediaUrl: "https://storage.supabase.co/...",
      scheduledAt: "2024-06-01T12:00:00Z",
      hashtags: ["summer", "fashion"],
    },
  },
});

// Publish immediately
await jamal.run({
  prompt: "Publish to TikTok",
  metadata: {
    action: "publishPost",
    payload: {
      project: "Summer Campaign",
      userId: "user_123",
      platform: "tiktok",
      caption: "Summer vibes only! 🏖️",
      mediaUrl: "https://storage.supabase.co/...",
    },
  },
});

// Get scheduled posts
await jamal.run({
  prompt: "Show my scheduled posts",
  metadata: {
    action: "getScheduled",
    payload: {
      userId: "user_123",
      platform: "instagram",
    },
  },
});
```

## Security Notes

⚠️ **Important**: Store API tokens securely!

1. **Encrypt tokens** before storing in `social_accounts` table
2. **Use environment variables** for API keys and secrets
3. **Implement token refresh** logic (tokens expire)
4. **Add rate limiting** to avoid API throttling
5. **Handle OAuth flows** securely (redirect URIs, state validation)

## Current Status

- ✅ Database schema created
- ✅ Post scheduling works (stores in database)
- ✅ Scheduler service created
- ✅ Jamal integration complete
- ⚠️ Platform API integrations are stubs (need implementation)
- ⚠️ OAuth flows need to be built
- ⚠️ Token encryption needs implementation

## Next Steps

1. Implement Instagram API integration (most common platform)
2. Add OAuth flow for platform authentication
3. Implement token encryption/decryption
4. Add retry logic for failed posts
5. Implement analytics collection
6. Add webhook handlers for platform callbacks







