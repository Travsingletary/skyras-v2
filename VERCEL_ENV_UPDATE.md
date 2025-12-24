# Vercel Environment Variables - Required Updates

## 🚨 New Variables That Need to Be Added to Vercel

Based on your updated `.env.local`, these variables need to be added to your Vercel deployment.

### Firebase (Push Notifications)

**For Production:** Use base64-encoded service account (file path won't work on Vercel)

```bash
# Base64-encoded service account (READY TO COPY)
FIREBASE_SERVICE_ACCOUNT=ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAic2t5cmFzLWFpLXN0dWRpby03YWM1YyIsCiAgInByaXZhdGVfa2V5X2lkIjogImFmNGI2ODhmZmEzNWVlMDYwM2ExYmI4ODg4MWJhYTQ1Njk3NjFlZDkiLAogICJwcml2YXRlX2tleSI6ICItLS0tLUJFR0lOIFBSSVZBVEUgS0VZLS0tLS1cbk1JSUV2QUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktZd2dnU2lBZ0VBQW9JQkFRRFl4bCtEM3hXNWI4TGZcbkU4M3d1Ykp5dkNLWnQrQnhmZG5CcXhUMlVUUW9kWlBZL0lsZFFWT3k4TUhsRDBsbVJzMUpDRGZGbUZtTXAxRktcbjUrWDd0em1YRE9HQXUzRUdZN25JeHRKTUQrZ2VUSjhpWW9sdzJPQkJyZ2YzUWFIUWRxZDZ4aEJIMWQ3OEIrQ2tcbmVKTlpoRk9zT3k5Q1preHFub2VwY1FsVHdvWmtiTWNRZjZvMWI4T1RnNHV6Y29IZ2JpaEo3RTFnb3RHc1VNUUZcbm9ORUs2THRpTy9PSjZ3TWJOcUhBclBaSW5nNVRESytGaVVvc1E1cEtENTZNQ2FPbDdOTnREdUNzc0hJQzBTNmhcbmxtNVFzUmZrZVN6N3ZNSVI1TUgwWG40Nk9hUForeDcyc0doVjlObUxDczJIV1ZPbDNwVmJ4ajBpazhkelJJK2lcblU5clozaG5wQWdNQkFBRUNnZ0VBUk5iYVJqcDEzNm1LTE9WUkpQMFRtalA4bU93M3JsTFU4QmV3VkhoOUk4d1NcbjQzbHU5ZHBsQmhKR3dNTVdBQkRENkVsZnpMUVEzQVhXWHY4OW5hNFY3ODM3WHJJbnRtdTg5L0dMbnZQK05vRUdcbm1CaktwTGQ2bitEd1RxamRCaUpvRlNrSXlvYzBoTHpMcmU5TWU4VDEvVi9lSml2dVlIMXZmM09TRHJOYmtsQVNcbjVEQ2h4elRZdU5IVWxxR3Bya25PdkhwUzlUV3VmRlhqdnhlM0puTUl0cStTUXdNWkZuVWlWUnRXUEM3Z1ZTY2RcbkJaUmk3Y0pEQWx2eHZEM1Vsek1IOFlvMGE0ejBWaXhFWEdqb0ZJTkUxejhGdXhJVWpCT3p5SWcvdm9GOHZzeGRcbmtRZjcreDhxbjNQbUhiZnJPWUppL2VhYzNoL2lja3YzSjV4UnVsay9NUUtCZ1FEK3Evd2c4OGk4SGFPa3p6N0ZcbmQxc2hMSW8wMXZKOG9ZM3lnenAydWVaS29VaVJQblhmVk9UelNlOG8xbGwyWkJZak5DakE5aFFMNXBDUWhaNFhcbklBeUkvM2s5bWFsd0JZcVZHVnBKUkNJTWl2aFNRQ1NtMlZYVGMwRGQxOFVpMEtWN3FsaTVaQXp3R3E4TzhPTVdcblRXVGdhSmF3blp5emh1dWd3MmpwMzV6UVd3S0JnUURaNThxb21iRkRuVTIwVGtFMnJkRDhUN1JGVVZnZHRyZitcbkxFMWhMWnNzeUxpZjZkOWQwSG9FaWxwR01lWEdMdTdZaGhyUFdRNDhtMDMvdEhSTDlPNDV2YzZqY2tRcTc3elpcbjRXeGJabldqcGpZbk4zenppWXJaZmZka2tkNzh1azFFM0pXM0V3ZVRwWjBRNGlqSWtoN3NHaTc1UDJJN3pLNDdcbmIxVk01MnhTQ3dLQmdBQy8vdWtWN3JSbkhmRkJUdjBENGZmU0NzSW5FK1c4RUEvenhQdE9odGdYYTRCSi84emRcbmtpTUpSN1FHRlpOY3JoZ0NjbEJIS1QzenV0OUNGWG9aOVE5K09Sd3VWS3BveWNTd28yeHR6Ky9iaE9teEdLcUpcbkgxQ1ZHVTdOOE4ydVlaNWduUXhHdUNjSTNSVWRMbjRGVWxPNjJ4N0FDQk1iUlp4ZWx2T0JYaFBiQW9HQWZoZ25cbnFkRG1SeDRyN1A2cnRoeDNKc3Bvb3dRalhXNXlvbDY0bUZkdnlFYU9yOXNDS3FPTk9EdG5hZDlOKzVVRkdiN2dcbm5NUUgvUUpSN0hwY0llZ21RcnVYYS9XZmhNa2VHMmJhOFRrbE1nSG9yR0RycVhJYUt5azlrN0RsdkpHQ1RTcm9cbloveFhFaFZ3QW1rYytKTzEyU0o5dERYOWZtVS9IWjJiV3RsQVVXa0NnWUJ5d0xIZGtHaEk2dG9vU0VEeko2NGNcbmlSdDZpcW5hb2JiZ0NSRGwvRE1FckdWM0ZWZk9yeFNKSGhtNlduZHlZNjZMeHErWjk0cERSeFVLT3J3SkwvNlVcbnFuZ3V4YUovdmlHMThJNk5ncTB4U0Zqc2VmazhObWFST0h3enJZdU90dlVYTTVlVDBldHZlYzdJOVA4TEFCbkpcbmRpbmd0YkFaUFFzSllhU1ZrMlcxbWc9PVxuLS0tLS1FTkQgUFJJVkFURSBLRVktLS0tLVxuIiwKICAiY2xpZW50X2VtYWlsIjogImZpcmViYXNlLWFkbWluc2RrLWZic3ZjQHNreXJhcy1haS1zdHVkaW8tN2FjNWMuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICJjbGllbnRfaWQiOiAiMTExMjY1MjIwMDU4MDE3NzM5NzQ0IiwKICAiYXV0aF91cmkiOiAiaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tL28vb2F1dGgyL2F1dGgiLAogICJ0b2tlbl91cmkiOiAiaHR0cHM6Ly9vYXV0aDIuZ29vZ2xlYXBpcy5jb20vdG9rZW4iLAogICJhdXRoX3Byb3ZpZGVyX3g1MDlfY2VydF91cmwiOiAiaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vb2F1dGgyL3YxL2NlcnRzIiwKICAiY2xpZW50X3g1MDlfY2VydF91cmwiOiAiaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vcm9ib3QvdjEvbWV0YWRhdGEveDUwOS9maXJlYmFzZS1hZG1pbnNkay1mYnN2YyU0MHNreXJhcy1haS1zdHVkaW8tN2FjNWMuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICJ1bml2ZXJzZV9kb21haW4iOiAiZ29vZ2xlYXBpcy5jb20iCn0K

# Firebase public config (if not already added)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBoZj2pG-7pLnz2cxrNlUCcrPpRM9EgyII
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=skyras-ai-studio-7ac5c.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=skyras-ai-studio-7ac5c
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=skyras-ai-studio-7ac5c.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=599024823912
NEXT_PUBLIC_FIREBASE_APP_ID=1:599024823912:web:854698baab00c38c67d5dd
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BFDwb9UZVGBgN30vPddxcb9omlxJtIcRbH9ZzV-479IIgBGJBozuhdaPjbGt3iYLkAp7Vf2FOZ-DSylGkVjqkNQ
```

### Runway API (Video/Image Generation)

```bash
RUNWAY_API_KEY=key_741b39394919f633475014cee90f21d292534a30c413bf142924a7f97873355c4ed5905b00c68bd0bea8fc7b6946f5f40f22927daa31fc6b2eda07b9af1db6dc
RUNWAY_API_BASE_URL=https://api.dev.runwayml.com
RUNWAY_API_VERSION=2024-11-06
```

### Replicate API (Image Generation Fallback)

```bash
REPLICATE_API_TOKEN=your-replicate-api-token-here
REPLICATE_MODEL_ID=stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b
```

### Morning Meeting / Cron Configuration

```bash
CRON_SECRET=BGbeB4CYIWCsEaX8IM3e5pEQMS1c0MefyMQLOi56S/s=
MORNING_MEETING_USERS=public
```

### Google OAuth (Calendar Integration)

```bash
GOOGLE_OAUTH_ENCRYPTION_KEY=4bb66a3a0c607c5a97d3d1bfe090667e714f0a5a2c444da25d92afc4d819b74e
GOOGLE_CLIENT_ID=your-google-oauth-client-id-here
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret-here
GOOGLE_REDIRECT_URI=https://your-app.vercel.app/api/auth/google/callback
```

### API Base URL

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-app.vercel.app
```

## 📋 How to Add to Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Click "Add New"
3. Add each variable above
4. **Important:** Select all environments: ✅ Production ✅ Preview ✅ Development
5. Click "Save"

## 🔐 Firebase Service Account (Ready to Use)

The base64-encoded service account is already generated above (in the Firebase section). Simply copy the entire value after `FIREBASE_SERVICE_ACCOUNT=` and paste it into Vercel.

## ✅ Variables That Should Already Be in Vercel

These should already be configured (verify they exist):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY` (optional)
- `ELEVENLABS_API_KEY` (optional)
- `TTS_PROVIDER`
- `TTS_DEFAULT_VOICE`
- `TTS_DEFAULT_SPEED`
- `RBAC_ENFORCE`
- `DEFAULT_STORAGE_PROVIDER`
- `SIGNED_URL_DEFAULT_EXPIRY`

## 🎯 Quick Checklist

- [ ] Add `FIREBASE_SERVICE_ACCOUNT` (base64-encoded)
- [ ] Add Firebase public config variables (if missing)
- [ ] Add `RUNWAY_API_KEY`, `RUNWAY_API_BASE_URL`, `RUNWAY_API_VERSION`
- [ ] Add `REPLICATE_API_TOKEN`, `REPLICATE_MODEL_ID`
- [ ] Add `CRON_SECRET`
- [ ] Add `MORNING_MEETING_USERS`
- [ ] Add Google OAuth variables
- [ ] Add `NEXT_PUBLIC_API_BASE_URL` (set to your Vercel URL)
- [ ] Update `GOOGLE_REDIRECT_URI` with your actual Vercel domain

## 🔄 After Adding Variables

Vercel will automatically redeploy. Wait for the deployment to complete, then test:

1. Push notifications (if using Firebase)
2. Image generation (Runway/Replicate)
3. Morning meeting cron job
4. Google Calendar integration

