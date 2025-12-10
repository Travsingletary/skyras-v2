# Supabase Migration Guide

## Quick Start - Apply Database Schema

### Step 1: Access Supabase SQL Editor

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `zzxedixpbvivpsnztjsc`
3. Click **SQL Editor** in the left sidebar
4. Click **+ New query**

### Step 2: Run Migration 0002

1. Open `/frontend/supabase/migrations/0002_core_schema.sql`
2. Copy the entire SQL file
3. Paste into Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

### Step 3: Verify Tables Created

After running, verify tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

You should see:
- `calendar_events`
- `file_processing`
- `files`
- `image_generation_logs` (from migration 0001)
- `projects`
- `workflow_tasks`
- `workflows`

### Step 4: Test RLS Policies

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

All tables should have `rowsecurity = true`.

## Database Schema Overview

### Tables Created

1. **projects** - User projects (albums, releases, campaigns)
   - Tracks project metadata, status, and type
   - Links to files and workflows

2. **files** - Uploaded file metadata
   - Stores file details, storage paths, public URLs
   - Tracks processing status
   - Links to Supabase Storage

3. **workflows** - Marcus workflow plans
   - Stores complete workflow plans
   - Tracks progress (total/completed tasks)
   - Links to projects

4. **workflow_tasks** - Individual tasks within workflows
   - Ordered task list with status tracking
   - Optional due dates for calendar integration
   - Links to calendar events

5. **file_processing** - Agent processing results
   - Tracks processing by specialist agents (Cassidy, Letitia, etc.)
   - Stores structured results
   - Links to files

6. **calendar_events** - Calendar sync data
   - Stores external calendar event IDs
   - Tracks sync status
   - Links to workflow tasks

### Key Features

- **Auto-updating timestamps**: All tables have `updated_at` that auto-updates
- **Row Level Security (RLS)**: All tables protected with user-based access
- **Cascading deletes**: Deleting a project deletes its workflows and tasks
- **Flexible metadata**: All tables have `jsonb` metadata field
- **Search optimization**: Projects table has full-text search vector

## Troubleshooting

### Error: "permission denied for table"
- RLS policies are active
- Make sure to log in as authenticated user in frontend
- Or use `user_id = 'public'` for testing

### Error: "relation already exists"
- Migration already ran
- Check existing tables with schema query above
- If needed, drop tables and re-run:
  ```sql
  DROP TABLE IF EXISTS public.calendar_events CASCADE;
  DROP TABLE IF EXISTS public.file_processing CASCADE;
  DROP TABLE IF EXISTS public.workflow_tasks CASCADE;
  DROP TABLE IF EXISTS public.workflows CASCADE;
  DROP TABLE IF EXISTS public.files CASCADE;
  DROP TABLE IF EXISTS public.projects CASCADE;
  ```

### Error: "function update_updated_at_column already exists"
- Function was already created
- Safe to ignore this error
- Or use `CREATE OR REPLACE FUNCTION` instead

## Next Steps

After migration:
1. ✅ Database schema created
2. 🔄 Create TypeScript types
3. 🔄 Build API routes for CRUD operations
4. 🔄 Integrate with file upload flow
5. 🔄 Connect Marcus to workflows table
6. 🔄 Build calendar sync
7. 🔄 Build analytics dashboard
