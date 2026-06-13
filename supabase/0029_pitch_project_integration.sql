-- Pitch to Project Integration
-- Add fields to link pitches with projects and track project origin

-- Add project_id to pitches table
ALTER TABLE public.pitches
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- Add created_from_pitch_id to projects table
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS created_from_pitch_id UUID REFERENCES public.pitches(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_pitches_project_id ON public.pitches(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_from_pitch_id ON public.projects(created_from_pitch_id);

-- Verification
DO $$
BEGIN
  RAISE NOTICE 'Pitch to Project Integration fields added successfully';
END $$;
