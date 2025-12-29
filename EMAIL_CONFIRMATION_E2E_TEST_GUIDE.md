# Email Confirmation E2E Test - Complete Guide

**Date:** 2025-01-28  
**Test Email:** `e2e-final-1766990250@gmail.com`  
**Status:** ⏳ Awaiting Supabase Configuration

---

## ✅ Step 1: Configure Supabase (REQUIRED FIRST)

**Location:** https://supabase.com/dashboard/project/zzxedixpbvivpsnztjsc/auth/url-configuration

**Configure:**
1. **Site URL:** `https://skyras-v2.vercel.app`
2. **Redirect URLs** (one per line):
   ```
   https://skyras-v2.vercel.app/auth/callback
   https://skyras-v2.vercel.app/**
   http://localhost:3000/auth/callback
   http://localhost:3000/**
   ```

**Screenshots Required:**
- [ ] Site URL field showing `https://skyras-v2.vercel.app`
- [ ] Redirect URLs list showing all 4 entries

**Guide:** See `docs/SUPABASE_URL_CONFIG_WITH_SCREENSHOTS.md`

---

## ✅ Step 2: Signup Complete

**Test Email Created:**
```
Email: e2e-final-1766990250@gmail.com
Password: testpass123
```

**Signup Response:**
```json
{
  "success": true,
  "user": {
    "email": "e2e-final-1766990250@gmail.com"
  }
}
```

✅ **Signup successful** - Email should be sent to inbox

---

## ⏳ Step 3: Check Email and Click Confirmation Link

**Action Required:**
1. Check email inbox for: `e2e-final-1766990250@gmail.com`
2. Find email from Supabase with subject like "Confirm your signup"
3. Click the confirmation link in the email

**Expected Behavior:**
- Link should redirect to: `https://skyras-v2.vercel.app/auth/callback?token_hash=...&type=signup`
- Then redirect to: `https://skyras-v2.vercel.app/studio`
- Session cookies should be set

---

## ⏳ Step 4: Verify Callback Logs

**Location:** Vercel Dashboard → Latest Deployment → Functions → `/auth/callback` → Logs

**Expected Logs:**
```
[Auth] Callback received params: {
  token_hash: 'present',
  code: 'missing',
  type: 'signup',
  allParams: { token_hash: '...', type: 'signup' }
}
[Auth] Email confirmed successfully (token_hash): {
  userId: "...",
  email: "e2e-final-1766990250@gmail.com",
  emailConfirmedAt: "2025-01-28T..."
}
[Auth] TEMPORARY: exchangeCodeForSession succeeded (token_hash format)
```

**Action:** Copy and paste the full log output showing:
- ✅ `[Auth] Callback received params:` with actual values
- ✅ `[Auth] TEMPORARY: exchangeCodeForSession succeeded`
- ✅ `[Auth] Email confirmed successfully` with user details

---

## ⏳ Step 5: Verify Supabase User

**Location:** https://supabase.com/dashboard/project/zzxedixpbvivpsnztjsc/auth/users

**Action:**
1. Find user: `e2e-final-1766990250@gmail.com`
2. Check `email_confirmed_at` field
3. Should show a timestamp (NOT null)

**Screenshot Required:**
- [ ] User row showing `email_confirmed_at` with timestamp

---

## ⏳ Step 6: Test Login

**Run:**
```bash
./scripts/verify-callback-and-login.sh https://skyras-v2.vercel.app e2e-final-1766990250@gmail.com testpass123
```

**Or manually:**
```bash
curl -X POST https://skyras-v2.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"e2e-final-1766990250@gmail.com","password":"testpass123"}'
```

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "e2e-final-1766990250@gmail.com"
  }
}
```

**Should NOT contain:** `"error": "Email not confirmed"`

---

## ⏳ Step 7: Verify Login Logs

**Location:** Vercel Dashboard → Latest Deployment → Functions → `/api/auth/login` → Logs

**Expected Logs:**
```
[Auth] Login successful: {
  userId: "...",
  email: "e2e-final-1766990250@gmail.com",
  emailConfirmed: true,
  emailConfirmedAt: "2025-01-28T...",
  refreshedEmailConfirmed: true
}
```

**Action:** Copy and paste the full log output showing:
- ✅ `[Auth] Login successful:`
- ✅ `emailConfirmed: true`
- ✅ `emailConfirmedAt: "2025-01-28T..."`
- ✅ `refreshedEmailConfirmed: true`

---

## 📝 Deliverables Checklist

### Screenshots:
- [ ] Supabase Site URL field showing `https://skyras-v2.vercel.app`
- [ ] Supabase Redirect URLs list showing all 4 entries
- [ ] Supabase user showing `email_confirmed_at` not null

### Logs (Pasted):
- [ ] Vercel callback logs showing `exchangeCodeForSession succeeded`
- [ ] Vercel login logs showing `emailConfirmed=true` after refresh

### Verification:
- [ ] New signup → Email received → Link clicked → Redirects to `/auth/callback` → `/studio`
- [ ] Supabase user shows `email_confirmed_at` not null
- [ ] Login returns 200 and logs show `emailConfirmed=true`

---

## 🎯 After Verification Passes

Once all verification steps pass:

1. **Remove temporary logging** from callback route:
   - Remove `[Auth] TEMPORARY: exchangeCodeForSession succeeded` log lines
   - Keep the main logging for debugging

2. **Commit the cleanup:**
   ```bash
   git add frontend/src/app/auth/callback/route.ts
   git commit -m "chore: Remove temporary logging from email confirmation callback"
   git push origin main
   ```

---

**Status:** ⏳ Awaiting Supabase Configuration & Email Confirmation  
**Last Updated:** 2025-01-28