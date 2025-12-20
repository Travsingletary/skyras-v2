# OpenAI Whisper Speech-to-Text Implementation

## Overview

Replaced the unreliable Web Speech API with **OpenAI Whisper** for speech-to-text transcription. The implementation uses:
- **MediaRecorder API** for browser-based audio capture
- **OpenAI Whisper API** for accurate transcription
- **Supabase Storage** (optional) for persisting audio files

---

## Files Created/Modified

### Created Files
1. **`frontend/src/app/api/speech-to-text/route.ts`**
   - Backend API endpoint for transcription
   - Supports two input methods:
     - **FormData** (legacy): Direct audio blob upload
     - **JSON with `storagePath`** (preferred): Fetch from Supabase Storage

### Modified Files
1. **`frontend/src/app/app/page.tsx`**
   - Replaced Web Speech API with MediaRecorder
   - Added audio capture, chunking, and transcription flow
   - Added cleanup on component unmount

---

## Architecture

### Current Flow (FormData - Legacy)
```
User clicks 🎙
  ↓
MediaRecorder captures audio
  ↓
Audio chunks collected
  ↓
User clicks 🎙 again (stop)
  ↓
Audio blob created from chunks
  ↓
POST /api/speech-to-text (FormData)
  ↓
Backend sends to OpenAI Whisper API
  ↓
Transcript returned
  ↓
Auto-filled in input field
  ↓
Auto-sent as message
```

### Future Flow (StoragePath - Preferred)
```
User clicks 🎙
  ↓
MediaRecorder captures audio
  ↓
Audio uploaded to Supabase Storage
  ↓
Storage path returned
  ↓
POST /api/speech-to-text (JSON with storagePath)
  ↓
Backend fetches from Supabase Storage
  ↓
Backend sends to OpenAI Whisper API
  ↓
Transcript returned
  ↓
Auto-filled and sent
```

---

## Environment Variables

### Required for Local Development

Create or update `/Users/user/Sites/skyras-v2/frontend/.env.local`:

```bash
# OpenAI (Required for STT)
OPENAI_API_KEY=sk-proj-...

# Supabase (Required for file uploads, optional for STT)
SUPABASE_URL=https://zzxedixpbvivpsnztjsc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
SUPABASE_ANON_KEY=eyJhbGci...

# Public Supabase (for client-side)
NEXT_PUBLIC_SUPABASE_URL=https://zzxedixpbvivpsnztjsc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# Optional: Access code
NEXT_PUBLIC_ACCESS_CODE=your-access-code-here
```

### Required for Vercel Deployment

Add the same environment variables in Vercel dashboard:
- Project Settings → Environment Variables

**Important:** 
- `OPENAI_API_KEY` is **required** for speech-to-text to work
- `SUPABASE_*` keys are required for file uploads
- Restart dev server after adding/updating `.env.local`

---

## API Endpoint Details

### POST `/api/speech-to-text`

#### Method 1: FormData (Current Implementation)
```typescript
const formData = new FormData();
formData.append('audio', audioBlob, 'recording.webm');

const response = await fetch('/api/speech-to-text', {
  method: 'POST',
  body: formData,
});
```

**Request:**
- Content-Type: `multipart/form-data`
- Body: FormData with `audio` field (File/Blob)

**Response:**
```json
{
  "success": true,
  "transcript": "Hello, this is a test"
}
```

#### Method 2: JSON with StoragePath (Future)
```typescript
const response = await fetch('/api/speech-to-text', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ storagePath: '2025-01-20/public/audio-id.webm' }),
});
```

**Request:**
- Content-Type: `application/json`
- Body: `{ "storagePath": "path/to/audio.webm" }`

**Response:** Same as Method 1

---

## Frontend Implementation Details

### Key React Refs
```typescript
const mediaRecorderRef = useRef<MediaRecorder | null>(null);
const audioChunksRef = useRef<Blob[]>([]);
const streamRef = useRef<MediaStream | null>(null);
```

### Recording Flow
1. **Start Recording:**
   - Request microphone permission
   - Create MediaRecorder with `audio/webm` or `audio/mp4`
   - Start recording, collect chunks

2. **Stop Recording:**
   - Stop MediaRecorder
   - Combine chunks into single Blob
   - Send to `/api/speech-to-text`
   - Display transcript and auto-send

3. **Cleanup:**
   - Stop all media tracks on unmount
   - Clear timeouts and refs

---

## Testing Instructions

### Local Testing

1. **Set up environment:**
   ```bash
   cd /Users/user/Sites/skyras-v2/frontend
   # Ensure .env.local exists with OPENAI_API_KEY
   ```

2. **Start dev server:**
   ```bash
   npm run dev
   ```

3. **Test voice input:**
   - Open `http://localhost:3000/app`
   - Click 🎙 button
   - Allow microphone access if prompted
   - Say something clearly (e.g., "Hello, this is a test")
   - Click 🎙 again to stop
   - Verify transcript appears in input field
   - Verify message auto-sends

4. **Check logs:**
   - Browser console for frontend logs
   - Terminal for backend logs
   - `/Users/user/Sites/skyras-v2/.cursor/debug.log` for instrumentation

### Expected Behavior

✅ **Success:**
- Microphone permission prompt appears
- Recording indicator shows (if implemented)
- Transcript appears in input field
- Message auto-sends after transcription

❌ **Common Errors:**
- `OPENAI_API_KEY not configured` → Add key to `.env.local` and restart
- `Microphone access denied` → Allow in browser settings
- `No speech detected` → Speak louder/clearer, check mic
- `Transcription failed: 401` → Invalid OpenAI API key
- `Transcription failed: 429` → Rate limit exceeded (wait and retry)

---

## Current Status

### ✅ Completed
- [x] Backend API endpoint (`/api/speech-to-text`)
- [x] MediaRecorder integration
- [x] FormData upload flow
- [x] OpenAI Whisper API integration
- [x] Error handling and logging
- [x] Cleanup on unmount
- [x] Instrumentation logs for debugging

### 🔄 In Progress / Future
- [ ] Update frontend to use `storagePath` flow (upload to Supabase first)
- [ ] Add recording indicator/visual feedback
- [ ] Add progress indicator during transcription
- [ ] Support for multiple languages
- [ ] Audio format optimization
- [ ] Retry logic for failed transcriptions

---

## Debugging

### Instrumentation Logs

All critical points are logged to `/Users/user/Sites/skyras-v2/.cursor/debug.log`:

- `startRecording entry` - Recording started
- `MediaRecorder check` - Browser support check
- `Microphone access granted` - Permission granted
- `Recording started` - MediaRecorder active
- `MediaRecorder stopped` - Recording stopped
- `Before transcription API call` - Audio blob ready
- `Transcription API response` - Backend response
- `Transcription success` - Transcript received
- `Transcription error` - Any errors

### Common Issues

**Issue:** "OPENAI_API_KEY not configured"
- **Fix:** Add `OPENAI_API_KEY` to `frontend/.env.local` and restart dev server

**Issue:** "Microphone access denied"
- **Fix:** Allow microphone in browser settings (Chrome: Settings → Privacy → Site Settings → Microphone)

**Issue:** "No speech detected"
- **Fix:** Speak louder, check microphone is working, ensure quiet environment

**Issue:** "Transcription failed: 401"
- **Fix:** Verify OpenAI API key is valid and has credits

**Issue:** "Transcription failed: 429"
- **Fix:** Rate limit exceeded, wait a few minutes and retry

---

## Code Locations

### Backend
- **API Route:** `frontend/src/app/api/speech-to-text/route.ts`
- **Storage Client:** `frontend/src/backend/supabaseClient.ts`

### Frontend
- **Voice Input:** `frontend/src/app/app/page.tsx` (lines ~193-400)
- **Recording Logic:** `startRecording()` and `stopRecording()` functions

---

## Dependencies

### Required Packages
- `@supabase/supabase-js` - Supabase client (already installed)
- `next` - Next.js framework (already installed)

### Browser APIs Used
- `MediaRecorder` - Audio recording
- `navigator.mediaDevices.getUserMedia()` - Microphone access
- `Blob` - Audio data handling
- `FormData` - File upload

---

## Cost Considerations

### OpenAI Whisper Pricing
- **$0.006 per minute** of audio transcribed
- Example: 1 minute audio = $0.006 (~$0.36 per hour)

### Optimization Tips
- Only transcribe when user stops recording (not continuously)
- Consider caching transcripts for repeated audio
- Use `storagePath` flow to avoid re-uploading same audio

---

## Next Steps

1. **Test the current implementation** with real audio
2. **Update frontend** to use `storagePath` flow (upload to Supabase first)
3. **Add visual feedback** (recording indicator, progress bar)
4. **Monitor costs** and optimize if needed
5. **Remove instrumentation logs** after confirming everything works

---

## Summary

✅ **What Works:**
- Audio capture via MediaRecorder
- Transcription via OpenAI Whisper
- Auto-fill and auto-send transcript
- Error handling and logging

🔄 **What's Next:**
- Switch to Supabase Storage flow for better persistence
- Add UI feedback for recording state
- Optimize for production use

---

**Last Updated:** 2025-01-20
**Status:** ✅ Ready for Testing

