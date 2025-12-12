-- ============================================================================
-- RELAX RLS POLICIES FOR DEVELOPMENT
-- ============================================================================
-- This migration relaxes Row-Level Security policies to allow any user_id
-- This is suitable for development/testing or single-user applications
-- For multi-user production, implement Supabase Auth instead
-- ============================================================================

-- ============================================================================
-- PROJECTS TABLE - Allow all operations with any user_id
-- ============================================================================

-- Drop existing policies
drop policy if exists "Users can view their own projects" on public.projects;
drop policy if exists "Users can insert their own projects" on public.projects;
drop policy if exists "Users can update their own projects" on public.projects;
drop policy if exists "Users can delete their own projects" on public.projects;

-- Create permissive policies (allow any user_id)
create policy "Allow all to view projects"
  on public.projects for select
  using (true);

create policy "Allow all to insert projects"
  on public.projects for insert
  with check (true);

create policy "Allow all to update projects"
  on public.projects for update
  using (true);

create policy "Allow all to delete projects"
  on public.projects for delete
  using (true);

-- ============================================================================
-- FILES TABLE - Allow all operations with any user_id
-- ============================================================================

-- Drop existing policies
drop policy if exists "Users can view their own files" on public.files;
drop policy if exists "Users can insert their own files" on public.files;
drop policy if exists "Users can update their own files" on public.files;
drop policy if exists "Users can delete their own files" on public.files;

-- Create permissive policies
create policy "Allow all to view files"
  on public.files for select
  using (true);

create policy "Allow all to insert files"
  on public.files for insert
  with check (true);

create policy "Allow all to update files"
  on public.files for update
  using (true);

create policy "Allow all to delete files"
  on public.files for delete
  using (true);

-- ============================================================================
-- WORKFLOWS TABLE - Allow all operations with any user_id
-- ============================================================================

-- Drop existing policies
drop policy if exists "Users can view their own workflows" on public.workflows;
drop policy if exists "Users can insert their own workflows" on public.workflows;
drop policy if exists "Users can update their own workflows" on public.workflows;
drop policy if exists "Users can delete their own workflows" on public.workflows;

-- Create permissive policies
create policy "Allow all to view workflows"
  on public.workflows for select
  using (true);

create policy "Allow all to insert workflows"
  on public.workflows for insert
  with check (true);

create policy "Allow all to update workflows"
  on public.workflows for update
  using (true);

create policy "Allow all to delete workflows"
  on public.workflows for delete
  using (true);

-- ============================================================================
-- WORKFLOW_TASKS TABLE - Allow all operations
-- ============================================================================

-- Drop existing policies
drop policy if exists "Users can view tasks for their workflows" on public.workflow_tasks;
drop policy if exists "Users can insert tasks for their workflows" on public.workflow_tasks;
drop policy if exists "Users can update tasks for their workflows" on public.workflow_tasks;
drop policy if exists "Users can delete tasks for their workflows" on public.workflow_tasks;

-- Create permissive policies
create policy "Allow all to view tasks"
  on public.workflow_tasks for select
  using (true);

create policy "Allow all to insert tasks"
  on public.workflow_tasks for insert
  with check (true);

create policy "Allow all to update tasks"
  on public.workflow_tasks for update
  using (true);

create policy "Allow all to delete tasks"
  on public.workflow_tasks for delete
  using (true);

-- ============================================================================
-- FILE_PROCESSING TABLE - Allow all operations
-- ============================================================================

-- Drop existing policies
drop policy if exists "Users can view processing for their files" on public.file_processing;
drop policy if exists "Users can insert processing for their files" on public.file_processing;
drop policy if exists "Users can update processing for their files" on public.file_processing;
drop policy if exists "Users can delete processing for their files" on public.file_processing;

-- Create permissive policies
create policy "Allow all to view processing"
  on public.file_processing for select
  using (true);

create policy "Allow all to insert processing"
  on public.file_processing for insert
  with check (true);

create policy "Allow all to update processing"
  on public.file_processing for update
  using (true);

create policy "Allow all to delete processing"
  on public.file_processing for delete
  using (true);

-- ============================================================================
-- CALENDAR_EVENTS TABLE - Allow all operations
-- ============================================================================

-- Drop existing policies
drop policy if exists "Users can view their own events" on public.calendar_events;
drop policy if exists "Users can insert their own events" on public.calendar_events;
drop policy if exists "Users can update their own events" on public.calendar_events;
drop policy if exists "Users can delete their own events" on public.calendar_events;

-- Create permissive policies
create policy "Allow all to view events"
  on public.calendar_events for select
  using (true);

create policy "Allow all to insert events"
  on public.calendar_events for insert
  with check (true);

create policy "Allow all to update events"
  on public.calendar_events for update
  using (true);

create policy "Allow all to delete events"
  on public.calendar_events for delete
  using (true);

-- ============================================================================
-- NOTE: Security Considerations
-- ============================================================================
-- These permissive policies are suitable for:
-- 1. Development and testing
-- 2. Single-user applications
-- 3. Internal tools with trusted users
--
-- For production multi-user applications:
-- 1. Implement Supabase Auth (recommended)
-- 2. Use service role key for server-side operations
-- 3. Restore user-specific RLS policies
-- ============================================================================
