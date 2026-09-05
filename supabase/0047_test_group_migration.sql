-- Test script to verify group migration works correctly
-- This can be run after 0046_groups_layer.sql to verify the migration

-- Test 1: Check that default group exists
DO $$
DECLARE
  v_group_count int;
BEGIN
  SELECT COUNT(*) INTO v_group_count
  FROM public.groups
  WHERE slug = 'community-lab';
  
  IF v_group_count = 0 THEN
    RAISE EXCEPTION 'Default group "community-lab" not found';
  END IF;
  
  RAISE NOTICE '✓ Default group exists';
END $$;

-- Test 2: Check that all root resources have group_id set
DO $$
DECLARE
  v_projects_null int;
  v_problems_null int;
  v_pitches_null int;
  v_channels_null int;
BEGIN
  SELECT COUNT(*) INTO v_projects_null FROM public.projects WHERE group_id IS NULL;
  SELECT COUNT(*) INTO v_problems_null FROM public.problems WHERE group_id IS NULL;
  SELECT COUNT(*) INTO v_pitches_null FROM public.pitches WHERE group_id IS NULL;
  SELECT COUNT(*) INTO v_channels_null FROM public.discussion_channels WHERE group_id IS NULL;
  
  IF v_projects_null > 0 THEN
    RAISE EXCEPTION 'Projects with NULL group_id: %', v_projects_null;
  END IF;
  
  IF v_problems_null > 0 THEN
    RAISE EXCEPTION 'Problems with NULL group_id: %', v_problems_null;
  END IF;
  
  IF v_pitches_null > 0 THEN
    RAISE EXCEPTION 'Pitches with NULL group_id: %', v_pitches_null;
  END IF;
  
  IF v_channels_null > 0 THEN
    RAISE EXCEPTION 'Discussion channels with NULL group_id: %', v_channels_null;
  END IF;
  
  RAISE NOTICE '✓ All root resources have group_id set';
END $$;

-- Test 3: Check that all profiles are group members
DO $$
DECLARE
  v_profile_count int;
  v_member_count int;
BEGIN
  SELECT COUNT(*) INTO v_profile_count FROM public.profiles;
  SELECT COUNT(*) INTO v_member_count FROM public.group_members 
  WHERE group_id = (SELECT id FROM public.groups WHERE slug = 'community-lab');
  
  IF v_member_count < v_profile_count THEN
    RAISE NOTICE '⚠ Not all profiles are group members: % of %', v_member_count, v_profile_count;
  ELSE
    RAISE NOTICE '✓ All profiles are group members';
  END IF;
END $$;

-- Test 4: Check that pitch_history still has NOT NULL constraint on user_id
DO $$
DECLARE
  v_is_nullable boolean;
BEGIN
  SELECT is_nullable INTO v_is_nullable
  FROM information_schema.columns
  WHERE table_name = 'pitch_history'
    AND column_name = 'user_id';
  
  IF v_is_nullable = 'YES' THEN
    RAISE EXCEPTION 'pitch_history.user_id should be NOT NULL';
  END IF;
  
  RAISE NOTICE '✓ pitch_history.user_id is NOT NULL';
END $$;

-- Test 5: Verify that pitch triggers are re-enabled
DO $$
DECLARE
  v_trigger_enabled boolean;
BEGIN
  SELECT tgenabled INTO v_trigger_enabled
  FROM pg_trigger
  WHERE tgname = 'log_pitches_history';
  
  IF v_trigger_enabled = 'D' THEN
    RAISE EXCEPTION 'pitch_history trigger is disabled';
  END IF;
  
  RAISE NOTICE '✓ pitch_history trigger is enabled';
END $$;

RAISE NOTICE '=== Migration verification complete ===';