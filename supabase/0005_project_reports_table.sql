-- Migration: Project Reports Table
-- Creates table for storing AI-generated project reports
-- Run this in Supabase SQL Editor

-- ============================================================================
-- PROJECT_REPORTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.project_reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  report_type text NOT NULL CHECK (report_type IN ('weekly', 'monthly', 'full')),
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,
  report_json jsonb NOT NULL,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.project_reports ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Project members can view reports for their projects
CREATE POLICY "Members can view project reports"
  ON public.project_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = project_reports.project_id
      AND project_members.user_id = auth.uid()
    )
  );

-- Project leaders can insert reports
CREATE POLICY "Leaders can create project reports"
  ON public.project_reports
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = project_reports.project_id
      AND project_members.user_id = auth.uid()
      AND project_members.role = 'leader'
    )
  );

-- Report creators can update their own reports
CREATE POLICY "Creators can update their reports"
  ON public.project_reports
  FOR UPDATE
  USING (created_by = auth.uid());

-- Report creators can delete their own reports
CREATE POLICY "Creators can delete their reports"
  ON public.project_reports
  FOR DELETE
  USING (created_by = auth.uid());

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_project_reports_project_id ON public.project_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_project_reports_created_by ON public.project_reports(created_by);
CREATE INDEX IF NOT EXISTS idx_project_reports_created_at ON public.project_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_reports_report_type ON public.project_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_project_reports_period ON public.project_reports(period_start, period_end);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  table_exists boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'project_reports' AND table_schema = 'public') INTO table_exists;
  
  RAISE NOTICE 'project_reports table exists: %', table_exists;
  
  IF table_exists THEN
    RAISE NOTICE 'project_reports columns: %', (SELECT string_agg(column_name, ', ') FROM information_schema.columns WHERE table_name = 'project_reports' AND table_schema = 'public');
  END IF;
END $$;
