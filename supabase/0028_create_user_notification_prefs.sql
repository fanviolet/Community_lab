-- Create User Notification Preferences Table
-- Migration to create user notification preferences

-- ============================================================================
-- USER NOTIFICATION PREFERENCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_notification_prefs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enable_notifications BOOLEAN DEFAULT true,
  enable_task_notifications BOOLEAN DEFAULT true,
  enable_project_notifications BOOLEAN DEFAULT true,
  enable_pitch_notifications BOOLEAN DEFAULT true,
  enable_mention_notifications BOOLEAN DEFAULT true,
  enable_ai_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_notification_prefs_user_id ON public.user_notification_prefs(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.user_notification_prefs ENABLE ROW LEVEL SECURITY;

-- Users can read their own preferences
CREATE POLICY "User Notification Prefs: Users can read own" ON public.user_notification_prefs
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own preferences
CREATE POLICY "User Notification Prefs: Users can insert own" ON public.user_notification_prefs
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own preferences
CREATE POLICY "User Notification Prefs: Users can update own" ON public.user_notification_prefs
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================================================
-- FUNCTION TO GET OR CREATE DEFAULT PREFERENCES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_or_create_user_prefs(p_user_id UUID)
RETURNS public.user_notification_prefs AS $$
DECLARE
  prefs public.user_notification_prefs;
BEGIN
  -- Try to get existing preferences
  SELECT * INTO prefs FROM public.user_notification_prefs WHERE user_id = p_user_id;
  
  -- If not found, create default preferences
  IF NOT FOUND THEN
    INSERT INTO public.user_notification_prefs (user_id)
    VALUES (p_user_id)
    RETURNING * INTO prefs;
  END IF;
  
  RETURN prefs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'User notification preferences table created successfully';
END $$;
