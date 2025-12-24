# Logging Audit - SkyRas v2

**Last Updated:** 2025-01-23  
**Deployment:** `dpl_3zY2uKoQfRYZ6SFcdfj9d39frmdZ` (READY)

## Overview

This document catalogs all logging points in the application that appear in Vercel function logs. Use this to debug issues and verify system behavior.

## Build Logs ✅

**Status:** All builds successful  
**Latest Build:** Completed in 18s, no errors

### Build Output Verification
- ✅ All API routes compiled successfully
- ✅ `/api/voice/tts` route present in build
- ✅ No TypeScript errors
- ✅ No linting errors

## Runtime Logs (Vercel Function Logs)

### Critical API Routes

#### 1. `/api/chat` - Marcus Chat Endpoint
**File:** `frontend/src/app/api/chat/route.ts`

**Logs:**
- `[/api/chat] Error:` - Any errors during chat processing

**What to Check:**
- User ID validation errors
- Message format errors
- Marcus agent execution failures

**Expected Behavior:**
- Returns `{ success: true, response: "...", ... }`
- Response includes `ROUTE_OK:` prefix when routing to Giorgio

---

#### 2. `/api/voice/tts` - Text-to-Speech
**File:** `frontend/src/app/api/voice/tts/route.ts`

**Logs:**
- `[TTS] No TTS provider available` - Warning when no provider configured
- `[TTS] Using provider: <name>` - Shows which provider is active
- `[TTS] Cost per 1000 chars: $<amount>` - Cost calculation
- `[TTS] Error:` - Any errors during TTS generation

**What to Check:**
- Provider availability (OPENAI_API_KEY or ELEVENLABS_API_KEY)
- Cost calculations
- Audio generation failures

**Expected Behavior:**
- Returns audio/mpeg stream with headers
- Headers include: `X-TTS-Provider`, `X-TTS-Cost-Per-1K`

---

#### 3. `/api/speech-to-text` - Speech Recognition
**File:** `frontend/src/app/api/speech-to-text/route.ts`

**Logs:**
- `[STT] OpenAI Whisper error:` - Whisper API errors
- `[STT] Transcription complete: "<text>..."` - Successful transcription
- `[STT] Error processing audio:` - General processing errors

**What to Check:**
- OpenAI API key availability
- Audio format validation
- Transcription accuracy

**Expected Behavior:**
- Returns `{ success: true, transcript: "...", duration: <seconds> }`

---

#### 4. `/api/upload` - File Upload
**File:** `frontend/src/app/api/upload/route.ts`

**Logs:**
- `[Upload] Supabase storage not configured` - Warning when storage unavailable
- `Error saving file <name>:` - File save failures

**What to Check:**
- Supabase storage configuration
- File validation (type, size, count)
- Storage bucket access

**Expected Behavior:**
- Returns `{ success: true, files: [...], ... }`
- Files saved to Supabase Storage bucket `user-uploads`

---

#### 5. `/api/uploads/sign` - Signed URL Generation
**File:** `frontend/src/app/api/uploads/sign/route.ts`

**Logs:**
- `[Sign] Supabase credentials not configured (SUPABASE_URL / SERVICE_ROLE_KEY / SECRET_KEY)` - Missing credentials

**What to Check:**
- SUPABASE_URL environment variable
- SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY
- URL signing success/failure

---

#### 6. `/api/uploads/confirm` - Upload Confirmation
**File:** `frontend/src/app/api/uploads/confirm/route.ts`

**Logs:**
- (No explicit logging, but errors would appear in Vercel logs)

**What to Check:**
- File ID validation
- Database record creation
- Supabase client initialization

---

### Agent Logs

#### Marcus Agent - Proof Tracking
**File:** `src/agents/marcus/marcusAgent.ts`

**Logs:**
- `ROUTE_OK agent=giorgio action=<action> project=<project>` - Server-side routing proof
- `[PROOF] Adding prefix to output...` - Prefix addition tracking
- `[PROOF] Constructed proof prefix from delegation...` - Prefix construction
- `[PROOF] Wrapped output BEFORE fix...` - Pre-fix state
- `[PROOF] FORCED prefix to start...` - Prefix enforcement
- `[PROOF] Final output length: <n>, Contains ROUTE_OK: <bool>` - Final verification
- `[PROOF] WARNING: No giorgio delegation found!` - Missing delegation warning

**What to Check:**
- Routing decisions (Marcus → Giorgio)
- Proof prefix preservation through AI wrapping
- Delegation tracking

**Expected Behavior:**
- All Giorgio delegations should produce `ROUTE_OK:` prefix
- Prefix should appear in final user-visible response
- Server logs should show `ROUTE_OK agent=giorgio action=...`

---

### Image Generation Logs

#### Image Provider Router
**File:** `src/backend/imageProviders/router.ts`

**Logs:**
- `Runway image generation not available: <error>` - Runway fallback warning

**What to Check:**
- Provider priority order (runway → stable-diffusion)
- Fallback behavior
- Error aggregation

---

## Log Access Methods

### 1. Vercel Dashboard
- Go to: https://vercel.com/travis-singletarys-projects/skyras-v2
- Navigate to: Deployments → Latest → Functions → View Logs
- Filter by: Function name, time range, log level

### 2. Vercel CLI
```bash
vercel logs skyras-v2 --follow
```

### 3. Vercel MCP (Limited)
- Can view build logs
- Runtime logs require dashboard access

## Common Log Patterns to Monitor

### ✅ Success Patterns
- `[TTS] Using provider: openai`
- `[STT] Transcription complete: "..."`
- `ROUTE_OK agent=giorgio action=script_outline`
- `[PROOF] Final output starts with: ROUTE_OK: Marcus→Giorgio | FLOW_OK:`

### ⚠️ Warning Patterns
- `[TTS] No TTS provider available`
- `[Upload] Supabase storage not configured`
- `[PROOF] WARNING: No giorgio delegation found!`
- `Runway image generation not available`

### ❌ Error Patterns
- `[/api/chat] Error:`
- `[TTS] Error:`
- `[STT] Error processing audio:`
- `Error saving file <name>:`

## Environment Variables Required for Logging Context

These variables affect what logs appear:

- `OPENAI_API_KEY` - Required for TTS and STT
- `ELEVENLABS_API_KEY` - Optional for premium TTS
- `SUPABASE_URL` - Required for storage operations
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY` - Required for storage
- `ANTHROPIC_API_KEY` - Required for Marcus AI wrapping (affects proof prefix behavior)

## Debugging Checklist

When investigating issues:

1. **Check Build Logs** ✅
   - Verify latest deployment built successfully
   - Confirm all routes are present

2. **Check Runtime Logs** (Vercel Dashboard)
   - Filter by function name (e.g., `/api/chat`)
   - Look for error patterns
   - Verify proof logs for routing

3. **Check Environment Variables**
   - Verify all required vars are set
   - Check for typos in var names
   - Confirm values are not placeholders

4. **Check Specific Endpoints**
   - `/api/chat` - Marcus responses
   - `/api/voice/tts` - TTS functionality
   - `/api/speech-to-text` - STT functionality
   - `/api/upload` - File uploads

5. **Verify Proof Signals**
   - Look for `ROUTE_OK:` in user responses
   - Check server logs for `ROUTE_OK agent=giorgio`
   - Confirm prefix preservation through AI wrapping

## Notes

- **Proof Prefix Logging:** Extensive logging added to track `ROUTE_OK:` prefix through the system. If prefix is missing, check `[PROOF]` logs.
- **TTS Route:** Recently added to frontend (`frontend/src/app/api/voice/tts/route.ts`). Previously missing, causing 405 errors.
- **Studio Plans Table:** Removed references to non-existent `studio_plans` table. No longer logs errors.

## Next Steps

1. Monitor Vercel function logs for error patterns
2. Verify proof prefix appears in production responses
3. Check TTS/STT functionality with actual API calls
4. Monitor upload functionality for storage errors

