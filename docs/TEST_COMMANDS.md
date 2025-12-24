# Test Commands for Agent MVP

## Quick Test Commands

### Creative Path
```bash
curl -X POST https://skyras-v2.vercel.app/api/test/golden-path \
  -H "Content-Type: application/json" \
  -d '{"scenario":"creative","userId":"public","project":"SkySky","input":{"context":"A cinematic sequence","mood":"dynamic"}}'
```

### Compliance Path
```bash
curl -X POST https://skyras-v2.vercel.app/api/test/golden-path \
  -H "Content-Type: application/json" \
  -d '{"scenario":"compliance","userId":"public","project":"SkySky","input":{"files":[{"name":"demo_track.mp3","path":"music/demo_track.mp3"}]}}'
```

### Distribution Path
```bash
curl -X POST https://skyras-v2.vercel.app/api/test/golden-path \
  -H "Content-Type: application/json" \
  -d '{"scenario":"distribution","userId":"public","project":"SkySky","input":{"platforms":["instagram","tiktok"],"campaign":"Test Campaign"}}'
```

## Verify Results in Database

### Check Agent Runs
```sql
SELECT scenario, success, created_at, error_message
FROM agent_runs
ORDER BY created_at DESC
LIMIT 5;
```

### Check Assets (Creative/Compliance)
```sql
SELECT name, type, agent_source, licensing_status, created_at
FROM assets
ORDER BY created_at DESC
LIMIT 5;
```

### Check Scheduled Posts (Distribution)
```sql
SELECT platform, caption, status, agent_source, created_at
FROM scheduled_posts
WHERE status = 'Draft'
ORDER BY created_at DESC
LIMIT 5;
```

