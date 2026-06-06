-- Migration: Add owner_id column to projects table
-- This migration is optional. The application will work without it.
-- Run this only if you want to track project owners explicitly.

-- Step 1: Add the owner_id column if it doesn't exist
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES public.profiles (id) ON DELETE CASCADE;

-- Step 2: Populate existing projects with their owner_id based on project_members where role='leader'
-- (Only if you want to backfill existing data)
-- UPDATE public.projects p
--   SET owner_id = pm.user_id
--   FROM public.project_members pm
--   WHERE p.id = pm.project_id 
--     AND pm.role = 'leader'
--     AND p.owner_id IS NULL;

-- Step 3: Make owner_id NOT NULL (optional, only after backfilling)
-- ALTER TABLE public.projects ALTER COLUMN owner_id SET NOT NULL;

-- Step 4: Update RLS policies if needed
-- The policies defined in SUPABASE_SETUP.md reference owner_id
