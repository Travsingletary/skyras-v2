# Production Deployment Checklist

## Current Status

**BLOCKED:** One environment variable scope issue preventing preview deployments.

**Fix Required:**
- Edit `SUPABASE_SECRET_KEY` in Vercel → Add to Preview and Development environments
- Currently only in Production, needs to be in all three

**Everything else is ready:**
- ✅ Code deployed to main branch
- ✅ All other environment variables configured
- ✅ Storage system tested locally
- ✅ RBAC enabled and tested locally
- ✅ Migrations applied to Supabase

**See:** `VERCEL_ENV_VARS.md` for detailed cleanup guide (11 redundant variables can be removed)

---

## Pre-Deployment

- [x] Code committed and pushed to `main`
- [x] Storage system tested locally (real file upload, not just "it builds")
- [x] RBAC system tested locally (with `RBAC_ENFORCE=true` and a role assigned)
- [x] Migrations applied to Supabase database (`0004` + `0005`)
- [x] `user-uploads` bucket exists in Supabase and is **private**
- [x] Using `SUPABASE_SECRET_KEY` server-side (replaces old SERVICE_ROLE_KEY)

## Vercel Environment Variables

Required variables to set in Vercel dashboard:

### Supabase
- [x] `SUPABASE_URL` (All Environments)
- [x] `SUPABASE_ANON_KEY` (All Environments)
- [ ] `SUPABASE_SECRET_KEY` (**CRITICAL:** Currently Production only - must add to Preview/Development)
- [x] `NEXT_PUBLIC_SUPABASE_URL` (All Environments)
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (All Environments)

### Storage
- [x] `DEFAULT_STORAGE_PROVIDER=supabase` (All Environments)
- [x] `SIGNED_URL_DEFAULT_EXPIRY=3600` (All Environments)

### RBAC
- [x] `RBAC_ENFORCE=true` (All Environments - already enabled)

## Deployment Status

- [x] Deploy to Vercel (completed)
- [x] Wait for build to complete (successful)
- [ ] Fix SUPABASE_SECRET_KEY environment scope (BLOCKING)
- [ ] Test upload endpoint: `POST /api/upload`
- [ ] Verify signed URL generated
- [ ] Verify file uploaded to Supabase storage
- [ ] Check database record has:
  - [ ] `storage_provider = 'supabase'`
  - [ ] `is_public = false`
  - [ ] `signed_url_expires_at` is set
- [ ] Download file via signed URL (verify it works)

**Test Command:**
```bash
# Replace with your production URL
curl -X POST https://your-app.vercel.app/api/upload \
  -F "files=@test.jpg" \
  -F "userId=test-user-123"
```

**Alternative test (uses this repo’s helper):**
```bash
node scripts/test-upload.mjs ./public/vercel.svg test-user-123 https://your-app.vercel.app
```

## RBAC Status

**Note:** RBAC is already enabled (`RBAC_ENFORCE=true`) from the start.

- [x] Assign test user role:
  ```sql
  -- Already done in local testing
  SELECT public.rbac_assign_role('test-user-123', 'admin');
  ```

- [x] Set `RBAC_ENFORCE=true` in Vercel (already done)

- [ ] Test authorized upload (after storage is working):
  ```bash
  curl -X POST https://your-app.vercel.app/api/upload \
    -F "files=@test.jpg" \
    -F "userId=test-user-123"
  # Expected: 200 OK with file data
  ```

- [ ] Test unauthorized upload (should fail):
  ```bash
  curl -X POST https://your-app.vercel.app/api/upload \
    -F "files=@test.jpg" \
    -F "userId=unauthorized-user"
  # Expected: 403 Forbidden
  ```

## Monitoring

After deployment, monitor:

- [ ] Vercel function logs for errors
- [ ] Supabase storage usage
- [ ] Database query performance
- [ ] RBAC permission check latency

## Rollback Plan

If issues occur:

1. **Storage issues:**
   - Check Supabase credentials in Vercel
   - Verify `user-uploads` bucket exists
   - Check bucket policies allow uploads

2. **RBAC issues:**
   - Set `RBAC_ENFORCE=false` to disable
   - Redeploy
   - Investigate permission check logs

3. **Complete rollback:**
   ```bash
   # Revert to previous commit
   git revert HEAD
   git push origin main
   ```

## Production URLs

- **Vercel App:** https://your-app.vercel.app
- **Upload API:** https://your-app.vercel.app/api/upload
- **Files API:** https://your-app.vercel.app/api/files/[id]
- **Supabase Dashboard:** https://app.supabase.com/project/zzxedixpbvivpsnztjsc

## Success Criteria

- [x] All required environment variables exist in Vercel
- [ ] SUPABASE_SECRET_KEY in all environments (currently Production only)
- [ ] Storage upload works in production
- [ ] Signed URLs generate and work
- [ ] Database records created correctly
- [ ] RBAC enforcement works in production
- [ ] No errors in Vercel logs
- [ ] No errors in Supabase logs
- [ ] Cleanup redundant environment variables (11 can be removed)

---

**Deployment Date:** 2025-12-18

**Deployed By:** User

**Production Status:**
- Code Deployment: ✅ Complete
- Environment Config: ⏳ In Progress (one variable scope issue)
- Storage Testing: ⏳ Blocked (waiting for env fix)
- RBAC Testing: ⏳ Blocked (waiting for env fix)

**Next Action:** Edit SUPABASE_SECRET_KEY in Vercel → Add to Preview and Development environments
