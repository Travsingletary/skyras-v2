-- Core schema for SkyRas v2: Projects, Files, Workflows, and Tasks
-- Migration 0002

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================
-- Stores user projects (albums, releases, campaigns, etc.)
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Project identification
  user_id text not null,                        -- User who owns the project
  name text not null,                           -- Project name (e.g., "Summer Album 2025")
  type text not null,                           -- "album" | "single" | "campaign" | "client_work"
  status text not null default 'active',        -- "active" | "archived" | "completed"

  -- Project details
  description text,                             -- Optional project description
  metadata jsonb default '{}'::jsonb,           -- Flexible metadata (genre, release_date, etc.)

  -- Search optimization
  search_vector tsvector
);

create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_projects_status on public.projects(status);
create index if not exists idx_projects_type on public.projects(type);
create index if not exists idx_projects_created_at on public.projects(created_at desc);
create index if not exists idx_projects_search on public.projects using gin(search_vector);

-- Auto-update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_projects_updated_at before update on public.projects
  for each row execute function update_updated_at_column();

-- ============================================================================
-- FILES TABLE
-- ============================================================================
-- Stores metadata for uploaded files (actual files in Supabase Storage)
create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- File identification
  user_id text not null,                        -- User who uploaded the file
  project_id uuid references public.projects(id) on delete set null,

  -- File details
  original_name text not null,                  -- Original filename
  storage_path text not null unique,            -- Supabase Storage path
  public_url text not null,                     -- Public URL for accessing file

  -- File metadata
  file_type text not null,                      -- MIME type (audio/mpeg, video/mp4, etc.)
  file_size bigint not null,                    -- Size in bytes
  file_extension text not null,                 -- Extension (.mp3, .mp4, etc.)

  -- Processing status
  processing_status text not null default 'pending',  -- "pending" | "processing" | "completed" | "failed"
  processing_results jsonb default '{}'::jsonb, -- Results from agents (licensing, cataloging, etc.)

  -- Additional metadata
  metadata jsonb default '{}'::jsonb            -- Flexible metadata (duration, dimensions, etc.)
);

create index if not exists idx_files_user_id on public.files(user_id);
create index if not exists idx_files_project_id on public.files(project_id);
create index if not exists idx_files_storage_path on public.files(storage_path);
create index if not exists idx_files_processing_status on public.files(processing_status);
create index if not exists idx_files_created_at on public.files(created_at desc);

create trigger update_files_updated_at before update on public.files
  for each row execute function update_updated_at_column();

-- ============================================================================
-- WORKFLOWS TABLE
-- ============================================================================
-- Stores Marcus workflow plans
create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Workflow identification
  user_id text not null,                        -- User who owns the workflow
  project_id uuid references public.projects(id) on delete cascade,

  -- Workflow details
  name text not null,                           -- Workflow name
  type text not null,                           -- "licensing" | "creative" | "distribution" | "cataloging" | "custom"
  status text not null default 'active',        -- "active" | "completed" | "paused" | "cancelled"

  -- Workflow plan
  plan_markdown text,                           -- Full workflow plan in markdown
  summary text,                                 -- Brief summary

  -- Agent that created it
  agent_name text not null default 'marcus',    -- "marcus" | "giorgio" | "cassidy" | "jamal" | "letitia"

  -- Progress tracking
  total_tasks integer not null default 0,
  completed_tasks integer not null default 0,

  -- Metadata
  metadata jsonb default '{}'::jsonb            -- Flexible metadata
);

create index if not exists idx_workflows_user_id on public.workflows(user_id);
create index if not exists idx_workflows_project_id on public.workflows(project_id);
create index if not exists idx_workflows_status on public.workflows(status);
create index if not exists idx_workflows_type on public.workflows(type);
create index if not exists idx_workflows_created_at on public.workflows(created_at desc);

create trigger update_workflows_updated_at before update on public.workflows
  for each row execute function update_updated_at_column();

-- ============================================================================
-- WORKFLOW_TASKS TABLE
-- ============================================================================
-- Individual tasks within workflows
create table if not exists public.workflow_tasks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Task identification
  workflow_id uuid not null references public.workflows(id) on delete cascade,

  -- Task details
  title text not null,                          -- Task title
  description text,                             -- Task description
  status text not null default 'pending',       -- "pending" | "in_progress" | "completed" | "skipped"

  -- Task ordering and scheduling
  position integer not null default 0,          -- Order in workflow
  due_date timestamptz,                         -- Optional due date
  completed_at timestamptz,                     -- When task was completed

  -- Calendar integration
  calendar_event_id text,                       -- Google Calendar event ID

  -- Metadata
  metadata jsonb default '{}'::jsonb            -- Flexible metadata
);

create index if not exists idx_workflow_tasks_workflow_id on public.workflow_tasks(workflow_id);
create index if not exists idx_workflow_tasks_status on public.workflow_tasks(status);
create index if not exists idx_workflow_tasks_position on public.workflow_tasks(workflow_id, position);
create index if not exists idx_workflow_tasks_due_date on public.workflow_tasks(due_date);

create trigger update_workflow_tasks_updated_at before update on public.workflow_tasks
  for each row execute function update_updated_at_column();

-- ============================================================================
-- FILE_PROCESSING TABLE
-- ============================================================================
-- Track file processing by specialist agents
create table if not exists public.file_processing (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Processing identification
  file_id uuid not null references public.files(id) on delete cascade,
  agent_name text not null,                     -- "cassidy" | "letitia" | "giorgio" | "jamal"
  processing_type text not null,                -- "licensing" | "cataloging" | "script_gen" | "distribution"

  -- Processing status
  status text not null default 'pending',       -- "pending" | "processing" | "completed" | "failed"

  -- Processing results
  results jsonb default '{}'::jsonb,            -- Structured results from agent
  error_message text,                           -- Error message if failed

  -- Metadata
  metadata jsonb default '{}'::jsonb            -- Additional processing metadata
);

create index if not exists idx_file_processing_file_id on public.file_processing(file_id);
create index if not exists idx_file_processing_agent_name on public.file_processing(agent_name);
create index if not exists idx_file_processing_status on public.file_processing(status);
create index if not exists idx_file_processing_created_at on public.file_processing(created_at desc);

create trigger update_file_processing_updated_at before update on public.file_processing
  for each row execute function update_updated_at_column();

-- ============================================================================
-- CALENDAR_EVENTS TABLE
-- ============================================================================
-- Store calendar sync data for workflow tasks
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Event identification
  user_id text not null,                        -- User who owns the event
  task_id uuid references public.workflow_tasks(id) on delete cascade,

  -- Calendar provider details
  provider text not null default 'google',      -- "google" | "outlook" | "apple"
  external_event_id text not null,              -- Calendar provider's event ID

  -- Event details
  title text not null,
  description text,
  start_time timestamptz not null,
  end_time timestamptz not null,

  -- Sync status
  sync_status text not null default 'synced',   -- "synced" | "pending" | "failed"
  last_synced_at timestamptz default now(),

  -- Metadata
  metadata jsonb default '{}'::jsonb
);

create index if not exists idx_calendar_events_user_id on public.calendar_events(user_id);
create index if not exists idx_calendar_events_task_id on public.calendar_events(task_id);
create index if not exists idx_calendar_events_external_id on public.calendar_events(external_event_id);
create index if not exists idx_calendar_events_start_time on public.calendar_events(start_time);

create trigger update_calendar_events_updated_at before update on public.calendar_events
  for each row execute function update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Enable RLS on all tables
alter table public.projects enable row level security;
alter table public.files enable row level security;
alter table public.workflows enable row level security;
alter table public.workflow_tasks enable row level security;
alter table public.file_processing enable row level security;
alter table public.calendar_events enable row level security;

-- Projects: Users can only access their own projects
create policy "Users can view their own projects"
  on public.projects for select
  using (auth.uid()::text = user_id or user_id = 'public');

create policy "Users can insert their own projects"
  on public.projects for insert
  with check (auth.uid()::text = user_id or user_id = 'public');

create policy "Users can update their own projects"
  on public.projects for update
  using (auth.uid()::text = user_id or user_id = 'public');

create policy "Users can delete their own projects"
  on public.projects for delete
  using (auth.uid()::text = user_id or user_id = 'public');

-- Files: Users can only access their own files
create policy "Users can view their own files"
  on public.files for select
  using (auth.uid()::text = user_id or user_id = 'public');

create policy "Users can insert their own files"
  on public.files for insert
  with check (auth.uid()::text = user_id or user_id = 'public');

create policy "Users can update their own files"
  on public.files for update
  using (auth.uid()::text = user_id or user_id = 'public');

create policy "Users can delete their own files"
  on public.files for delete
  using (auth.uid()::text = user_id or user_id = 'public');

-- Workflows: Users can only access their own workflows
create policy "Users can view their own workflows"
  on public.workflows for select
  using (auth.uid()::text = user_id or user_id = 'public');

create policy "Users can insert their own workflows"
  on public.workflows for insert
  with check (auth.uid()::text = user_id or user_id = 'public');

create policy "Users can update their own workflows"
  on public.workflows for update
  using (auth.uid()::text = user_id or user_id = 'public');

create policy "Users can delete their own workflows"
  on public.workflows for delete
  using (auth.uid()::text = user_id or user_id = 'public');

-- Workflow Tasks: Access through parent workflow
create policy "Users can view tasks in their workflows"
  on public.workflow_tasks for select
  using (
    exists (
      select 1 from public.workflows
      where workflows.id = workflow_tasks.workflow_id
      and (workflows.user_id = auth.uid()::text or workflows.user_id = 'public')
    )
  );

create policy "Users can insert tasks in their workflows"
  on public.workflow_tasks for insert
  with check (
    exists (
      select 1 from public.workflows
      where workflows.id = workflow_tasks.workflow_id
      and (workflows.user_id = auth.uid()::text or workflows.user_id = 'public')
    )
  );

create policy "Users can update tasks in their workflows"
  on public.workflow_tasks for update
  using (
    exists (
      select 1 from public.workflows
      where workflows.id = workflow_tasks.workflow_id
      and (workflows.user_id = auth.uid()::text or workflows.user_id = 'public')
    )
  );

create policy "Users can delete tasks in their workflows"
  on public.workflow_tasks for delete
  using (
    exists (
      select 1 from public.workflows
      where workflows.id = workflow_tasks.workflow_id
      and (workflows.user_id = auth.uid()::text or workflows.user_id = 'public')
    )
  );

-- File Processing: Access through parent file
create policy "Users can view processing for their files"
  on public.file_processing for select
  using (
    exists (
      select 1 from public.files
      where files.id = file_processing.file_id
      and (files.user_id = auth.uid()::text or files.user_id = 'public')
    )
  );

create policy "Users can insert processing for their files"
  on public.file_processing for insert
  with check (
    exists (
      select 1 from public.files
      where files.id = file_processing.file_id
      and (files.user_id = auth.uid()::text or files.user_id = 'public')
    )
  );

create policy "Users can update processing for their files"
  on public.file_processing for update
  using (
    exists (
      select 1 from public.files
      where files.id = file_processing.file_id
      and (files.user_id = auth.uid()::text or files.user_id = 'public')
    )
  );

-- Calendar Events: Users can only access their own events
create policy "Users can view their own calendar events"
  on public.calendar_events for select
  using (auth.uid()::text = user_id or user_id = 'public');

create policy "Users can insert their own calendar events"
  on public.calendar_events for insert
  with check (auth.uid()::text = user_id or user_id = 'public');

create policy "Users can update their own calendar events"
  on public.calendar_events for update
  using (auth.uid()::text = user_id or user_id = 'public');

create policy "Users can delete their own calendar events"
  on public.calendar_events for delete
  using (auth.uid()::text = user_id or user_id = 'public');
