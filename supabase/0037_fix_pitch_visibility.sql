-- Fix Pitch Visibility for Submitted Pitches
-- This migration ensures that submitted pitches are viewable by all authenticated users
-- to support the complete workflow: Pitch -> Submit -> Review -> Approve -> Project Creation

-- Drop existing restrictive view policies
DROP POLICY IF EXISTS "Users can view their own pitches" ON public.pitches;
DROP POLICY IF EXISTS "Leaders and experts can view all pitches" ON public.pitches;

-- Create new policies that allow broader visibility for submitted pitches
CREATE POLICY "Users can view their own pitches"
  ON public.pitches
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Submitted pitches viewable by all authenticated users"
  ON public.pitches
  FOR SELECT
  TO authenticated
  USING (status = 'submitted');

CREATE POLICY "Leaders and experts can view all pitches"
  ON public.pitches
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() IN ('leader', 'expert', 'admin')
  );

-- Verify policies
DO $$
DECLARE
  policy_count INT;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'pitches' AND schemaname = 'public';
  
  RAISE NOTICE 'Pitches policies count: %', policy_count;
END $$;
