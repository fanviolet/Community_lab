-- Fix foreign key constraint issues
-- This migration adds missing foreign key constraints and fixes existing ones

-- Add pitch_id foreign key to projects table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'projects_pitch_id_fkey'
    ) THEN
        ALTER TABLE public.projects 
        ADD CONSTRAINT projects_pitch_id_fkey 
        FOREIGN KEY (pitch_id) REFERENCES public.pitches(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add problem_id foreign key to pitches table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'pitches_problem_id_fkey'
    ) THEN
        ALTER TABLE public.pitches 
        ADD CONSTRAINT pitches_problem_id_fkey 
        FOREIGN KEY (problem_id) REFERENCES public.problems(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add problem_id foreign key to expert_analyses table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'expert_analyses_problem_id_fkey'
    ) THEN
        ALTER TABLE public.expert_analyses 
        ADD CONSTRAINT expert_analyses_problem_id_fkey 
        FOREIGN KEY (problem_id) REFERENCES public.problems(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add project_id foreign key to expert_analyses table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'expert_analyses_project_id_fkey'
    ) THEN
        ALTER TABLE public.expert_analyses 
        ADD CONSTRAINT expert_analyses_project_id_fkey 
        FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Ensure all foreign keys have appropriate ON DELETE clauses
-- Update project_members foreign key if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'project_members_project_id_fkey'
    ) THEN
        ALTER TABLE public.project_members 
        DROP CONSTRAINT project_members_project_id_fkey;
        
        ALTER TABLE public.project_members 
        ADD CONSTRAINT project_members_project_id_fkey 
        FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update tasks foreign key if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'tasks_project_id_fkey'
    ) THEN
        ALTER TABLE public.tasks 
        DROP CONSTRAINT tasks_project_id_fkey;
        
        ALTER TABLE public.tasks 
        ADD CONSTRAINT tasks_project_id_fkey 
        FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update project_tasks foreign key if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'project_tasks_project_id_fkey'
    ) THEN
        ALTER TABLE public.project_tasks 
        DROP CONSTRAINT project_tasks_project_id_fkey;
        
        ALTER TABLE public.project_tasks 
        ADD CONSTRAINT project_tasks_project_id_fkey 
        FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
    END IF;
END $$;
