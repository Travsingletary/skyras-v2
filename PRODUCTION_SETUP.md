# Production Setup Guide

## System Status ✅

All core features are working:
- ✅ File upload to Supabase Storage
- ✅ Database metadata storage
- ✅ Auto-processing (files routed to agents)
- ✅ Workflow suggestions
- ✅ Analytics dashboard
- ✅ Complete API (Projects, Files, Workflows, Tasks)

## Current Limitation: Row-Level Security

### The Issue

The database uses Row-Level Security (RLS) policies that currently only allow:
1. **Authenticated Supabase users** (`auth.uid()`)
2. **Public access** (`user_id = 'public'`)

This means custom `userId` values (like `user_123`) are blocked.

### Solutions for Production

#### Option 1: Service Role Key (Recommended for Server-Side)

Use Supabase's **service role key** for API routes to bypass RLS entirely.

**Setup:**
1. Get service role key from Supabase Dashboard:
   - Visit: https://supabase.com/dashboard/project/zzxedixpbvivpsnztjsc/settings/api
   - Copy the **service_role** key (⚠️ Keep secret! Server-side only!)

2. Add to `/frontend/.env.local`:
   ```env
   # Service role key for server-side operations (bypasses RLS)
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```

3. Update `/frontend/src/backend/supabaseClient.ts`:
   ```typescript
   export function getSupabaseClient(): SupabaseClientLike {
     const url = process.env.SUPABASE_URL;
     const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
     // ... rest of code
   }
   ```

**Pros:**
- ✅ Bypasses RLS for server-side operations
- ✅ No RLS policy changes needed
- ✅ Most secure (service key never exposed to client)

**Cons:**
- ⚠️ Service key has full database access (must keep secret)

#### Option 2: Implement Supabase Auth (Recommended for Client-Side)

Use real Supabase authentication for users.

**Setup:**
1. Enable auth providers in Supabase Dashboard
2. Implement sign-up/login in your app
3. Use authenticated user's `auth.uid()` as `user_id`

**Pros:**
- ✅ Proper user authentication
- ✅ Works with existing RLS policies
- ✅ Secure by design

**Cons:**
- ⏱️ Requires authentication implementation

#### Option 3: Relax RLS Policies (NOT Recommended)

Modify RLS policies to allow any `user_id`.

⚠️ **Security Risk:** Anyone can read/write any user's data if they know the userId.

Only use this for **development/testing**, not production.

## Testing the System

### 1. Test File Upload

```bash
# With userId="public" (works now)
curl -X POST http://localhost:4000/api/upload \
  -F "files=@song.mp3;type=audio/mpeg" \
  -F "userId=public"

# Response includes:
# - fileIds: Uploaded file IDs
# - files: File metadata with URLs
# - processingCount: Auto-created processing jobs
# - workflowSuggestions: Recommended workflows
```

### 2. Test Analytics Dashboard

Visit: http://localhost:4000/analytics

Or API:
```bash
curl "http://localhost:4000/api/analytics?userId=public"
```

### 3. Test in Studio Page

1. Visit: http://localhost:4000/studio
2. Click "📎 Attach Files"
3. Select audio/video/image file
4. Click Send
5. See FilePreview component show uploaded file
6. See WorkflowSuggestions appear
7. Click "📊 Analytics" button to view stats

## File Processing Flow

1. **Upload** → File saved to Supabase Storage (`user-uploads` bucket)
2. **Database** → Metadata stored in `files` table
3. **Auto-Processing** → Processing records created based on file type:
   - 🎵 Audio → Cassidy (licensing check)
   - 🖼️ Images → Letitia (cataloging)
   - 🎬 Videos → Giorgio (script generation) + Letitia (cataloging)
4. **Workflow Suggestions** → UI displays recommended workflows
5. **Analytics** → Stats update in real-time

## Agent Routing

| File Type | Agents | Processing Type |
|-----------|--------|----------------|
| Audio (.mp3, .wav, etc.) | Cassidy | Licensing |
| Images (.jpg, .png, etc.) | Letitia | Cataloging |
| Videos (.mp4, .mov, etc.) | Giorgio + Letitia | Script Gen + Cataloging |
| Documents (.pdf, .txt) | None | Manual workflow |

## Database Schema

- **projects** - Albums, singles, campaigns
- **files** - Uploaded file metadata
- **workflows** - Workflow plans (licensing, distribution, etc.)
- **workflow_tasks** - Individual tasks within workflows
- **file_processing** - Processing jobs for agents
- **calendar_events** - Scheduled events

All tables have RLS policies based on `user_id` field.

## Environment Variables

Required in `/frontend/.env.local`:

```env
# Anthropic API
ANTHROPIC_API_KEY=sk-ant-...

# Supabase (server-side)
SUPABASE_URL=https://zzxedixpbvivpsnztjsc.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Optional: for bypassing RLS

# Supabase (client-side)
NEXT_PUBLIC_SUPABASE_URL=https://zzxedixpbvivpsnztjsc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

## Next Steps

1. ✅ Test file upload with real audio/video files
2. ✅ Verify analytics dashboard shows correct stats
3. ⏳ Decide on authentication strategy (Service Role Key vs Supabase Auth)
4. ⏳ Implement agent processing (Marcus, Cassidy, Letitia, Giorgio, Jamal)
5. ⏳ Add workflow execution logic
6. ⏳ Deploy to production

## Support

- Supabase Dashboard: https://supabase.com/dashboard/project/zzxedixpbvivpsnztjsc
- Storage Bucket: https://supabase.com/dashboard/project/zzxedixpbvivpsnztjsc/storage/buckets/user-uploads
- Database: https://supabase.com/dashboard/project/zzxedixpbvivpsnztjsc/editor

---

**Built with:** Next.js 14, Supabase, TypeScript, Claude AI
