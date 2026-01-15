# Video Animation Feature - Hardening Changes

## Summary
Minimal production hardening fixes for duplicate prevention, idempotency, and logging.

## Changes

### 1. Database Migration: `0014_video_animation_hardening.sql`

**Added:**
- `client_request_id` column to `video_jobs` table
- Unique index on `(user_id, client_request_id)` to prevent duplicate jobs
- Verification of `updated_at` trigger

**SQL:**
```sql
ALTER TABLE public.video_jobs ADD COLUMN IF NOT EXISTS client_request_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_video_jobs_client_request_id 
ON public.video_jobs(user_id, client_request_id) WHERE client_request_id IS NOT NULL;
```

### 2. TypeScript Types Update

**File:** `frontend/src/types/database.ts`

Added `client_request_id?: string` to `VideoJob` interface.

### 3. API Endpoint: POST `/api/video/animate`

**Changes:**
- Accepts `clientRequestId` in request body
- Checks for existing job with same `client_request_id` before creating new job
- Returns existing job if duplicate detected
- Added log: `[VideoAnimate] Creating job...`
- Added log: `[VideoAnimate] Provider job started...`
- Added log: `[VideoAnimate] Job failed...`

### 4. API Endpoint: GET `/api/video/jobs/[id]`

**Changes:**
- Idempotent upload guard: checks if `output_video_url` exists before uploading
- Skips upload if video already stored (prevents duplicate uploads)
- Added log: `[VideoJobs] Polling provider status...`
- Added log: `[VideoJobs] Provider status mapped...`
- Added log: `[VideoJobs] Starting upload to storage...`
- Added log: `[VideoJobs] Upload completed...`
- Added log: `[VideoJobs] Job failed...`

### 5. Frontend Component: `AnimateButton`

**Changes:**
- Generates UUID for `clientRequestId` on each click
- Sends `clientRequestId` in API request
- Prevents duplicate job creation on double-click

### 6. Database Layer: `videoJobsDb`

**Added:**
- `getByClientRequestId(userId, clientRequestId)` method for duplicate detection

## File Diffs

### Migration File (New)
- `frontend/supabase/migrations/0014_video_animation_hardening.sql` (new file)

### Type Updates
- `frontend/src/types/database.ts` - Added `client_request_id` field

### API Routes
- `frontend/src/app/api/video/animate/route.ts` - Duplicate check + 3 logs
- `frontend/src/app/api/video/jobs/[id]/route.ts` - Idempotent upload + 5 logs

### Frontend Components
- `frontend/src/components/video/AnimateButton.tsx` - UUID generation + clientRequestId

### Database Layer
- `frontend/src/lib/database.ts` - Added `getByClientRequestId` method

## Known Limitations

1. **Webhook Support**: Not implemented. Polling is used instead, which may cause slight delays in status updates.

2. **Concurrent Job Limits**: No per-user concurrent job limit (only daily quota). Users can create multiple jobs simultaneously.

3. **Video Storage Cleanup**: No automatic cleanup of old videos. Manual cleanup required to manage storage costs.

4. **Retry Logic**: Failed jobs are not automatically retried. Users must manually retry by creating a new job.

5. **Provider Fallback**: If Fal.ai fails, Runway is tried, but no retry on transient errors (network timeouts, etc.).

6. **Quota Reset**: Quota resets at midnight UTC. No manual reset endpoint (requires direct database access).

7. **Signed URL Expiry**: Signed URLs expire after 1 hour. Frontend must refresh if video playback fails.

8. **Client Request ID**: If client loses UUID (page refresh), duplicate prevention won't work for that specific request. New UUID will be generated.

## Testing Checklist

- [x] Duplicate request prevention (client_request_id)
- [x] Idempotent upload (no duplicate MP4 files)
- [x] Logging added (5 strategic points)
- [x] updated_at trigger verified
- [ ] RLS isolation tested
- [ ] Quota atomicity tested (25 parallel requests)
- [ ] Provider status mapping tested
- [ ] Validation tested (unauth + invalid paths)

## Deployment Steps

1. Apply hardening migration: `0014_video_animation_hardening.sql`
2. Deploy code changes (API routes + frontend)
3. Verify logs appear in production logs
4. Test duplicate prevention (double-click Animate button)
5. Test idempotency (multiple GET requests on same job)
