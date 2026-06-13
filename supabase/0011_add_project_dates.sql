-- Migration: Add project timeline columns
-- Run this in Supabase SQL Editor if start_date/end_date are missing

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS start_date date;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS end_date date;

CREATE INDEX IF NOT EXISTS idx_projects_start_date ON public.projects(start_date);
CREATE INDEX IF NOT EXISTS idx_projects_end_date ON public.projects(end_date);
