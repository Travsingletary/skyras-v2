# Production Deployment Checklist

## Pre-Deployment

- [ ] Code committed and pushed to `main`
- [ ] Storage system tested locally (real file upload, not just “it builds”)
- [ ] RBAC system tested locally (with `RBAC_ENFORCE=true` and a role assigned)
- [ ] Migrations applied to Supabase database (`0004` + `0005`)
- [ ] `user-uploads` bucket exists in Supabase and is **private**
- [ ] Bucket policies configured (or you’re using `SUPABASE_SERVICE_ROLE_KEY` server-side)

## Vercel Environment Variables

Required variables to set in Vercel dashboard:

### Supabase
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (**required** for private bucket uploads with your current storage policy)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Storage
- [ ] `DEFAULT_STORAGE_PROVIDER=supabase`
- [ ] `SIGNED_URL_DEFAULT_EXPIRY=3600`

### RBAC (Start with false)
- [ ] `RBAC_ENFORCE=false`

## Phase 1: Deploy with RBAC Disabled

- [ ] Deploy to Vercel
- [ ] Wait for build to complete
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

## Phase 2: Enable RBAC (After Storage is Working)

- [ ] Assign roles to production users:
  ```sql
  -- In Supabase SQL Editor
  SELECT public.rbac_assign_role('test-user-123', 'admin');
  SELECT public.rbac_assign_role('prod-user-456', 'user');
  ```

- [ ] Update Vercel environment variable:
  - [ ] Set `RBAC_ENFORCE=true`

- [ ] Redeploy (Vercel will auto-redeploy on env change)

- [ ] Test authorized upload (should work):
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

- [x] All environment variables configured
- [ ] Storage upload works in production
- [ ] Signed URLs generate and work
- [ ] Database records created correctly
- [ ] RBAC enforcement works (Phase 2)
- [ ] No errors in Vercel logs
- [ ] No errors in Supabase logs

---

**Deployment Date:** _____________

**Deployed By:** _____________

**Production Status:**
- Phase 1 (Storage): ⬜ Not Started | ⬜ In Progress | ⬜ Complete | ⬜ Failed
- Phase 2 (RBAC): ⬜ Not Started | ⬜ In Progress | ⬜ Complete | ⬜ Failed
