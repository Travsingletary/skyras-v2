# Critical Issues & Solutions

**Date:** 2025-01-28  
**Status:** 🔴 **CRITICAL** - Core functionality broken

## Problems Identified

### 1. File Upload - Still Broken
**Error:** `Request Entity Too Large FUNCTION_PAYLOAD_TOO_LARGE`

**Root Cause:**
- `/api/uploads/sign` endpoint exists but may be failing
- Supabase `createSignedUploadUrl` method may not exist or work as expected
- Error suggests the sign endpoint itself is hitting Vercel limits (unlikely but possible)

**Current Flow:**
1. Client calls `/api/uploads/sign` → Should return signed URL
2. Client uploads to Supabase Storage directly
3. Client calls `/api/uploads/confirm` → Saves metadata

**Issue:** Step 1 might be failing or the signed URL method is wrong

### 2. Chat Has No Logic / Not Fluid
**Problems:**
- No streaming responses (blocking request/response)
- Chat waits for full response before showing anything
- No progressive message delivery
- Response handling is inconsistent across pages

**Current Flow:**
1. User sends message
2. Frontend waits for full response
3. Response arrives as JSON
4. Message appears all at once

**Issue:** No real-time feel, no streaming, feels slow and unresponsive

### 3. Chat Response Handling Inconsistent
**Problems:**
- Studio page checks `data.data?.message`
- App page checks `data.response || data.data?.output`
- Home page checks `data.data?.output || data.response`
- Different pages extract response differently

**Issue:** Fragile, error-prone, confusing

## Proposed Solutions

### Solution 1: Fix Upload (Simplest Path)
**Option A: Use Supabase Storage JS Client Directly**
- Skip signed URLs entirely
- Use Supabase JS client in browser with anon key
- Upload directly from client
- Only call API to save metadata

**Option B: Fix Signed URL Method**
- Check if `createSignedUploadUrl` exists in Supabase JS
- If not, use `createSignedUrl` with PUT method
- Or use Supabase Storage REST API directly

### Solution 2: Simplify Chat Response
**Unified Response Format:**
```typescript
{
  success: boolean;
  message: string; // Always the response text here
  conversationId?: string;
  error?: string;
}
```

**All pages extract from `data.message` - one place, consistent**

### Solution 3: Add Streaming (Future)
**For now:** Keep blocking but make it feel faster
- Show typing indicator immediately
- Clear input immediately
- Show response as soon as it arrives

**Later:** Implement Server-Sent Events (SSE) for true streaming

## Immediate Action Plan

1. **Fix upload method** - Use direct Supabase client or fix signed URL
2. **Unify chat response handling** - One format, one extraction point
3. **Improve UX** - Typing indicators, immediate feedback
4. **Test end-to-end** - One working flow before adding complexity

## Files to Fix

1. `frontend/src/app/api/uploads/sign/route.ts` - Check/create signed URL method
2. `frontend/src/app/studio/page.tsx` - Unified response handling
3. `frontend/src/app/app/page.tsx` - Unified response handling  
4. `frontend/src/app/page.tsx` - Unified response handling
5. `frontend/src/app/api/chat/route.ts` - Ensure consistent response format
