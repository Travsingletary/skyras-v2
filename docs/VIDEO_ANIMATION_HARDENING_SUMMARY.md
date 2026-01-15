# Video Animation Feature - Hardening Summary

## Test Plan
See `docs/VIDEO_ANIMATION_TEST_PLAN.md` for complete test plan covering:
- RLS isolation
- Client cannot update job status
- Buckets private + signed URLs
- Provider status mapping
- Quota atomicity (25 parallel requests)
- GET endpoint idempotency
- Validation (unauth + invalid paths)

## SQL Migration Changes

### New Migration: `0014_video_animation_hardening.sql`

```sql
-- Add client_request_id column for duplicate prevention
ALTER TABLE public.video_jobs
ADD COLUMN IF NOT EXISTS client_request_id TEXT;

-- Create unique index to prevent duplicate jobs
CREATE UNIQUE INDEX IF NOT EXISTS idx_video_jobs_client_request_id 
ON public.video_jobs(user_id, client_request_id) 
WHERE client_request_id IS NOT NULL;

-- Verify updated_at trigger exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_video_jobs_updated_at'
  ) THEN
    CREATE TRIGGER update_video_jobs_updated_at 
    BEFORE UPDATE ON public.video_jobs
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
```

## File Diffs

### 1. `frontend/src/types/database.ts`

**Added:**
- `client_request_id?: string` to `VideoJob` interface

**Location:** Line ~373 (after `options: Record<string, any>;`)

### 2. `frontend/src/lib/database.ts`

**Added to imports:**
- `VideoJob`, `VideoJobInsert`, `VideoJobUpdate`

**Added new section at end:**
```typescript
export const videoJobsDb = {
  async create(job: VideoJobInsert): Promise<VideoJob> { ... },
  async getById(id: string, userId: string): Promise<VideoJob | null> { ... },
  async getByUserId(userId: string): Promise<VideoJob[]> { ... },
  async getByClientRequestId(userId: string, clientRequestId: string): Promise<VideoJob | null> { ... },
  async update(id: string, updates: VideoJobUpdate): Promise<VideoJob> { ... },
};
```

### 3. `frontend/src/app/api/video/animate/route.ts`

**Changes:**
1. Added `clientRequestId?: string` to `AnimateRequest` interface
2. Added duplicate check before creating job:
   ```typescript
   if (body.clientRequestId) {
     const existingJob = await videoJobsDb.getByClientRequestId(userId, body.clientRequestId);
     if (existingJob) {
       return existing job;
     }
   }
   ```
3. Added `client_request_id: body.clientRequestId` to job creation
4. Added 3 log statements:
   - `[VideoAnimate] Creating job...`
   - `[VideoAnimate] Provider job started...`
   - `[VideoAnimate] Job failed...`

### 4. `frontend/src/app/api/video/jobs/[id]/route.ts`

**Changes:**
1. Added idempotent upload guard:
   ```typescript
   if (job.output_video_url) {
     // Skip upload, return existing signed URL
   }
   ```
2. Added 5 log statements:
   - `[VideoJobs] Polling provider status...`
   - `[VideoJobs] Provider status mapped...`
   - `[VideoJobs] Starting upload to storage...`
   - `[VideoJobs] Upload completed...`
   - `[VideoJobs] Job failed...`

### 5. `frontend/src/components/video/AnimateButton.tsx`

**Changes:**
1. Added UUID generation function
2. Generate `clientRequestId` on each click
3. Send `clientRequestId` in API request body

## Logging Points (5 Total)

1. **Job Created**: `[VideoAnimate] Creating job for user {userId}, client_request_id: {id}`
2. **Provider Started**: `[VideoAnimate] Provider job started: {provider}, taskId: {taskId}`
3. **Status Polled**: `[VideoJobs] Polling {provider} status for job {jobId}...`
4. **Status Mapped**: `[VideoJobs] {provider} status mapped: {status} -> {mappedStatus}`
5. **Upload Started/Completed**: `[VideoJobs] Starting upload to storage...` / `[VideoJobs] Upload completed...`
6. **Job Failed**: `[VideoAnimate] Job {jobId} failed: {error}` / `[VideoJobs] Job {jobId} failed: {error}`

## Known Limitations

1. **Webhook Support**: Not implemented. Polling is used instead, which may cause slight delays in status updates (3s polling interval).

2. **Concurrent Job Limits**: No per-user concurrent job limit (only daily quota). Users can create multiple jobs simultaneously, which may cause provider rate limiting.

3. **Video Storage Cleanup**: No automatic cleanup of old videos. Manual cleanup required to manage storage costs. Consider implementing TTL or archival policy.

4. **Retry Logic**: Failed jobs are not automatically retried. Users must manually retry by creating a new job. Transient errors (network timeouts) are not handled.

5. **Provider Fallback**: If Fal.ai fails, Runway is tried, but no retry on transient errors. Consider exponential backoff for retries.

6. **Quota Reset**: Quota resets at midnight UTC. No manual reset endpoint (requires direct database access via service role).

7. **Signed URL Expiry**: Signed URLs expire after 1 hour. Frontend must refresh if video playback fails. Consider longer expiry or refresh mechanism.

8. **Client Request ID**: If client loses UUID (page refresh), duplicate prevention won't work for that specific request. New UUID will be generated on next click.

9. **RLS Policy Gap**: The "Users can update their own video jobs" policy allows users to update their own jobs, but status updates should ideally be restricted to service role only. Current implementation relies on application logic to prevent status manipulation.

10. **Storage Path Collision**: If two jobs with same `jobId` are created (shouldn't happen with UUIDs), storage path collision could occur. Current implementation uses `upsert: true` to handle this.

## Deployment Checklist

- [ ] Apply `0014_video_animation_hardening.sql` migration
- [ ] Verify `client_request_id` column exists in `video_jobs` table
- [ ] Verify unique index `idx_video_jobs_client_request_id` exists
- [ ] Verify `updated_at` trigger is active
- [ ] Deploy code changes
- [ ] Test duplicate prevention (double-click Animate button)
- [ ] Test idempotency (multiple GET requests on same job)
- [ ] Verify logs appear in production logs
- [ ] Monitor storage bucket for duplicate uploads
- [ ] Test quota atomicity with parallel requests
