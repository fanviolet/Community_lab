-- Add group notification preferences to user notification preferences
-- This enables users to control group-related notifications

ALTER TABLE public.user_notification_prefs
ADD COLUMN IF NOT EXISTS enable_group_notifications BOOLEAN DEFAULT true;

-- Update the function to return the new column
CREATE OR REPLACE FUNCTION public.get_or_create_user_prefs(p_user_id UUID)
RETURNS public.user_notification_prefs AS $$
DECLARE
  prefs public.user_notification_prefs;
BEGIN
  -- Try to get existing preferences
  SELECT * INTO prefs FROM public.user_notification_prefs WHERE user_id = p_user_id;
  
  -- If not found, create default preferences
  IF NOT FOUND THEN
    INSERT INTO public.user_notification_prefs (user_id, enable_notifications, enable_group_notifications)
    VALUES (p_user_id, true, true)
    ON CONFLICT (user_id) DO UPDATE SET 
      enable_notifications = public.user_notification_prefs.enable_notifications,
      enable_group_notifications = COALESCE(public.user_notification_prefs.enable_group_notifications, true)
    RETURNING * INTO prefs;
  END IF;
  
  RETURN prefs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

DO $$
BEGIN
  RAISE NOTICE 'Group notification preferences added successfully';
END $$;
