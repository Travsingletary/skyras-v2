-- Fix conversations table ID type from UUID to TEXT
-- Run this in Supabase SQL Editor

-- Drop the foreign key constraint first
ALTER TABLE public.messages
DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;

-- Change the conversations.id column type
ALTER TABLE public.conversations
ALTER COLUMN id TYPE TEXT;

-- Change the messages.conversation_id column type
ALTER TABLE public.messages
ALTER COLUMN conversation_id TYPE TEXT;

-- Re-add the foreign key constraint
ALTER TABLE public.messages
ADD CONSTRAINT messages_conversation_id_fkey
FOREIGN KEY (conversation_id)
REFERENCES public.conversations(id)
ON DELETE CASCADE;
