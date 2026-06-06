-- Migration: Add Workflow Name and AI Prompt to ai_workflows
-- Adds missing fields to support workflow naming and AI prompt tracking

-- ============================================================================
-- 1. ADD NEW COLUMNS TO AI_WORKFLOWS TABLE
-- ============================================================================

-- Add workflow_name column
ALTER TABLE public.ai_workflows 
ADD COLUMN IF NOT EXISTS workflow_name text;

-- Add ai_prompt column
ALTER TABLE public.ai_workflows 
ADD COLUMN IF NOT EXISTS ai_prompt text;

-- ============================================================================
-- 2. UPDATE EXISTING RECORDS
-- ============================================================================

-- Set workflow_name from workflow_json.workflow_title for existing records
UPDATE public.ai_workflows 
SET workflow_name = workflow_json->>'workflow_title'
WHERE workflow_name IS NULL 
AND workflow_json->>'workflow_title' IS NOT NULL;

-- ============================================================================
-- 3. VERIFICATION
-- ============================================================================

DO $$
DECLARE
  table_exists boolean;
  columns text;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'ai_workflows' AND table_schema = 'public'
  ) INTO table_exists;
  
  IF table_exists THEN
    SELECT string_agg(column_name, ', ') INTO columns
    FROM information_schema.columns 
    WHERE table_name = 'ai_workflows' AND table_schema = 'public';
    
    RAISE NOTICE 'ai_workflows table columns: %', columns;
    
    -- Check if new columns exist
    IF columns LIKE '%workflow_name%' THEN
      RAISE NOTICE 'workflow_name column exists';
    ELSE
      RAISE NOTICE 'workflow_name column missing';
    END IF;
    
    IF columns LIKE '%ai_prompt%' THEN
      RAISE NOTICE 'ai_prompt column exists';
    ELSE
      RAISE NOTICE 'ai_prompt column missing';
    END IF;
  ELSE
    RAISE NOTICE 'ai_workflows table does not exist';
  END IF;
END $$;
