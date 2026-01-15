# Video Animation Feature - Production Gate Test Plan

## Overview
This test plan verifies RLS isolation, security, idempotency, quota atomicity, and provider integration for the IMAGE→VIDEO animation feature.

## Prerequisites
- Supabase project with migration `0014_video_animation.sql` applied
- Storage buckets `source-images` and `generated-videos` created (private)
- Environment variables: `FAL_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Test user with auth session
- Test image file (PNG/JPG, <10MB) uploaded to `files` table

## Test 1: RLS Isolation on video_jobs

### Manual Test
1. Create two test users: `user_a` and `user_b`
2. As `user_a`, create animation job via API
3. As `user_b`, attempt to GET job created by `user_a`
4. **Expected**: 404 (job not found or access denied)

### cURL Test
```bash
# As user_a (get auth token)
TOKEN_A="user_a_auth_token"
JOB_ID="job_id_from_user_a"

# As user_b (get auth token)
TOKEN_B="user_b_auth_token"

# user_b tries to access user_a's job
curl -X GET "http://localhost:3000/api/video/jobs/$JOB_ID" \
  -H "Authorization: Bearer $TOKEN_B" \
  -H "Cookie: sb-access-token=$TOKEN_B"

# Expected: 404 or 403
```

### Verification
- Check Supabase logs: RLS policy should block access
- Verify `video_jobs` table: `user_id` matches authenticated user

## Test 2: Client Cannot Update Job Status

### Manual Test
1. Create animation job as authenticated user
2. Attempt to UPDATE job via direct Supabase client call (client-side)
3. **Expected**: RLS policy blocks UPDATE (only service role can update)

### cURL Test
```bash
# Attempt to update job status directly (should fail)
curl -X PATCH "https://your-project.supabase.co/rest/v1/video_jobs?id=eq.$JOB_ID" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"status": "succeeded", "output_video_url": "hacked.mp4"}'

# Expected: 403 Forbidden (RLS policy blocks)
```

### Verification
- RLS policy `"Users can update their own video jobs"` should only allow updates to non-status fields
- Or: Service role policy should be the only one allowing status updates

## Test 3: Buckets Private + Signed URLs Play MP4

### Manual Test
1. Complete animation job (status = 'succeeded')
2. Get signed URL from GET `/api/video/jobs/:id`
3. Attempt to access bucket directly (without signed URL)
4. **Expected**: 403 Forbidden
5. Use signed URL in browser/video player
6. **Expected**: MP4 plays correctly

### cURL Test
```bash
# Get job with signed URL
curl -X GET "http://localhost:3000/api/video/jobs/$JOB_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Cookie: sb-access-token=$TOKEN"

# Extract signedVideoUrl from response
SIGNED_URL="signed_url_from_response"
STORAGE_PATH="user_id/generated-videos/job_id.mp4"

# Attempt direct bucket access (should fail)
curl -X GET "https://your-project.supabase.co/storage/v1/object/generated-videos/$STORAGE_PATH" \
  -H "apikey: $SUPABASE_ANON_KEY"

# Expected: 403 Forbidden

# Use signed URL (should succeed)
curl -X GET "$SIGNED_URL" -o test_video.mp4

# Verify MP4 file
file test_video.mp4
# Expected: "test_video.mp4: ISO Media, MP4 Base Media v1 [IS0 14496-12:2003]"
```

### Verification
- Bucket RLS: Public access denied
- Signed URL: Valid for 1 hour, plays MP4
- Video file: Valid MP4 format

## Test 4: Provider Status Mapping + Polling Stops

### Manual Test
1. Create animation job
2. Monitor GET `/api/video/jobs/:id` responses
3. Verify status transitions: `queued` → `running` → `succeeded`
4. After `succeeded`, verify polling stops (no more requests)
5. **Expected**: Status maps correctly, polling stops on terminal states

### cURL Test
```bash
# Create job
JOB_RESPONSE=$(curl -X POST "http://localhost:3000/api/video/animate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Cookie: sb-access-token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"imageId": "test_image_id"}')

JOB_ID=$(echo $JOB_RESPONSE | jq -r '.data.jobId')

# Poll until complete (max 60 attempts, 3s interval)
for i in {1..60}; do
  STATUS=$(curl -s -X GET "http://localhost:3000/api/video/jobs/$JOB_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Cookie: sb-access-token=$TOKEN" | jq -r '.data.status')
  
  echo "Attempt $i: Status = $STATUS"
  
  if [ "$STATUS" = "succeeded" ] || [ "$STATUS" = "failed" ]; then
    echo "Terminal state reached: $STATUS"
    break
  fi
  
  sleep 3
done

# Verify final status
FINAL_STATUS=$(curl -s -X GET "http://localhost:3000/api/video/jobs/$JOB_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Cookie: sb-access-token=$TOKEN" | jq -r '.data.status')

echo "Final status: $FINAL_STATUS"
# Expected: "succeeded" or "failed"
```

### Verification
- Status mapping: Fal.ai `COMPLETED` → `succeeded`, `FAILED` → `failed`
- Polling stops: No requests after terminal state
- Check server logs: Polling requests stop after completion

## Test 5: Quota Atomicity Under Concurrency

### Manual Test
1. Set `VIDEO_DAILY_LIMIT=5` for testing
2. Reset quota: `UPDATE video_quota SET count = 0 WHERE user_id = 'test_user' AND date = CURRENT_DATE;`
3. Send 25 parallel requests to POST `/api/video/animate`
4. **Expected**: Exactly 5 succeed (429 for rest), quota count = 5

### cURL Test
```bash
# Reset quota (via Supabase SQL Editor or service role)
# Then run 25 parallel requests

for i in {1..25}; do
  curl -X POST "http://localhost:3000/api/video/animate" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Cookie: sb-access-token=$TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"imageId": "test_image_id"}' \
    -w "\nRequest $i: HTTP %{http_code}\n" \
    -o /dev/null -s &
done

wait

# Check quota count
QUOTA_COUNT=$(psql -c "SELECT count FROM video_quota WHERE user_id = 'test_user' AND date = CURRENT_DATE;")
echo "Quota count: $QUOTA_COUNT"
# Expected: Exactly 5 (not 25, not 6, not 4)
```

### Verification
- Database: `video_quota.count = 5` (exactly)
- No race conditions: UPSERT with atomic increment
- Check for duplicate job creations (should be prevented by client_request_id)

## Test 6: GET /api/video/jobs/:id Idempotency (No Duplicate Uploads)

### Manual Test
1. Create animation job
2. Call GET `/api/video/jobs/:id` multiple times while status = 'running'
3. Wait for provider to complete
4. Call GET again (should trigger upload)
5. Call GET 5 more times
6. **Expected**: Video uploaded exactly once, subsequent calls return existing storage path

### cURL Test
```bash
# Create job
JOB_RESPONSE=$(curl -X POST "http://localhost:3000/api/video/animate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Cookie: sb-access-token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"imageId": "test_image_id"}')

JOB_ID=$(echo $JOB_RESPONSE | jq -r '.data.jobId')

# Poll until running (provider started)
while true; do
  STATUS=$(curl -s -X GET "http://localhost:3000/api/video/jobs/$JOB_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Cookie: sb-access-token=$TOKEN" | jq -r '.data.status')
  
  if [ "$STATUS" = "running" ]; then
    break
  fi
  sleep 2
done

# Wait for provider completion (mock or real)
sleep 30

# Call GET 10 times in parallel (should only upload once)
for i in {1..10}; do
  curl -X GET "http://localhost:3000/api/video/jobs/$JOB_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Cookie: sb-access-token=$TOKEN" \
    -w "\nRequest $i: %{http_code}\n" \
    -o /dev/null -s &
done

wait

# Check storage: should have exactly 1 file
STORAGE_FILES=$(psql -c "SELECT COUNT(*) FROM storage.objects WHERE bucket_id = 'generated-videos' AND name LIKE '%$JOB_ID%';")
echo "Storage files for job: $STORAGE_FILES"
# Expected: 1
```

### Verification
- Storage bucket: Exactly 1 MP4 file per job
- Database: `output_video_url` set once, not overwritten
- Server logs: "Upload to storage started" appears once per job

## Test 7: Validation - Unauthenticated + Invalid Image Paths

### Manual Test
1. Call POST `/api/video/animate` without auth
2. **Expected**: 401 Unauthorized
3. Call with invalid `imageId` (non-existent)
4. **Expected**: 400 Bad Request
5. Call with `sourceImagePath` pointing to non-existent file
6. **Expected**: 400 Bad Request

### cURL Test
```bash
# Test 1: No auth
curl -X POST "http://localhost:3000/api/video/animate" \
  -H "Content-Type: application/json" \
  -d '{"imageId": "test_id"}'
# Expected: 401

# Test 2: Invalid imageId
curl -X POST "http://localhost:3000/api/video/animate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Cookie: sb-access-token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"imageId": "non-existent-id-12345"}'
# Expected: 400

# Test 3: Invalid sourceImagePath
curl -X POST "http://localhost:3000/api/video/animate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Cookie: sb-access-token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sourceImagePath": "fake/path/image.jpg"}'
# Expected: 400

# Test 4: Image too large (>10MB)
# (Requires test image >10MB)
curl -X POST "http://localhost:3000/api/video/animate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Cookie: sb-access-token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"imageId": "large_image_id"}'
# Expected: 400 with "Image too large" message
```

### Verification
- All validation errors return appropriate HTTP status codes
- Error messages are clear and don't leak sensitive info
- No jobs created for invalid inputs

## Test Results Template

| Test | Status | Notes |
|------|--------|-------|
| 1. RLS Isolation | ⬜ Pass / ⬜ Fail | |
| 2. Client Cannot Update Status | ⬜ Pass / ⬜ Fail | |
| 3. Buckets Private + Signed URLs | ⬜ Pass / ⬜ Fail | |
| 4. Provider Status Mapping | ⬜ Pass / ⬜ Fail | |
| 5. Quota Atomicity | ⬜ Pass / ⬜ Fail | |
| 6. GET Idempotency | ⬜ Pass / ⬜ Fail | |
| 7. Validation | ⬜ Pass / ⬜ Fail | |

## Known Limitations

1. **Webhook Support**: Not implemented. Polling is used instead, which may cause slight delays.
2. **Concurrent Job Limits**: No per-user concurrent job limit (only daily quota).
3. **Video Storage Cleanup**: No automatic cleanup of old videos (manual cleanup required).
4. **Retry Logic**: Failed jobs are not automatically retried (manual retry required).
5. **Provider Fallback**: If Fal.ai fails, Runway is tried, but no retry on transient errors.
