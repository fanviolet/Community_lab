-- Fix Notifications Table Schema
-- Migration to align notifications table with requirements

-- ============================================================================
-- ALTER NOTIFICATIONS TABLE
-- ============================================================================

-- Drop existing CHECK constraint on type
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add new CHECK constraint with required types
ALTER TABLE public.notifications 
  ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('task_assigned', 'pitch_approved', 'pitch_rejected', 'mention', 'general'));

-- Rename 'read' column to 'is_read'
ALTER TABLE public.notifications RENAME COLUMN read TO is_read;

-- Drop title column (we'll use message only)
ALTER TABLE public.notifications DROP COLUMN IF EXISTS title;

-- Make message NOT NULL
ALTER TABLE public.notifications ALTER COLUMN message SET NOT NULL;

-- Update foreign key to reference users.id instead of profiles.id
-- First drop the existing foreign key constraint
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

-- Add new foreign key to users.id
ALTER TABLE public.notifications 
  ADD CONSTRAINT notifications_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update indexes to use is_read instead of read
DROP INDEX IF EXISTS idx_notifications_read;
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Notifications table altered successfully';
END $$;
