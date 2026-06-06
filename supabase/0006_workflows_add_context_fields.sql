-- Migration: Add Context-Aware Workflow Fields
-- Adds new fields to support context-aware workflow generation with real project data

-- ============================================================================
-- 1. ADD NEW COLUMNS TO WORKFLOWS TABLE
-- ============================================================================

-- Add workflow_title column
ALTER TABLE public.workflows 
ADD COLUMN IF NOT EXISTS workflow_title text;

-- Add project_summary column
ALTER TABLE public.workflows 
ADD COLUMN IF NOT EXISTS project_summary text;

-- Add dependencies column
ALTER TABLE public.workflows 
ADD COLUMN IF NOT EXISTS dependencies jsonb;

-- ============================================================================
-- 2. VERIFICATION
-- ============================================================================

DO $$
DECLARE
  table_exists boolean;
  columns text;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'workflows' AND table_schema = 'public'
  ) INTO table_exists;
  
  IF table_exists THEN
    SELECT string_agg(column_name, ', ') INTO columns
    FROM information_schema.columns 
    WHERE table_name = 'workflows' AND table_schema = 'public';
    
    RAISE NOTICE 'workflows table columns: %', columns;
    
    -- Check if new columns exist
    IF columns LIKE '%workflow_title%' THEN
      RAISE NOTICE 'workflow_title column exists';
    ELSE
      RAISE NOTICE 'workflow_title column missing';
    END IF;
    
    IF columns LIKE '%project_summary%' THEN
      RAISE NOTICE 'project_summary column exists';
    ELSE
      RAISE NOTICE 'project_summary column missing';
    END IF;
    
    IF columns LIKE '%dependencies%' THEN
      RAISE NOTICE 'dependencies column exists';
    ELSE
      RAISE NOTICE 'dependencies column missing';
    END IF;
  ELSE
    RAISE NOTICE 'workflows table does not exist';
  END IF;
END $$;
