-- Add New Notification Types
-- Migration to add new notification types for expanded notification system

-- ============================================================================
-- UPDATE NOTIFICATION TYPE CHECK CONSTRAINT
-- ============================================================================

-- Drop existing CHECK constraint on type
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add new CHECK constraint with all required types
ALTER TABLE public.notifications 
  ADD CONSTRAINT notifications_type_check 
  CHECK (type IN (
    'task_assigned',
    'task_completed',
    'member_added',
    'project_updated',
    'pitch_approved',
    'pitch_rejected',
    'pitch_revision_requested',
    'mention',
    'ai_insight',
    'general'
  ));

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'New notification types added successfully';
END $$;
