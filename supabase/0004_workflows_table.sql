-- Migration: AI Workflows Table
-- Stores AI-generated workflow plans for community projects

-- ============================================================================
-- 1. WORKFLOWS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.workflows (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  
  -- Input data
  problem_title text NOT NULL,
  problem_description text,
  community_impact text,
  expected_goal text,
  estimated_team_size integer,
  
  -- AI-generated output (JSON)
  executive_summary jsonb,
  phases jsonb,
  tasks jsonb,
  team_structure jsonb,
  risks jsonb,
  success_metrics jsonb,
  
  -- Metadata
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'saved', 'linked')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. RLS POLICIES
-- ============================================================================

-- Users can view their own workflows
CREATE POLICY "Users can view own workflows"
  ON public.workflows
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own workflows
CREATE POLICY "Users can insert own workflows"
  ON public.workflows
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own workflows
CREATE POLICY "Users can update own workflows"
  ON public.workflows
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own workflows
CREATE POLICY "Users can delete own workflows"
  ON public.workflows
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON public.workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_project_id ON public.workflows(project_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON public.workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_created_at ON public.workflows(created_at DESC);

-- ============================================================================
-- 4. UPDATED AT TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS update_workflows_updated_at ON public.workflows;
CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON public.workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 5. VERIFICATION
-- ============================================================================

DO $$
DECLARE
  workflows_exists boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'workflows' AND table_schema = 'public'
  ) INTO workflows_exists;
  
  RAISE NOTICE 'Workflows table exists: %', workflows_exists;
  
  IF workflows_exists THEN
    RAISE NOTICE 'Workflows columns: %', (
      SELECT string_agg(column_name, ', ') 
      FROM information_schema.columns 
      WHERE table_name = 'workflows' AND table_schema = 'public'
    );
  END IF;
END $$;
