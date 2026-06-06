-- Migration: Workspace Schema
-- Creates tasks, activities, and fixes project_members tables
-- Run this in Supabase SQL Editor

-- ============================================================================
-- 1. TASKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_user text, -- Legacy field for backward compatibility (stores name)
  due_date date,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. ACTIVITIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.activities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name text,
  action text NOT NULL, -- e.g., 'task_created', 'task_completed', 'member_added'
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. PROJECT_MEMBERS TABLE FIXES
-- ============================================================================

-- Add missing columns if they don't exist
ALTER TABLE public.project_members
ADD COLUMN IF NOT EXISTS email text;

ALTER TABLE public.project_members
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now() NOT NULL;

-- Ensure unique constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'project_members_project_user_key'
    AND table_name = 'project_members'
  ) THEN
    ALTER TABLE public.project_members
    ADD CONSTRAINT project_members_project_user_key UNIQUE (project_id, user_id);
  END IF;
END $$;

-- ============================================================================
-- 4. INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);

CREATE INDEX IF NOT EXISTS idx_activities_project_id ON public.activities(project_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);

CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);

-- ============================================================================
-- 5. UPDATED AT TRIGGER FOR TASKS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 6. ACTIVITY LOGGING FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_project_activity(
  p_project_id uuid,
  p_user_id uuid,
  p_user_name text,
  p_action text,
  p_description text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  v_activity_id uuid;
BEGIN
  INSERT INTO public.activities (project_id, user_id, user_name, action, description, metadata)
  VALUES (p_project_id, p_user_id, p_user_name, p_action, p_description, p_metadata)
  RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. MIGRATE EXISTING DATA (if any)
-- ============================================================================

-- Update project_members with email from profiles if available
UPDATE public.project_members pm
SET email = p.email
FROM public.profiles p
WHERE pm.user_id = p.id
AND pm.email IS NULL;

-- Update project_members name from profiles if available
UPDATE public.project_members pm
SET name = p.full_name
FROM public.profiles p
WHERE pm.user_id = p.id
AND pm.name IS NULL;

-- Update project_members avatar from profiles if available
UPDATE public.project_members pm
SET avatar_url = p.avatar_url
FROM public.profiles p
WHERE pm.user_id = p.id
AND pm.avatar_url IS NULL;

-- ============================================================================
-- 8. VERIFICATION
-- ============================================================================

DO $$
DECLARE
  tasks_exists boolean;
  activities_exists boolean;
  project_members_exists boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') INTO tasks_exists;
  SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'activities') INTO activities_exists;
  SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'project_members') INTO project_members_exists;
  
  RAISE NOTICE 'Tasks table exists: %', tasks_exists;
  RAISE NOTICE 'Activities table exists: %', activities_exists;
  RAISE NOTICE 'Project members table exists: %', project_members_exists;
  
  IF tasks_exists THEN
    RAISE NOTICE 'Tasks columns: %', (SELECT string_agg(column_name, ', ') FROM information_schema.columns WHERE table_name = 'tasks' AND table_schema = 'public');
  END IF;
  
  IF activities_exists THEN
    RAISE NOTICE 'Activities columns: %', (SELECT string_agg(column_name, ', ') FROM information_schema.columns WHERE table_name = 'activities' AND table_schema = 'public');
  END IF;
END $$;