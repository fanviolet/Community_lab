-- Fix RLS policies on pitches table to resolve 42501 errors
-- This replaces the restrictive "Pitch creator can edit draft pitches" and
-- permissive "Leaders and admins can review pitches" policies with more
-- granular control.

-- Drop existing UPDATE policies
DROP POLICY IF EXISTS "Pitch creator can edit draft pitches" ON public.pitches;
DROP POLICY IF EXISTS "Leaders and admins can review pitches" ON public.pitches;

-- Policy A: pitch_owner_edit
-- Allows pitch creator to update their pitch ONLY when status is 'draft' or 'rejected'
-- WITH CHECK allows status to be 'draft', 'submitted', or 'rejected' (enables draft→submitted and rejected→draft/submitted)
-- This prevents creator from changing status to 'under_review' or 'converted' themselves
CREATE POLICY "pitch_owner_edit"
  ON public.pitches
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by
    AND status IN ('draft', 'rejected')
  )
  WITH CHECK (
    auth.uid() = created_by
    AND status IN ('draft', 'submitted', 'rejected')
  );

-- Policy B: pitch_reviewer_update
-- Allows Leader, Admin, and Organization Owner to update any pitch
-- This includes status changes, reviewed_by, review_comment, reviewed_at
CREATE POLICY "pitch_reviewer_update"
  ON public.pitches
  FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role() IN ('leader', 'admin', 'organization')
  )
  WITH CHECK (
    public.get_user_role() IN ('leader', 'admin', 'organization')
  );

-- Test logic for member submitting pitch (draft → submitted):
-- 
-- Scenario: User is pitch creator, current status = 'draft', wants to update status to 'submitted'
-- 
-- Policy A USING check: auth.uid() = created_by AND status IN ('draft', 'rejected')
--   - auth.uid() = created_by ✓ (user is creator)
--   - status = 'draft' ✓ (current status is 'draft')
--   - Result: USING passes ✓
-- 
-- Policy A WITH CHECK check: auth.uid() = created_by AND status IN ('draft', 'submitted', 'rejected')
--   - auth.uid() = created_by ✓ (user is creator)
--   - new status = 'submitted' ✓ (new status is in allowed list)
--   - Result: WITH CHECK passes ✓
-- 
-- Conclusion: Member CAN submit pitch (draft → submitted) under Policy A ✓
