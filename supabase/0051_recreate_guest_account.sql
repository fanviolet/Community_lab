-- Recreate Guest Demo Account
-- This script prepares the database for guest@communitylab.demo account
-- Note: This script only cleans up existing data. Auth user must be created separately.

-- ============================================================================
-- CLEANUP EXISTING ACCOUNT (if exists)
-- ============================================================================

-- First, check if the profile exists and clean up related data
DO $$
DECLARE
  v_guest_profile_id uuid;
BEGIN
  -- Get the guest profile ID if it exists
  SELECT id INTO v_guest_profile_id
  FROM public.profiles
  WHERE email = 'guest@communitylab.demo'
  LIMIT 1;

  IF v_guest_profile_id IS NOT NULL THEN
    -- Remove from group memberships
    DELETE FROM public.group_members WHERE user_id = v_guest_profile_id;

    -- Remove from project memberships
    DELETE FROM public.project_members WHERE user_id = v_guest_profile_id;

    -- Remove join requests
    DELETE FROM public.group_join_requests WHERE user_id = v_guest_profile_id;

    -- Remove notifications
    DELETE FROM public.notifications WHERE user_id = v_guest_profile_id;

    -- Remove the profile
    DELETE FROM public.profiles WHERE id = v_guest_profile_id;

    RAISE NOTICE 'Cleaned up existing guest profile: %', v_guest_profile_id;
  ELSE
    RAISE NOTICE 'No existing guest profile found';
  END IF;
END $$;

-- ============================================================================
-- INSTRUCTIONS FOR AUTH USER CREATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'GUEST ACCOUNT SETUP INSTRUCTIONS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Database cleanup completed.';
  RAISE NOTICE 'Profile will be auto-created by trigger when auth user is created.';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TO CREATE AUTH USER:';
  RAISE NOTICE '1. Go to Supabase Dashboard > Authentication > Users';
  RAISE NOTICE '2. Click "Add User" or "New User"';
  RAISE NOTICE '3. Email: guest@communitylab.demo';
  RAISE NOTICE '4. Password: demo123 (or your choice)';
  RAISE NOTICE '5. Auto confirm email: ✅';
  RAISE NOTICE '6. Click "Create User"';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'OR USE NODE.JS SCRIPT:';
  RAISE NOTICE 'npm run create-guest';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'The trigger handle_new_user will auto-create the profile';
  RAISE NOTICE 'and add the user to the default group.';
  RAISE NOTICE '========================================';
END $$;
