-- Migration: Add workflow generation tracking fields
-- Adds validation_failures and generation_attempts columns to ai_workflows table
-- This supports the improved AI workflow generation system with retry logic and debugging

-- Add validation_failures column to store detailed failure information
ALTER TABLE public.ai_workflows
ADD COLUMN IF NOT EXISTS validation_failures jsonb;

-- Add generation_attempts column to track how many times AI was called
ALTER TABLE public.ai_workflows
ADD COLUMN IF NOT EXISTS generation_attempts integer DEFAULT 0;

-- Add comment to document the new columns
COMMENT ON COLUMN public.ai_workflows.validation_failures IS 'Stores detailed validation failure information for debugging AI workflow generation';
COMMENT ON COLUMN public.ai_workflows.generation_attempts IS 'Number of AI generation attempts before success or fallback';

-- Create index for querying workflows by generation attempts
CREATE INDEX IF NOT EXISTS idx_ai_workflows_generation_attempts 
  ON public.ai_workflows(generation_attempts);

-- Create index for finding workflows that used fallback
CREATE INDEX IF NOT EXISTS idx_ai_workflows_used_fallback 
  ON public.ai_workflows(used_fallback) 
  WHERE used_fallback = true;

-- Example query to debug AI generation issues:
-- SELECT 
--   id,
--   project_id,
--   used_fallback,
--   generation_attempts,
--   validation_failures,
--   created_at
-- FROM ai_workflows
-- WHERE used_fallback = true
--   AND generation_attempts > 1
-- ORDER BY created_at DESC;