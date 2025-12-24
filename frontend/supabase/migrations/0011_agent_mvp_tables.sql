-- Agent MVP Tables Migration
-- Creates tables for agent_runs, assets (if needed), and scheduled_posts

-- Agent Runs Table (logs all agent executions)
CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT,
  scenario TEXT NOT NULL, -- 'creative' | 'compliance' | 'distribution'
  request JSONB NOT NULL,
  response_json JSONB NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  proof_markers JSONB, -- Array of proof markers
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add index for querying by scenario and user
CREATE INDEX IF NOT EXISTS idx_agent_runs_scenario ON agent_runs(scenario);
CREATE INDEX IF NOT EXISTS idx_agent_runs_user_id ON agent_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_created_at ON agent_runs(created_at DESC);

-- Assets Table (if not exists - for storing text artifacts like prompts)
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  project TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'prompt' | 'script' | 'image' | 'video' | 'audio' | 'metadata'
  content TEXT, -- For text artifacts like prompts
  url TEXT, -- For file-based assets
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  licensing_status TEXT DEFAULT 'unknown', -- 'licensed' | 'unlicensed' | 'pending' | 'unknown'
  created_by TEXT,
  agent_source TEXT -- Which agent created this (e.g., 'giorgio', 'letitia')
);

-- Add indexes for assets
CREATE INDEX IF NOT EXISTS idx_assets_project ON assets(project);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);
CREATE INDEX IF NOT EXISTS idx_assets_tags ON assets USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_assets_licensing_status ON assets(licensing_status);

-- Scheduled Posts Table (for Jamal drafts - NO actual publishing)
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT NOT NULL,
  project_id TEXT,
  content_item_id TEXT,
  platform TEXT NOT NULL, -- 'instagram' | 'tiktok' | 'linkedin' | 'twitter' | 'facebook' | 'youtube'
  caption TEXT NOT NULL,
  media_urls TEXT[],
  scheduled_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'Draft', -- 'Draft' | 'Approved' | 'Queued' | 'Published' | 'Failed'
  metadata JSONB DEFAULT '{}'::jsonb,
  agent_source TEXT DEFAULT 'jamal',
  notes TEXT
);

-- Add indexes for scheduled_posts
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_id ON scheduled_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_scheduled_at ON scheduled_posts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_platform ON scheduled_posts(platform);

-- RLS Policies (basic - allow service role full access)
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access on agent_runs"
  ON agent_runs FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on assets"
  ON assets FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on scheduled_posts"
  ON scheduled_posts FOR ALL
  USING (auth.role() = 'service_role');

-- Public/anon can read (for testing)
CREATE POLICY "Public read on agent_runs"
  ON agent_runs FOR SELECT
  USING (true);

CREATE POLICY "Public read on assets"
  ON assets FOR SELECT
  USING (true);

CREATE POLICY "Public read on scheduled_posts"
  ON scheduled_posts FOR SELECT
  USING (true);

