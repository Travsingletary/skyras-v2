-- Migration: Add onboarding_state and workflow columns to conversations table
-- Run this in your Supabase SQL editor if these columns don't exist

ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS onboarding_state JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS workflow JSONB;

-- Add index for faster queries on workflow
CREATE INDEX IF NOT EXISTS idx_conversations_workflow ON conversations USING GIN(workflow);

-- Add index for onboarding state queries
CREATE INDEX IF NOT EXISTS idx_conversations_onboarding ON conversations USING GIN(onboarding_state);

