-- Docs Harvester tables
create table if not exists docs_sources (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  base_url text,
  category text,
  auth_type text,
  status_page_url text,
  last_checked_at timestamp
);

create table if not exists docs_pages (
  id uuid primary key default gen_random_uuid(),
  source_name text references docs_sources(name) on delete cascade,
  title text,
  url text unique not null,
  slug text,
  hash text,
  last_seen_at timestamp
);

create table if not exists api_keys_onboarding (
  id uuid primary key default gen_random_uuid(),
  source_name text references docs_sources(name) on delete cascade,
  portal_url text,
  steps_md text,
  scopes text,
  quota_notes text
);

create table if not exists snippets (
  id uuid primary key default gen_random_uuid(),
  source_name text references docs_sources(name) on delete cascade,
  lang text,
  title text,
  endpoint text,
  code_md text
);



