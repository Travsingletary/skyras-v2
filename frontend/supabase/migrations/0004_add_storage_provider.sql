-- Migration: Add Storage Provider Tracking
-- Description: Add columns to track storage provider, public/private access, and signed URL expiration
-- Date: 2025-12-14

BEGIN;

-- Add storage provider and access control columns to files table
ALTER TABLE public.files
  ADD COLUMN IF NOT EXISTS storage_provider TEXT NOT NULL DEFAULT 'supabase',
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS signed_url_expires_at TIMESTAMPTZ;

-- Add check constraint to validate provider values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    WHERE c.conname = 'valid_storage_provider'
      AND c.conrelid = 'public.files'::regclass
  ) THEN
    ALTER TABLE public.files
      ADD CONSTRAINT valid_storage_provider
      CHECK (storage_provider IN ('supabase', 'qnap', 'local', 's3'));
  END IF;
END $$;

-- Create index for efficient provider filtering
CREATE INDEX IF NOT EXISTS idx_files_storage_provider
  ON public.files(storage_provider);

-- Create index for efficient signed URL expiration queries
CREATE INDEX IF NOT EXISTS idx_files_signed_url_expires_at
  ON public.files(signed_url_expires_at)
  WHERE signed_url_expires_at IS NOT NULL;

-- Add comments explaining the new columns
COMMENT ON COLUMN public.files.storage_provider IS
  'Storage backend used for this file: supabase (default), qnap, local, or s3';

COMMENT ON COLUMN public.files.is_public IS
  'Whether file has a permanent public URL (true) or requires signed URLs (false). New uploads default to false for security.';

COMMENT ON COLUMN public.files.signed_url_expires_at IS
  'Expiration timestamp for cached signed URL. NULL if public_url is a permanent public URL.';

-- Backfill existing records with default values
-- All existing files are from Supabase and have public URLs
UPDATE public.files
SET
  storage_provider = 'supabase',
  is_public = true,
  signed_url_expires_at = NULL
WHERE storage_provider IS NULL OR storage_provider = '';

COMMIT;
