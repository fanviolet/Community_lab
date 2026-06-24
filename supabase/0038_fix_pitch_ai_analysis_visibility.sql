-- Fix Pitch AI Analysis Visibility
-- This migration ensures that AI analysis is visible to all users who can view the pitch
-- to support the complete workflow where analysis is shared pitch data
--
-- Root Cause: The existing RLS policy only allows the pitch creator to view AI analysis
-- Expected: Any user who can view the pitch should also be able to view its AI analysis

-- Drop the restrictive view policy
DROP POLICY IF EXISTS "Users can view their own AI analysis" ON public.pitch_ai_analysis;

-- Create new policies that allow broader visibility

-- Policy 1: Pitch creator can view their own AI analysis
CREATE POLICY "Pitch creator can view AI analysis"
  ON public.pitch_ai_analysis
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pitches
      WHERE pitches.id = pitch_ai_analysis.pitch_id
      AND pitches.created_by = auth.uid()
    )
  );

-- Policy 2: Leaders, experts, and admins can view all AI analysis
CREATE POLICY "Leaders and experts can view all AI analysis"
  ON public.pitch_ai_analysis
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() IN ('leader', 'expert', 'admin')
  );

-- Policy 3: All authenticated users can view AI analysis for submitted pitches
-- This matches the pitch visibility policy from 0037_fix_pitch_visibility.sql
CREATE POLICY "Submitted pitch AI analysis viewable by all authenticated users"
  ON public.pitch_ai_analysis
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pitches
      WHERE pitches.id = pitch_ai_analysis.pitch_id
      AND pitches.status = 'submitted'
    )
  );

-- Verify policies
DO $$
DECLARE
  policy_count INT;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'pitch_ai_analysis' AND schemaname = 'public' AND cmd = 'SELECT';
  
  RAISE NOTICE 'pitch_ai_analysis SELECT policies count: %', policy_count;
END $$;