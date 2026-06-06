-- Migration: AI Workflows Table for Workspace Integration
-- Stores AI-generated workflow plans for workspace projects

-- ============================================================================
-- AI_WORKFLOWS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_workflows (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  workflow_json jsonb NOT NULL,
  generated_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.ai_workflows ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Project members can view workflows for their projects
CREATE POLICY "Members can view project workflows"
  ON public.ai_workflows
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = ai_workflows.project_id
      AND project_members.user_id = auth.uid()
    )
  );

-- Project leaders can create workflows
CREATE POLICY "Leaders can create project workflows"
  ON public.ai_workflows
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = ai_workflows.project_id
      AND project_members.user_id = auth.uid()
      AND project_members.role = 'leader'
    )
  );

-- Workflow creators can update their own workflows
CREATE POLICY "Creators can update their workflows"
  ON public.ai_workflows
  FOR UPDATE
  USING (generated_by = auth.uid());

-- Workflow creators can delete their own workflows
CREATE POLICY "Creators can delete their workflows"
  ON public.ai_workflows
  FOR DELETE
  USING (generated_by = auth.uid());

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_ai_workflows_project_id ON public.ai_workflows(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_workflows_generated_by ON public.ai_workflows(generated_by);
CREATE INDEX IF NOT EXISTS idx_ai_workflows_created_at ON public.ai_workflows(created_at DESC);

-- ============================================================================
-- UPDATED AT TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS update_ai_workflows_updated_at ON public.ai_workflows;
CREATE TRIGGER update_ai_workflows_updated_at
  BEFORE UPDATE ON public.ai_workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  table_exists boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'ai_workflows' AND table_schema = 'public'
  ) INTO table_exists;
  
  RAISE NOTICE 'ai_workflows table exists: %', table_exists;
  
  IF table_exists THEN
    RAISE NOTICE 'ai_workflows columns: %', (
      SELECT string_agg(column_name, ', ') 
      FROM information_schema.columns 
      WHERE table_name = 'ai_workflows' AND table_schema = 'public'
    );
  END IF;
END $$;
