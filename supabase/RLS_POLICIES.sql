-- RLS Policies Fix
-- Community Project Lab - Supabase Configuration
-- 
-- This file contains corrected RLS policies that work with the actual schema:
-- - projects table does NOT have owner_id column (uses project_members instead)
-- - Ownership tracked via project_members(role='leader')
-- - Support for project_members, tasks, activities tables
-- - Tasks table uses assigned_to (uuid) and assigned_user (text) columns

-- ============================================================================
-- 1. PROJECTS TABLE POLICIES
-- ============================================================================

-- Drop existing incorrect policy
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Owners can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Owners can delete own projects" ON public.projects;
DROP POLICY IF EXISTS "Projects viewable by authenticated users" ON public.projects;

-- Projects are viewable only by project members (role-based access)
CREATE POLICY "Project members can view projects"
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = projects.id
        AND project_members.user_id = auth.uid()
    )
  );

-- Allow any authenticated user to create projects
-- (Ownership established via project_members record with role='leader')
CREATE POLICY "Authenticated users can create projects"
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only project leaders can update projects
CREATE POLICY "Project leaders can update projects"
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = projects.id
        AND project_members.user_id = auth.uid()
        AND project_members.role = 'leader'
    )
  );

-- Only project leaders can delete projects
CREATE POLICY "Project leaders can delete projects"
  ON public.projects
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = projects.id
        AND project_members.user_id = auth.uid()
        AND project_members.role = 'leader'
    )
  );

-- ============================================================================
-- 2. PROJECT_MEMBERS TABLE POLICIES
-- ============================================================================

-- Enable RLS if not already enabled
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate
DROP POLICY IF EXISTS "Project members viewable by authenticated users" ON public.project_members;
DROP POLICY IF EXISTS "Users and leaders can add project members" ON public.project_members;
DROP POLICY IF EXISTS "Members and leaders can update project members" ON public.project_members;
DROP POLICY IF EXISTS "Members and leaders can remove project members" ON public.project_members;

-- Project members can view other project members (role-based access)
CREATE POLICY "Project members can view project members"
  ON public.project_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = project_members.project_id
        AND pm.user_id = auth.uid()
    )
  );

-- Users can add themselves OR leaders can add team members
CREATE POLICY "Users and leaders can add project members"
  ON public.project_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User adding themselves
    user_id = auth.uid()
    OR
    -- Or project leader adding new member
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = project_members.project_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'leader'
    )
  );

-- User or project leader can update member records
CREATE POLICY "Members and leaders can update project members"
  ON public.project_members
  FOR UPDATE
  TO authenticated
  USING (
    -- Member updating own record
    user_id = auth.uid()
    OR
    -- Or project leader updating any member
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = project_members.project_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'leader'
    )
  );

-- User or project leader can remove members
CREATE POLICY "Members and leaders can remove project members"
  ON public.project_members
  FOR DELETE
  TO authenticated
  USING (
    -- Member removing themselves
    user_id = auth.uid()
    OR
    -- Or project leader removing any member
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = project_members.project_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'leader'
    )
  );

-- ============================================================================
-- 3. TASKS TABLE POLICIES
-- ============================================================================

-- Check if tasks table exists before enabling RLS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks' AND table_schema = 'public') THEN
    -- Enable RLS
    ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "Project members can view tasks" ON public.tasks;
    DROP POLICY IF EXISTS "Project members can create tasks" ON public.tasks;
    DROP POLICY IF EXISTS "Assignee or leader can update tasks" ON public.tasks;
    DROP POLICY IF EXISTS "Leaders can delete tasks" ON public.tasks;
    
    -- Project members can view project tasks
    CREATE POLICY "Project members can view tasks"
      ON public.tasks
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_members.project_id = tasks.project_id
            AND project_members.user_id = auth.uid()
        )
      );
    
    -- Project members can create tasks
    CREATE POLICY "Project members can create tasks"
      ON public.tasks
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_members.project_id = tasks.project_id
            AND project_members.user_id = auth.uid()
        )
      );
    
    -- Task assignee (by UUID) or project leaders can update tasks
    CREATE POLICY "Assignee or leader can update tasks"
      ON public.tasks
      FOR UPDATE
      TO authenticated
      USING (
        -- Task is assigned to current user (by UUID)
        assigned_to = auth.uid()
        OR
        -- Or user is project leader
        EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_members.project_id = tasks.project_id
            AND project_members.user_id = auth.uid()
            AND project_members.role = 'leader'
        )
      );
    
    -- Only project leaders can delete tasks
    CREATE POLICY "Leaders can delete tasks"
      ON public.tasks
      FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_members.project_id = tasks.project_id
            AND project_members.user_id = auth.uid()
            AND project_members.role = 'leader'
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 4. ACTIVITIES TABLE POLICIES
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities' AND table_schema = 'public') THEN
    -- Enable RLS
    ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies
    DROP POLICY IF EXISTS "Project members can view activities" ON public.activities;
    DROP POLICY IF EXISTS "Service role can create activities" ON public.activities;
    DROP POLICY IF EXISTS "Users can create activities" ON public.activities;
    
    -- Project members can view activity logs
    CREATE POLICY "Project members can view activities"
      ON public.activities
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_members.project_id = activities.project_id
            AND project_members.user_id = auth.uid()
        )
      );
    
    -- Allow activity creation via the log_project_activity function (service role)
    -- Also allow direct insert for authenticated users who are project members
    CREATE POLICY "Project members can create activities"
      ON public.activities
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_members.project_id = activities.project_id
            AND project_members.user_id = auth.uid()
        )
      );
    
    -- Activities cannot be updated or deleted after creation (append-only log)
  END IF;
END $$;

-- ============================================================================
-- 5. VALIDATE RLS SETUP
-- ============================================================================

DO $$
DECLARE
  project_policy_count INT;
  project_members_policy_count INT;
  tasks_policy_count INT;
  activities_policy_count INT;
BEGIN
  SELECT COUNT(*) INTO project_policy_count
  FROM pg_policies
  WHERE tablename = 'projects' AND schemaname = 'public';
  
  SELECT COUNT(*) INTO project_members_policy_count
  FROM pg_policies
  WHERE tablename = 'project_members' AND schemaname = 'public';
  
  SELECT COUNT(*) INTO tasks_policy_count
  FROM pg_policies
  WHERE tablename = 'tasks' AND schemaname = 'public';
  
  SELECT COUNT(*) INTO activities_policy_count
  FROM pg_policies
  WHERE tablename = 'activities' AND schemaname = 'public';
  
  RAISE NOTICE 'Projects policies created: %', project_policy_count;
  RAISE NOTICE 'Project members policies created: %', project_members_policy_count;
  RAISE NOTICE 'Tasks policies created: %', tasks_policy_count;
  RAISE NOTICE 'Activities policies created: %', activities_policy_count;
END $$;