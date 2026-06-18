-- Add missing columns to profiles table for complete profile management
-- Migration: 0036_add_profile_columns.sql

-- ============================================================================
-- ADD MISSING COLUMNS TO PROFILES TABLE
-- ============================================================================

-- Add username (unique identifier for mentions and URLs)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Add skills array
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';

-- Add interests array
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';

-- Add website URL
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS website TEXT;

-- Add location
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS location TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_skills ON public.profiles USING GIN(skills);
CREATE INDEX IF NOT EXISTS idx_profiles_interests ON public.profiles USING GIN(interests);

-- ============================================================================
-- UPDATE RLS POLICIES FOR NEW COLUMNS
-- ============================================================================

-- Users can update their own profile including new columns
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (
    public.is_admin()
    OR (
      id = auth.uid()
      AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
    )
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Profile columns added successfully: username, skills, interests, website, location';
END $$;
