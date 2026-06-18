-- Fix Notifications RLS Policy
-- This migration fixes the RLS policy to allow the system to insert notifications for any user
-- The previous policy only allowed users to insert notifications for themselves (user_id = auth.uid())
-- but the system needs to create notifications for other users (e.g., when adding a member to a project)

-- ============================================================================
-- DROP EXISTING INSERT POLICY
-- ============================================================================

DROP POLICY IF EXISTS "Notifications: Users can insert own" ON public.notifications;

-- ============================================================================
-- CREATE NEW INSERT POLICY
-- ============================================================================

-- Allow authenticated users to insert notifications for any user
-- This enables the system to create notifications for other users
CREATE POLICY "Notifications: Authenticated users can insert"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Notifications RLS policy fixed successfully';
END $$;
