-- Fix RLS policies on pitch_content table to resolve 42501 errors
-- This replaces the restrictive "Pitch creator can update content" policy
-- with more granular control matching the pitches table policies.

-- Drop existing UPDATE policy
DROP POLICY IF EXISTS "Pitch creator can update content" ON public.pitch_content;

-- Policy: pitch_content_owner_edit
-- Allows pitch creator to update their pitch content ONLY when pitch status is 'draft' or 'rejected'
-- WITH CHECK allows pitch status to be 'draft', 'submitted', or 'rejected' (enables draft→submitted and rejected→draft/submitted)
CREATE POLICY "pitch_content_owner_edit"
  ON public.pitch_content
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pitches
      WHERE pitches.id = pitch_content.pitch_id
        AND pitches.created_by = auth.uid()
        AND pitches.status IN ('draft', 'rejected')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pitches
      WHERE pitches.id = pitch_content.pitch_id
        AND pitches.created_by = auth.uid()
        AND pitches.status IN ('draft', 'submitted', 'rejected')
    )
  );

-- Note: INSERT policy "Pitch creator can create content" does not need status check
-- because content is created when the pitch is created (status is always 'draft' at creation)
