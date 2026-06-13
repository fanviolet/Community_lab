-- Enable Supabase Realtime for Notifications Table
-- This migration enables realtime replication for the notifications table

-- ============================================================================
-- ENABLE REALTIME REPLICATION
-- ============================================================================

-- Drop existing publication if it exists
DROP PUBLICATION IF EXISTS supabase_realtime;

-- Create publication for realtime
CREATE PUBLICATION supabase_realtime FOR TABLE notifications;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Realtime enabled for notifications table';
END $$;
