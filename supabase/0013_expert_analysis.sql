-- Expert Analysis Module
-- Create tables for expert analyses and scorecards

-- Expert analyses table
CREATE TABLE IF NOT EXISTS public.expert_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  problem_id UUID REFERENCES public.problems(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('problem', 'project', 'proposal', 'trend')),
  summary TEXT NOT NULL,
  strengths TEXT[],
  weaknesses TEXT[],
  risks TEXT[],
  recommendations TEXT[],
  impact_assessment TEXT,
  feasibility_assessment TEXT,
  sustainability_assessment TEXT,
  ai_generated BOOLEAN DEFAULT false,
  ai_prompt TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed', 'published', 'archived'))
);

-- Expert scorecard table
CREATE TABLE IF NOT EXISTS public.expert_scorecards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID REFERENCES public.expert_analyses(id) ON DELETE CASCADE NOT NULL,
  impact_score INTEGER CHECK (impact_score >= 1 AND impact_score <= 10),
  innovation_score INTEGER CHECK (innovation_score >= 1 AND innovation_score <= 10),
  feasibility_score INTEGER CHECK (feasibility_score >= 1 AND feasibility_score <= 10),
  sustainability_score INTEGER CHECK (sustainability_score >= 1 AND sustainability_score <= 10),
  overall_score INTEGER GENERATED ALWAYS AS (
    (impact_score + innovation_score + feasibility_score + sustainability_score) / 4
  ) STORED,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_expert_analyses_problem_id ON public.expert_analyses(problem_id);
CREATE INDEX IF NOT EXISTS idx_expert_analyses_project_id ON public.expert_analyses(project_id);
CREATE INDEX IF NOT EXISTS idx_expert_analyses_created_by ON public.expert_analyses(created_by);
CREATE INDEX IF NOT EXISTS idx_expert_analyses_status ON public.expert_analyses(status);
CREATE INDEX IF NOT EXISTS idx_expert_analyses_type ON public.expert_analyses(analysis_type);
CREATE INDEX IF NOT EXISTS idx_expert_analyses_created_at ON public.expert_analyses(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_expert_scorecards_analysis_id ON public.expert_scorecards(analysis_id);
CREATE INDEX IF NOT EXISTS idx_expert_scorecards_created_by ON public.expert_scorecards(created_by);

-- Row Level Security policies

-- Enable RLS
ALTER TABLE public.expert_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_scorecards ENABLE ROW LEVEL SECURITY;

-- Expert analyses policies
CREATE POLICY "Experts can create analyses"
  ON public.expert_analyses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() IN ('expert', 'mentor', 'leader', 'admin')
  );

CREATE POLICY "Experts can edit own analyses"
  ON public.expert_analyses
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR public.get_user_role() IN ('leader', 'admin')
  )
  WITH CHECK (
    created_by = auth.uid()
    OR public.get_user_role() IN ('leader', 'admin')
  );

CREATE POLICY "Members can view published analyses"
  ON public.expert_analyses
  FOR SELECT
  TO authenticated
  USING (
    status = 'published'
    OR created_by = auth.uid()
    OR public.get_user_role() IN ('expert', 'mentor', 'leader', 'admin')
  );

CREATE POLICY "Experts can delete own analyses"
  ON public.expert_analyses
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR public.get_user_role() IN ('admin')
  );

-- Scorecard policies
CREATE POLICY "Experts can create scorecards"
  ON public.expert_scorecards
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() IN ('expert', 'mentor', 'leader', 'admin')
  );

CREATE POLICY "Experts can edit own scorecards"
  ON public.expert_scorecards
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR public.get_user_role() IN ('leader', 'admin')
  )
  WITH CHECK (
    created_by = auth.uid()
    OR public.get_user_role() IN ('leader', 'admin')
  );

CREATE POLICY "Members can view scorecards for published analyses"
  ON public.expert_scorecards
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.expert_analyses
      WHERE expert_analyses.id = expert_scorecards.analysis_id
      AND (expert_analyses.status = 'published'
           OR expert_analyses.created_by = auth.uid()
           OR public.get_user_role() IN ('expert', 'mentor', 'leader', 'admin'))
    )
  );

CREATE POLICY "Experts can delete own scorecards"
  ON public.expert_scorecards
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR public.get_user_role() IN ('admin')
  );

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER expert_analyses_updated_at
  BEFORE UPDATE ON public.expert_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER expert_scorecards_updated_at
  BEFORE UPDATE ON public.expert_scorecards
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
