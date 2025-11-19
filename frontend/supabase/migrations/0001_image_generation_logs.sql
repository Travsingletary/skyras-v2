-- image_generation_logs table for logging SDXL pipeline usage
create table if not exists public.image_generation_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  project_id text,
  agent_name text,
  action text not null,                     -- "create" | "edit"
  prompt text not null,
  style text,
  size text,
  provider text not null,
  model text not null,
  source_image text,
  strength numeric,
  file_url text not null,
  cost_estimate numeric
);

create index if not exists idx_image_generation_logs_project on public.image_generation_logs(project_id);
create index if not exists idx_image_generation_logs_action on public.image_generation_logs(action);
create index if not exists idx_image_generation_logs_created_at on public.image_generation_logs(created_at);
