-- Pitch Management Module
-- Create tables for pitches, pitch versions, AI analysis, and pitch history

-- Pitches table
CREATE TABLE IF NOT EXISTS public.pitches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  problem_id UUID REFERENCES public.problems(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'revision_required', 'approved', 'rejected')),
  ai_score NUMERIC(5, 2),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  review_notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pitch content table (stores the actual proposal content)
CREATE TABLE IF NOT EXISTS public.pitch_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pitch_id UUID REFERENCES public.pitches(id) ON DELETE CASCADE NOT NULL,
  version INTEGER DEFAULT 1 NOT NULL,
  
  -- Step 1: Basic Information
  project_summary TEXT,
  target_audience TEXT,
  key_objectives TEXT[],
  
  -- Step 2: Problem Analysis
  problem_statement TEXT,
  root_cause_analysis TEXT,
  problem_validation TEXT,
  
  -- Step 3: Solution Design
  solution_description TEXT,
  technical_approach TEXT,
  innovation_points TEXT[],
  alternatives_considered TEXT[],
  
  -- Step 4: Impact Planning
  expected_impact TEXT,
  success_metrics TEXT[],
  kpis JSONB,
  risk_analysis JSONB,
  
  -- Step 5: Implementation
  implementation_plan TEXT,
  timeline JSONB,
  budget_estimate JSONB,
  resource_requirements TEXT[],
  
  -- Step 6: Team Information
  team_description TEXT,
  team_members JSONB,
  skills_required TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pitch_id, version)
);

-- Pitch AI analysis table
CREATE TABLE IF NOT EXISTS public.pitch_ai_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pitch_id UUID REFERENCES public.pitches(id) ON DELETE CASCADE NOT NULL,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('proposal_draft', 'proposal_improvement', 'kpi_suggestion', 'risk_analysis', 'timeline_generation', 'budget_generation')),
  analysis_result JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pitch history table (for tracking changes)
CREATE TABLE IF NOT EXISTS public.pitch_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pitch_id UUID REFERENCES public.pitches(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'submitted', 'reviewed', 'status_changed')),
  old_value JSONB,
  new_value JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pitch feedback table
CREATE TABLE IF NOT EXISTS public.pitch_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pitch_id UUID REFERENCES public.pitches(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('approval', 'revision', 'rejection', 'comment')),
  feedback_text TEXT NOT NULL,
  section TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pitches_problem_id ON public.pitches(problem_id);
CREATE INDEX IF NOT EXISTS idx_pitches_created_by ON public.pitches(created_by);
CREATE INDEX IF NOT EXISTS idx_pitches_status ON public.pitches(status);
CREATE INDEX IF NOT EXISTS idx_pitches_ai_score ON public.pitches(ai_score);
CREATE INDEX IF NOT EXISTS idx_pitches_submitted_at ON public.pitches(submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_pitch_content_pitch_id ON public.pitch_content(pitch_id);
CREATE INDEX IF NOT EXISTS idx_pitch_content_version ON public.pitch_content(pitch_id, version);

CREATE INDEX IF NOT EXISTS idx_pitch_ai_analysis_pitch_id ON public.pitch_ai_analysis(pitch_id);
CREATE INDEX IF NOT EXISTS idx_pitch_ai_analysis_type ON public.pitch_ai_analysis(analysis_type);

CREATE INDEX IF NOT EXISTS idx_pitch_history_pitch_id ON public.pitch_history(pitch_id);
CREATE INDEX IF NOT EXISTS idx_pitch_history_created_at ON public.pitch_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pitch_feedback_pitch_id ON public.pitch_feedback(pitch_id);
CREATE INDEX IF NOT EXISTS idx_pitch_feedback_reviewer_id ON public.pitch_feedback(reviewer_id);

-- Row Level Security policies

-- Enable RLS
ALTER TABLE public.pitches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pitch_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pitch_ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pitch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pitch_feedback ENABLE ROW LEVEL SECURITY;

-- Pitches policies
CREATE POLICY "Users can view their own pitches"
  ON public.pitches
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Leaders and experts can view all pitches"
  ON public.pitches
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() IN ('leader', 'expert', 'admin')
  );

CREATE POLICY "Builders can create pitches"
  ON public.pitches
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND public.get_user_role() IN ('member', 'builder', 'leader', 'admin')
  );

CREATE POLICY "Pitch creator can edit draft pitches"
  ON public.pitches
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    AND status = 'draft'
  )
  WITH CHECK (
    created_by = auth.uid()
    AND status = 'draft'
  );

CREATE POLICY "Leaders and admins can review pitches"
  ON public.pitches
  FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role() IN ('leader', 'admin')
  )
  WITH CHECK (
    public.get_user_role() IN ('leader', 'admin')
  );

CREATE POLICY "Pitch creator can delete draft pitches"
  ON public.pitches
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    AND status = 'draft'
  );

CREATE POLICY "Admins can delete any pitch"
  ON public.pitches
  FOR DELETE
  TO authenticated
  USING (public.get_user_role() = 'admin');

-- Pitch content policies
CREATE POLICY "Users can view their own pitch content"
  ON public.pitch_content
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pitches
      WHERE pitches.id = pitch_content.pitch_id
      AND pitches.created_by = auth.uid()
    )
  );

CREATE POLICY "Leaders and experts can view all pitch content"
  ON public.pitch_content
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() IN ('leader', 'expert', 'admin')
  );

CREATE POLICY "Pitch creator can create content"
  ON public.pitch_content
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pitches
      WHERE pitches.id = pitch_content.pitch_id
      AND pitches.created_by = auth.uid()
    )
  );

CREATE POLICY "Pitch creator can update content"
  ON public.pitch_content
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pitches
      WHERE pitches.id = pitch_content.pitch_id
      AND pitches.created_by = auth.uid()
      AND pitches.status = 'draft'
    )
  );

-- Pitch AI analysis policies
CREATE POLICY "Users can view their own AI analysis"
  ON public.pitch_ai_analysis
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pitches
      WHERE pitches.id = pitch_ai_analysis.pitch_id
      AND pitches.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can create AI analysis"
  ON public.pitch_ai_analysis
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pitches
      WHERE pitches.id = pitch_ai_analysis.pitch_id
      AND pitches.created_by = auth.uid()
    )
  );

-- Pitch history policies
CREATE POLICY "Users can view their own pitch history"
  ON public.pitch_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pitches
      WHERE pitches.id = pitch_history.pitch_id
      AND pitches.created_by = auth.uid()
    )
  );

CREATE POLICY "Leaders and experts can view all pitch history"
  ON public.pitch_history
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() IN ('leader', 'expert', 'admin')
  );

CREATE POLICY "System can create history"
  ON public.pitch_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Pitch feedback policies
CREATE POLICY "Users can view feedback on their pitches"
  ON public.pitch_feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pitches
      WHERE pitches.id = pitch_feedback.pitch_id
      AND pitches.created_by = auth.uid()
    )
  );

CREATE POLICY "Leaders and experts can view all feedback"
  ON public.pitch_feedback
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() IN ('leader', 'expert', 'admin')
  );

CREATE POLICY "Leaders and experts can create feedback"
  ON public.pitch_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() IN ('leader', 'expert', 'admin')
  );

-- Updated at trigger
CREATE TRIGGER pitches_updated_at
  BEFORE UPDATE ON public.pitches
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to log pitch history
CREATE OR REPLACE FUNCTION public.log_pitch_history()
RETURNS TRIGGER AS $$
DECLARE
  old_val JSONB;
  new_val JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    new_val := to_jsonb(NEW);
    INSERT INTO public.pitch_history (
      pitch_id,
      user_id,
      action,
      new_value
    )
    VALUES (
      NEW.id,
      auth.uid(),
      'created',
      new_val
    );
  ELSIF TG_OP = 'UPDATE' THEN
    old_val := to_jsonb(OLD);
    new_val := to_jsonb(NEW);
    
    -- Log status changes
    IF OLD.status != NEW.status THEN
      INSERT INTO public.pitch_history (
        pitch_id,
        user_id,
        action,
        old_value,
        new_value
      )
      VALUES (
        NEW.id,
        auth.uid(),
        'status_changed',
        jsonb_build_object('status', OLD.status),
        jsonb_build_object('status', NEW.status)
      );
    END IF;
    
    INSERT INTO public.pitch_history (
      pitch_id,
      user_id,
      action,
      old_value,
      new_value
    )
    VALUES (
      NEW.id,
      auth.uid(),
      'updated',
      old_val,
      new_val
    );
  ELSIF TG_OP = 'DELETE' THEN
    old_val := to_jsonb(OLD);
    INSERT INTO public.pitch_history (
      pitch_id,
      user_id,
      action,
      old_value
    )
    VALUES (
      OLD.id,
      auth.uid(),
      'deleted',
      old_val
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_pitches_history
  AFTER INSERT OR UPDATE OR DELETE ON public.pitches
  FOR EACH ROW
  EXECUTE FUNCTION public.log_pitch_history();
