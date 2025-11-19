-- SkyRas v2 Database Schema
-- This script initializes the PostgreSQL database with required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    due_date TIMESTAMP,
    created_by TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Files table
CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL,
    file_path TEXT,
    file_type TEXT,
    file_size BIGINT,
    metadata JSONB,
    tags TEXT[],
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Task-File relationship table
CREATE TABLE IF NOT EXISTS task_files (
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, file_id)
);

-- Events table for audit trail
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    agent TEXT NOT NULL,
    data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_files_type ON files(file_type);
CREATE INDEX IF NOT EXISTS idx_files_tags ON files USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_agent ON events(agent);

-- Insert some sample data
INSERT INTO tasks (title, description, status, priority, due_date, created_by) VALUES
('Complete Marcus agent framework', 'Build the core agent personality system', 'completed', 'high', NOW() + INTERVAL '1 day', 'system'),
('Implement function calling', 'Create intent parser and function registry', 'in-progress', 'high', NOW() + INTERVAL '3 days', 'system'),
('Build frontend dashboard', 'Create chat interface and project panels', 'pending', 'medium', NOW() + INTERVAL '5 days', 'system');

INSERT INTO files (filename, file_path, file_type, file_size, tags) VALUES
('project-brief.pdf', '/uploads/project-brief.pdf', 'application/pdf', 1024000, ARRAY['brief', 'project', 'documentation']),
('logo-design.ai', '/uploads/logo-design.ai', 'application/illustrator', 2048000, ARRAY['logo', 'design', 'vector']),
('meeting-notes.md', '/uploads/meeting-notes.md', 'text/markdown', 5120, ARRAY['notes', 'meeting', 'documentation']);



