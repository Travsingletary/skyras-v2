-- SkySky Show Database Schema Extensions
-- Run this after the initial Phase 0 schema

-- Episodes table
CREATE TABLE IF NOT EXISTS episodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  episode_number INTEGER,
  status TEXT DEFAULT 'planning',
  notion_page_id TEXT,
  folder_path TEXT,
  theme TEXT,
  tagline TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Scenes table
CREATE TABLE IF NOT EXISTS scenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
  scene_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo',
  file_path TEXT,
  duration_seconds DECIMAL,
  script_content TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(episode_id, scene_number)
);

-- Extend existing files table for SkySky assets
ALTER TABLE files ADD COLUMN IF NOT EXISTS scene_id UUID REFERENCES scenes(id);
ALTER TABLE files ADD COLUMN IF NOT EXISTS tool TEXT;
ALTER TABLE files ADD COLUMN IF NOT EXISTS checksum TEXT;
ALTER TABLE files ADD COLUMN IF NOT EXISTS duration_seconds DECIMAL;
ALTER TABLE files ADD COLUMN IF NOT EXISTS asset_type TEXT; -- 'video', 'audio', 'image', 'music'
ALTER TABLE files ADD COLUMN IF NOT EXISTS generation_prompt TEXT;
ALTER TABLE files ADD COLUMN IF NOT EXISTS generation_settings JSONB;

-- Distribution logs table
CREATE TABLE IF NOT EXISTS distribution_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  video_id TEXT,
  video_url TEXT,
  title TEXT,
  description TEXT,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  uploaded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- n8n workflow executions table
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_name TEXT NOT NULL,
  execution_id TEXT NOT NULL,
  status TEXT NOT NULL,
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Resolve project tracking
CREATE TABLE IF NOT EXISTS resolve_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  project_path TEXT NOT NULL,
  status TEXT DEFAULT 'created',
  last_exported_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_episodes_status ON episodes(status);
CREATE INDEX IF NOT EXISTS idx_episodes_number ON episodes(episode_number);
CREATE INDEX IF NOT EXISTS idx_scenes_episode ON scenes(episode_id);
CREATE INDEX IF NOT EXISTS idx_scenes_status ON scenes(status);
CREATE INDEX IF NOT EXISTS idx_files_scene ON files(scene_id);
CREATE INDEX IF NOT EXISTS idx_files_tool ON files(tool);
CREATE INDEX IF NOT EXISTS idx_distribution_episode ON distribution_logs(episode_id);
CREATE INDEX IF NOT EXISTS idx_distribution_platform ON distribution_logs(platform);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_name ON workflow_executions(workflow_name);
CREATE INDEX IF NOT EXISTS idx_resolve_projects_episode ON resolve_projects(episode_id);

-- Insert sample episode for testing
INSERT INTO episodes (title, episode_number, theme, tagline, status) VALUES
('The Truth Shines Bright', 3, 'Integrity', 'When you tell the truth, your light shines brightest.', 'planning')
ON CONFLICT DO NOTHING;

-- Insert sample scenes for EP03
INSERT INTO scenes (episode_id, scene_number, name, description, script_content) 
SELECT 
  e.id,
  s.scene_number,
  s.name,
  s.description,
  s.script_content
FROM episodes e
CROSS JOIN (
  VALUES 
    (1, 'Direct-to-Camera Intro', 'School hallway, SkySky confesses guilt', 'Hey friends… I need to tell you something. Today at school, I kinda took credit for something I didn''t do.'),
    (2, 'Podcast Reflection', 'Bedroom, bedtime podcast', 'I guess I didn''t lie… but I didn''t tell the truth, either. Why is it so hard to do the right thing when everyone''s watching?'),
    (3, 'Imaginary Land', 'Golden cloud meadow, meets Luma', 'She meets Luma, a shimmering cloud-being who changes color when people tell the truth or hide it.'),
    (4, 'Song "Shine with the Truth"', 'Full musical number', 'Sometimes I hide, afraid to say, The truth I kept just fades away. But when I''m real, the light comes through, The sky shines brighter — me and you.'),
    (5, 'Real-World Resolution', 'School hallway, confession & closure', 'SkySky walks up to her teacher and Nia. "Ms. Luna, I need to say something. The art idea wasn''t mine. It was Nia''s."')
) AS s(scene_number, name, description, script_content)
WHERE e.title = 'The Truth Shines Bright'
ON CONFLICT (episode_id, scene_number) DO NOTHING;


