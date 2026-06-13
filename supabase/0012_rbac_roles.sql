-- Migration: RBAC role management on profiles
-- Run in Supabase SQL Editor

-- ============================================================================
-- 1. PROFILES ROLE COLUMN
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member'
  CHECK (role IN ('member', 'expert', 'mentor', 'leader', 'admin'));

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Default existing users to member
UPDATE public.profiles
SET role = 'member'
WHERE role IS NULL OR role = '';

-- ============================================================================
-- 2. RBAC HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    'member'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role() = 'admin';
$$;

CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = p_project_id
      AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_project_leader(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = p_project_id
      AND user_id = auth.uid()
      AND role = 'leader'
  );
$$;

-- ============================================================================
-- 3. PROFILES RLS
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile role" ON public.profiles;

CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

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

CREATE POLICY "Admins can update any profile role"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- 4. PROJECTS RLS — ADMIN BYPASS + ROLE CHECKS
-- ============================================================================

DROP POLICY IF EXISTS "Project members can view projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Project leaders can update projects" ON public.projects;
DROP POLICY IF EXISTS "Project leaders can delete projects" ON public.projects;

CREATE POLICY "Project members can view projects"
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR public.is_project_member(id)
  );

CREATE POLICY "Leaders and admins can create projects"
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() OR public.get_user_role() = 'leader');

CREATE POLICY "Project leaders can update projects"
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR public.is_project_leader(id)
  );

CREATE POLICY "Admins can delete projects"
  ON public.projects
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- 5. PROBLEMS RLS
-- ============================================================================

ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Problems viewable by all authenticated" ON public.problems;
DROP POLICY IF EXISTS "Members can create problems" ON public.problems;
DROP POLICY IF EXISTS "Users can edit own problems" ON public.problems;
DROP POLICY IF EXISTS "Leaders can edit any problem" ON public.problems;
DROP POLICY IF EXISTS "Users can delete own problems" ON public.problems;
DROP POLICY IF EXISTS "Leaders can delete any problem" ON public.problems;

CREATE POLICY "Problems viewable by all authenticated"
  ON public.problems
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Members can create problems"
  ON public.problems
  FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('member', 'expert', 'mentor', 'leader', 'admin'));

CREATE POLICY "Users can edit own problems"
  ON public.problems
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR author_id = auth.uid()
    OR public.get_user_role() IN ('leader')
  );

CREATE POLICY "Users can delete own problems"
  ON public.problems
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
    OR author_id = auth.uid()
    OR public.get_user_role() IN ('leader')
  );

-- ============================================================================
-- 6. PROPOSALS (PITCHES) RLS
-- ============================================================================

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pitches viewable by members" ON public.proposals;
DROP POLICY IF EXISTS "Members can create pitches" ON public.proposals;
DROP POLICY IF EXISTS "Users can edit own pending pitches" ON public.proposals;
DROP POLICY IF EXISTS "Leaders can approve pitches" ON public.proposals;

CREATE POLICY "Pitches viewable by members"
  ON public.proposals
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR public.get_user_role() IN ('member', 'expert', 'mentor', 'leader')
    OR user_id = auth.uid()
  );

CREATE POLICY "Members can create pitches"
  ON public.proposals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() IN ('member', 'expert', 'mentor', 'leader', 'admin')
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can edit own pending pitches"
  ON public.proposals
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR (
      user_id = auth.uid()
      AND status IN ('draft', 'submitted', 'pending')
    )
    OR public.get_user_role() IN ('leader')
  );
