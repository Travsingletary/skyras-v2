# Vercel Environment Variables - Automated Setup

## Current Status

✅ **Vercel MCP Connected** - Successfully connected to your Vercel account
✅ **Project Found** - `skyras-v2` (prj_5xYMkgDW2DrQDwABZMoZMGpsXbBv)
✅ **Vercel CLI Installed** - Version 46.1.0

⚠️ **Limitation**: Vercel MCP doesn't expose environment variable management APIs. We need to use the Vercel CLI or Dashboard.

## Quick Setup Options

### Option 1: Use the Automated Script (Recommended)

I've created a script that will set all non-secret environment variables:

```bash
cd /Users/user/Sites/skyras-v2
node scripts/set-vercel-env.mjs
```

**Note**: The script will prompt you for each variable. You can press Enter to accept the default values shown.

### Option 2: Manual Setup via Vercel Dashboard

1. Go to: https://vercel.com/travis-singletarys-projects/skyras-v2/settings/environment-variables
2. Use the checklist in `VERCEL_ENV_CHECKLIST.md` to set all variables
3. Ensure all variables are set for **Production + Preview + Development**

### Option 3: Use Vercel CLI Manually

For each variable, run:
```bash
vercel env add VARIABLE_NAME production preview development
```

Then paste the value when prompted.

## Required Variables to Set

### Critical (Must Set for All Environments)

These are already in the script and will be set automatically:

- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SECRET_KEY` (⚠️ CRITICAL - must be in all environments)
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `DEFAULT_STORAGE_PROVIDER`
- ✅ `SIGNED_URL_DEFAULT_EXPIRY`
- ✅ `RBAC_ENFORCE`
- ✅ `NEXT_PUBLIC_APP_URL`
- ✅ `CORS_ORIGINS`
- ✅ `TTS_PROVIDER`
- ✅ `TTS_DEFAULT_VOICE`
- ✅ `TTS_DEFAULT_SPEED`
- ✅ Image generation variables (see checklist)

### Secret Variables (Set Manually)

These contain sensitive keys and must be set manually:

- 🔐 `ANTHROPIC_API_KEY` - Your Anthropic API key
- 🔐 `OPENAI_API_KEY` - Your OpenAI API key
- 🔐 `REPLICATE_API_TOKEN` - If using image generation
- 🔐 `RUNWAY_API_KEY` - If using Runway
- 🔐 `ELEVENLABS_API_KEY` - If using premium TTS

To set these:
```bash
vercel env add ANTHROPIC_API_KEY production preview development
# Paste your key when prompted

vercel env add OPENAI_API_KEY production preview development
# Paste your key when prompted
```

## Variables to Delete

After setting the new variables, delete these redundant ones in the Vercel dashboard:

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (if exists - replaced by SUPABASE_SECRET_KEY)
- `SUPABASE_JWT_SECRET`
- All `POSTGRES_*` variables (7 total)

## Verification

After setup, verify all variables are set:

```bash
vercel env ls
```

Or check in the dashboard:
https://vercel.com/travis-singletarys-projects/skyras-v2/settings/environment-variables

## Next Steps

1. **Run the setup script** (or set manually via dashboard)
2. **Set secret variables manually** (ANTHROPIC_API_KEY, OPENAI_API_KEY, etc.)
3. **Delete redundant variables** from the dashboard
4. **Verify** all variables are set for Production + Preview + Development
5. **Redeploy** - Vercel will auto-redeploy when you add variables

## Project Information

- **Project ID**: `prj_5xYMkgDW2DrQDwABZMoZMGpsXbBv`
- **Team ID**: `team_xohfELtiNusYTFzAbUzJ0V2R`
- **Project Name**: `skyras-v2`
- **Domains**:
  - https://skyras-v2.vercel.app
  - https://skyras-v2-travis-singletarys-projects.vercel.app
  - https://skyras-v2-git-main-travis-singletarys-projects.vercel.app

## Troubleshooting

### Script fails with "not logged in"
```bash
vercel login
```

### Script fails with "project not linked"
```bash
cd /Users/user/Sites/skyras-v2
vercel link
# Select: skyras-v2
```

### Variables not appearing after setting
- Wait a few seconds for Vercel to sync
- Check the correct environment (Production/Preview/Development)
- Ensure you're viewing the correct project

## Files Created

- `scripts/set-vercel-env.mjs` - Node.js script to set environment variables
- `scripts/set-vercel-env.sh` - Bash script alternative
- `VERCEL_ENV_CHECKLIST.md` - Complete checklist of all variables
- `VERCEL_ENV_SETUP.md` - This file


