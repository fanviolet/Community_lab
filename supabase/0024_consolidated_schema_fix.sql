-- Consolidated Schema Fix Migration
-- This migration fixes all schema issues identified in the architectural audit
-- It is idempotent and can be run multiple times safely

-- ============================================================================
-- 1. ADD MISSING COLUMNS
-- ============================================================================

-- Add pitch_id column to projects table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'pitch_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.projects 
        ADD COLUMN pitch_id UUID REFERENCES public.pitches(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added pitch_id column to projects table';
    ELSE
        RAISE NOTICE 'pitch_id column already exists in projects table';
    END IF;
END $$;

-- ============================================================================
-- 2. ADD MISSING FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Add FK constraint for project_members.project_id → projects.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'project_members_project_id_fkey'
    ) THEN
        ALTER TABLE public.project_members 
        ADD CONSTRAINT project_members_project_id_fkey 
        FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added FK constraint project_members_project_id_fkey';
    ELSE
        RAISE NOTICE 'FK constraint project_members_project_id_fkey already exists';
    END IF;
END $$;

-- Add FK constraint for project_members.user_id → profiles.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'project_members_user_id_fkey'
    ) THEN
        ALTER TABLE public.project_members 
        ADD CONSTRAINT project_members_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added FK constraint project_members_user_id_fkey';
    ELSE
        RAISE NOTICE 'FK constraint project_members_user_id_fkey already exists';
    END IF;
END $$;

-- ============================================================================
-- 3. TABLE DUPLICATION NOTES
-- ============================================================================

-- NOTE: tasks vs project_tables duplication
-- Both tables exist and are actively used in different parts of the codebase:
-- - tasks (from 0002_workspace_schema.sql) is used in workspace/insights modules
-- - project_tasks (from 0015_project_management.sql) is used in projects module
-- 
-- Recommendation: Consolidate to a single table in a future migration after data migration
-- The project_tasks table has a more comprehensive schema (time tracking, tags, created_by)
-- and should likely be the target for consolidation.
COMMENT ON TABLE public.tasks IS 'LEGACY: This table is used in workspace/insights modules. Should be consolidated with project_tasks table in a future migration after data migration.';

COMMENT ON TABLE public.project_tasks IS 'PRIMARY: This is the comprehensive task management table used in projects module. Should be the target for consolidating the legacy tasks table.';

-- ============================================================================
-- 4. VERIFICATION
-- ============================================================================

DO $$
DECLARE
    pitch_id_exists boolean;
    project_members_project_fk_exists boolean;
    project_members_user_fk_exists boolean;
BEGIN
    -- Check pitch_id column
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'pitch_id'
        AND table_schema = 'public'
    ) INTO pitch_id_exists;
    
    -- Check project_members.project_id FK
    SELECT EXISTS(
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'project_members_project_id_fkey'
    ) INTO project_members_project_fk_exists;
    
    -- Check project_members.user_id FK
    SELECT EXISTS(
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'project_members_user_id_fkey'
    ) INTO project_members_user_fk_exists;
    
    RAISE NOTICE '=== Schema Fix Verification ===';
    RAISE NOTICE 'projects.pitch_id column exists: %', pitch_id_exists;
    RAISE NOTICE 'project_members.project_id FK exists: %', project_members_project_fk_exists;
    RAISE NOTICE 'project_members.user_id FK exists: %', project_members_user_fk_exists;
    
    IF pitch_id_exists AND project_members_project_fk_exists AND project_members_user_fk_exists THEN
        RAISE NOTICE 'All schema fixes applied successfully!';
    ELSE
        RAISE NOTICE 'WARNING: Some schema fixes may not have been applied correctly';
    END IF;
END $$;
