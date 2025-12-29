# Email Confirmation E2E Verification - Using Real Email

**Date:** 2025-01-28  
**Status:** ⏳ **READY FOR TESTING**

---

## Option 1: Use Your Own Email

**Create test user with your real email:**

```bash
./scripts/create-test-user.sh your-email@gmail.com
```

**Or manually:**
```bash
curl -X POST https://skyras-v2.vercel.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com","password":"testpass123"}'
```

**Then:**
1. Check your email inbox
2. Click the confirmation link
3. Follow the verification steps below

---

## Option 2: Use a Test Email Service

**Services that provide temporary email addresses:**
- https://temp-mail.org/
- https://10minutemail.com/
- https://guerrillamail.com/

**Steps:**
1. Get a temporary email address from one of these services
2. Create test user:
   ```bash
   ./scripts/create-test-user.sh <temp-email>@<temp-domain>
   ```
3. Check the temporary email inbox
4. Click the confirmation link
5. Follow verification steps

---

## Verification Steps (After Clicking Confirmation Link)

### Step 1: Verify Redirects

**After clicking confirmation link:**
- [ ] Link redirects to: `https://skyras-v2.vercel.app/auth/callback?token_hash=...&type=signup`
- [ ] Then redirects to: `https://skyras-v2.vercel.app/studio`
- [ ] No errors in browser console

---

### Step 2: Get Vercel /auth/callback Logs

**Location:** Vercel Dashboard → Latest Deployment → Functions → `/auth/callback` → Logs

**Expected logs:**
```
[Auth] Callback received params: {
  token_hash: 'present',
  code: 'missing',
  type: 'signup',
  allParams: {...}
}
[Auth] Email confirmed successfully (token_hash): {
  userId: "...",
  email: "...",
  emailConfirmedAt: "..."
}
[Auth] TEMPORARY: exchangeCodeForSession succeeded (token_hash format)
```

**Action:** Copy and paste the FULL log output.

---

### Step 3: Test Login and Get /api/auth/login Logs

**Test login:**
```bash
curl -X POST https://skyras-v2.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR-EMAIL","password":"testpass123"}'
```

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "..."
  }
}
```

**Should NOT contain:** `"error": "Email not confirmed"`

**Get login logs:**
1. Vercel Dashboard → Latest Deployment → Functions → `/api/auth/login` → Logs
2. Look for: `[Auth] Login successful`

**Expected logs:**
```
[Auth] Login successful: {
  userId: "...",
  email: "...",
  emailConfirmed: true,
  emailConfirmedAt: "2025-01-28T...",
  refreshedEmailConfirmed: true
}
```

**Action:** Copy and paste the FULL log output.

---

### Step 4: Supabase User Verification

**Location:** https://supabase.com/dashboard/project/zzxedixpbvivpsnztjsc/auth/users

**Action:**
1. Find your test user by email
2. Check `email_confirmed_at` field
3. Should show a timestamp (NOT null)

**Screenshot Required:**
- [ ] User row showing `email_confirmed_at` with timestamp

---

## Deliverables Checklist

- [ ] Test user created with real email
- [ ] Confirmation link clicked and redirects verified
- [ ] Vercel /auth/callback logs (pasted) showing `exchangeCodeForSession succeeded`
- [ ] Vercel /api/auth/login logs (pasted) showing `emailConfirmed=true`
- [ ] Login returns 200 with no "Email not confirmed" error
- [ ] Supabase user screenshot showing `email_confirmed_at` not null

---

**Ready to test!** Provide your email address or use a temporary email service.