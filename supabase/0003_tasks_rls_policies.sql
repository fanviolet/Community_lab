-- Fix: Add RLS Policies for Tasks Table
-- Run this in Supabase SQL Editor to enable task creation

-- Drop existing policies (if any)
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

-- Verification
DO $$
BEGIN
  RAISE NOTICE 'Tasks RLS policies created successfully';
END $$;
