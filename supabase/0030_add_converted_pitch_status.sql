-- Add 'converted' status to pitches table
-- This status indicates a pitch has been approved and converted into a project

-- Drop the existing check constraint
ALTER TABLE public.pitches DROP CONSTRAINT IF EXISTS pitches_status_check;

-- Recreate the check constraint with 'converted' status
ALTER TABLE public.pitches
  ADD CONSTRAINT pitches_status_check
  CHECK (status IN ('draft', 'submitted', 'under_review', 'revision_required', 'approved', 'rejected', 'converted'));

-- Verification
DO $$
BEGIN
  RAISE NOTICE 'Pitch status check constraint updated successfully';
END $$;
