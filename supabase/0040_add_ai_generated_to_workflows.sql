-- Migration: Add ai_generated column to workflows table
-- Stores the full AI-generated workflow output for enhanced workflow display

-- ============================================================================
-- ADD AI_GENERATED COLUMN
-- ============================================================================

ALTER TABLE public.workflows 
ADD COLUMN IF NOT EXISTS ai_generated jsonb;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  column_exists boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workflows' 
    AND column_name = 'ai_generated' 
    AND table_schema = 'public'
  ) INTO column_exists;
  
  RAISE NOTICE 'workflows.ai_generated column exists: %', column_exists;
END $$;