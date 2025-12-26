# Next Steps - SkyRas v2 Agent MVP

**Last Updated:** 2025-01-27  
**Status:** MVP Implementation Complete, Verification Pending

---

## 🎯 Immediate Priority: Runtime Verification

### 1. Giorgio Image Generation Verification (PENDING)

**Status:** Code review complete, runtime testing needed

**Action Required:**
- [ ] **Test A**: Set `GIORGIO_IMAGE_ENABLED=false`, run creative scenario with `includeImage=true`
  - Verify: Returns `success: true`, `warnings` present, `prompt_package` artifact, `DB_OK` in proof
  - Check: No 500 errors in logs
  - Database: Confirm 2 assets saved (prompt + prompt_package)

- [ ] **Test B**: Set `GIORGIO_IMAGE_ENABLED=true`, unset `REPLICATE_API_TOKEN`, run same scenario
  - Verify: Returns `success: true`, `warnings` present, `prompt_package` artifact, `DB_OK` in proof
  - Check: No 500 errors in logs
  - Database: Confirm 2 assets saved (prompt + prompt_package)

- [ ] **Test C**: Set `GIORGIO_IMAGE_ENABLED=true` + valid `REPLICATE_API_TOKEN`, run same scenario
  - Verify: Returns `success: true`, `image` artifact (not prompt_package), `DB_OK` in proof
  - Check: No 500 errors in logs
  - Database: Confirm 2 assets saved (prompt + image)

**Documentation:** `docs/GIORGIO_IMAGE_VERIFICATION_REPORT.md`

**How to Test:**
```bash
# Test A/B/C - Change env vars, then:
curl -X POST http://localhost:3000/api/test/golden-path \
  -H "Content-Type: application/json" \
  -d '{
    "scenario": "creative",
    "userId": "public",
    "project": "SkySky",
    "input": {
      "context": "A cinematic sequence",
      "mood": "dynamic",
      "includeImage": true
    }
  }'
```

---

## 🗄️ Database Setup

### 2. Apply Supabase Migrations

**Status:** Migrations exist, need to verify applied

**Action Required:**
- [ ] Verify `agent_runs` table exists
- [ ] Verify `assets` table has required columns (`project`, `content`, `type`, `tags`, `licensing_status`)
- [ ] Verify `compliance_scans` table exists
- [ ] Verify `scheduled_posts` table exists with `status` column

**Migrations to Check:**
- `frontend/supabase/migrations/0011_agent_mvp_tables.sql`
- `frontend/supabase/migrations/0012_compliance_scans.sql`

**Verification Query:**
```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('agent_runs', 'assets', 'compliance_scans', 'scheduled_posts');

-- Check assets table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'assets';
```

---

## ✅ End-to-End Testing

### 3. Test All Three Golden Paths

**Status:** Code complete, runtime testing needed

**Action Required:**

#### Creative Path
- [ ] Test via `/agent-console` UI
- [ ] Test via API (`/api/test/golden-path`)
- [ ] Verify: Marcus routes to Giorgio → Letitia saves prompt
- [ ] Verify: Database record in `agent_runs` and `assets`
- [ ] Verify: Proof markers include `ROUTE_OK`, `AGENT_OK`, `DB_OK`, `DONE`

#### Compliance Path
- [ ] Test with sample filenames (defaults)
- [ ] Test with empty files array (should use defaults)
- [ ] Test with custom filenames
- [ ] Verify: Cassidy scans → Letitia saves flagged files
- [ ] Verify: Database record in `compliance_scans` and `assets`
- [ ] Verify: Proof markers include `INFO`, `AGENT_OK`, `DB_OK`, `DONE`

#### Distribution Path
- [ ] Test via `/agent-console` UI
- [ ] Test via API
- [ ] Verify: Jamal generates drafts → saves to `scheduled_posts`
- [ ] Verify: Database record in `agent_runs` and `scheduled_posts`
- [ ] Verify: Proof markers include `ROUTE_OK`, `AGENT_OK`, `DB_OK`, `DONE`
- [ ] Verify: NO actual platform posting (JAMAL_PUBLISH_ENABLED=false)

**Documentation:** `docs/AGENT_MVP_IMPLEMENTATION.md`

---

## 🚀 Production Readiness

### 4. Environment Variables

**Status:** Need to verify all required vars are set

**Action Required:**
- [ ] Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set
- [ ] Verify `REPLICATE_API_TOKEN` is set (if image generation needed)
- [ ] Verify `JAMAL_PUBLISH_ENABLED=false` (default, no publishing)
- [ ] Verify `GIORGIO_IMAGE_ENABLED` behavior (auto-detected from keys)

**Check Locations:**
- Vercel environment variables
- Railway environment variables (if backend deployed there)
- Local `.env` files

---

## 📊 Monitoring & Logging

### 5. Verify Logging Works

**Status:** Code includes logging, need to verify output

**Action Required:**
- [ ] Check Vercel logs for agent runs
- [ ] Verify `agent_runs` table is being populated
- [ ] Verify no 500 errors in production logs
- [ ] Check proof markers are being saved correctly

**Queries:**
```sql
-- Check recent agent runs
SELECT id, scenario, success, created_at, error_message
FROM agent_runs
ORDER BY created_at DESC
LIMIT 20;

-- Check for errors
SELECT id, scenario, error_message, created_at
FROM agent_runs
WHERE success = false
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🔍 Code Quality

### 6. Linter & Type Checks

**Status:** Should verify no new errors

**Action Required:**
- [ ] Run `npm run lint` in `frontend/`
- [ ] Run `npm run type-check` (if available)
- [ ] Fix any new linting errors
- [ ] Verify TypeScript compiles without errors

---

## 📝 Documentation Updates

### 7. Update Project Status

**Status:** Documentation exists, may need updates

**Action Required:**
- [ ] Update `docs/AGENT_MVP_IMPLEMENTATION.md` with actual test results
- [ ] Update `docs/GIORGIO_IMAGE_VERIFICATION_REPORT.md` with runtime test results
- [ ] Document any issues found during testing
- [ ] Update `docs/KNOWN_ISSUES.md` if new issues discovered

---

## 🎯 Post-MVP Enhancements (Future)

These are **NOT** immediate priorities but represent logical next steps:

1. **Real Platform Integrations** (Jamal)
   - Implement actual Instagram/TikTok/YouTube APIs
   - Remove TODO comments
   - Add rate limiting

2. **Enhanced Image Generation**
   - Support multiple providers (Runway, etc.)
   - Add image editing capabilities
   - Batch generation

3. **Advanced Compliance**
   - Real file content scanning (not just filenames)
   - License database integration
   - Automated remediation

4. **Workflow Integration**
   - Connect `agentkit/workflows/` to main app
   - Auto-execution triggers
   - Task dependency resolution

5. **Multi-User Support**
   - User preferences from database
   - Per-user agent runs
   - Team collaboration features

---

## 🚨 Known Issues to Address (When Time Permits)

See `docs/KNOWN_ISSUES.md` for full list. High priority:

1. **Router Response Ownership** (FIXED - needs verification)
2. **Supabase Tables May Not Exist** (verify migrations applied)
3. **Jamal Publishing Not Functional** (by design for MVP)
4. **Missing Error Handling** (add as needed)

---

## 📋 Quick Checklist

**Before considering MVP "complete":**
- [ ] All three golden paths tested end-to-end
- [ ] Giorgio image generation verified (all 3 scenarios)
- [ ] Database migrations applied and verified
- [ ] All database records being created correctly
- [ ] No 500 errors in production logs
- [ ] Proof markers present in all responses
- [ ] UI (`/agent-console`) works for all scenarios
- [ ] Environment variables configured correctly

---

## 🎬 Getting Started

**To run verification tests:**

1. **Start local dev server:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Open agent console:**
   - Navigate to `http://localhost:3000/agent-console`
   - Test each scenario

3. **Or use API directly:**
   - Use curl commands from `docs/AGENT_MVP_IMPLEMENTATION.md`
   - Check responses match expected format

4. **Verify database:**
   - Query Supabase tables
   - Confirm records are created

5. **Check logs:**
   - Vercel logs for production
   - Local console for dev

---

**Priority Order:**
1. Runtime verification (Giorgio image gen)
2. Database setup verification
3. End-to-end testing (all 3 paths)
4. Production readiness checks
5. Documentation updates

