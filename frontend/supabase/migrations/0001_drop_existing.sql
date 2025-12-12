-- Drop existing tables if they exist (run this BEFORE 0002_core_schema.sql)
-- This ensures a clean slate for the migration

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS public.calendar_events CASCADE;
DROP TABLE IF EXISTS public.file_processing CASCADE;
DROP TABLE IF EXISTS public.workflow_tasks CASCADE;
DROP TABLE IF EXISTS public.workflows CASCADE;
DROP TABLE IF EXISTS public.files CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;

-- Drop the trigger function
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
