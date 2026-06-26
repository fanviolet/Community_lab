-- Migration: Add structured planning fields to projects table
-- This replaces free-text project descriptions with structured inputs for AI workflow generation

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS domain TEXT,
ADD COLUMN IF NOT EXISTS project_type TEXT,
ADD COLUMN IF NOT EXISTS team_size INTEGER,
ADD COLUMN IF NOT EXISTS experience_level TEXT,
ADD COLUMN IF NOT EXISTS budget_range TEXT,
ADD COLUMN IF NOT EXISTS duration_days INTEGER,
ADD COLUMN IF NOT EXISTS main_goal TEXT,
ADD COLUMN IF NOT EXISTS deliverables JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS target_audience JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS success_metrics JSONB DEFAULT '[]'::jsonb;

-- Add check constraints for enum values
ALTER TABLE projects
ADD CONSTRAINT check_domain CHECK (
  domain IS NULL OR domain IN ('software', 'education', 'community', 'environmental', 'health', 'startup')
);

ALTER TABLE projects
ADD CONSTRAINT check_project_type CHECK (
  project_type IS NULL OR project_type IN ('web_app', 'mobile_app', 'platform', 'research', 'event', 'campaign', 'training_program', 'community_program', 'other')
);

ALTER TABLE projects
ADD CONSTRAINT check_experience_level CHECK (
  experience_level IS NULL OR experience_level IN ('beginner', 'intermediate', 'advanced')
);

ALTER TABLE projects
ADD CONSTRAINT check_budget_range CHECK (
  budget_range IS NULL OR budget_range IN ('0-5m', '5-20m', '20-100m', '100m+')
);