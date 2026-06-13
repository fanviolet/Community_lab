-- Fix duplicate function definitions
-- This migration consolidates the handle_updated_at function to ensure it's defined consistently

-- Drop the function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

-- Create a unified handle_updated_at function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to all tables that need it
-- Expert analyses
DROP TRIGGER IF EXISTS expert_analyses_updated_at ON public.expert_analyses;
CREATE TRIGGER expert_analyses_updated_at
    BEFORE UPDATE ON public.expert_analyses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS expert_scorecards_updated_at ON public.expert_scorecards;
CREATE TRIGGER expert_scorecards_updated_at
    BEFORE UPDATE ON public.expert_scorecards
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Mentoring tables
DROP TRIGGER IF EXISTS mentor_profiles_updated_at ON public.mentor_profiles;
CREATE TRIGGER mentor_profiles_updated_at
    BEFORE UPDATE ON public.mentor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS mentoring_sessions_updated_at ON public.mentoring_sessions;
CREATE TRIGGER mentoring_sessions_updated_at
    BEFORE UPDATE ON public.mentoring_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS mentoring_progress_updated_at ON public.mentoring_progress;
CREATE TRIGGER mentoring_progress_updated_at
    BEFORE UPDATE ON public.mentoring_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Project management tables
DROP TRIGGER IF EXISTS project_tasks_updated_at ON public.project_tasks;
CREATE TRIGGER project_tasks_updated_at
    BEFORE UPDATE ON public.project_tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS project_milestones_updated_at ON public.project_milestones;
CREATE TRIGGER project_milestones_updated_at
    BEFORE UPDATE ON public.project_milestones
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Pitch management tables
DROP TRIGGER IF EXISTS pitches_updated_at ON public.pitches;
CREATE TRIGGER pitches_updated_at
    BEFORE UPDATE ON public.pitches
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Team management tables
DROP TRIGGER IF EXISTS member_skills_updated_at ON public.member_skills;
CREATE TRIGGER member_skills_updated_at
    BEFORE UPDATE ON public.member_skills
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS member_availability_updated_at ON public.member_availability;
CREATE TRIGGER member_availability_updated_at
    BEFORE UPDATE ON public.member_availability
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- System settings tables
DROP TRIGGER IF EXISTS system_settings_updated_at ON public.system_settings;
CREATE TRIGGER system_settings_updated_at
    BEFORE UPDATE ON public.system_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS ai_settings_updated_at ON public.ai_settings;
CREATE TRIGGER ai_settings_updated_at
    BEFORE UPDATE ON public.ai_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS prompt_templates_updated_at ON public.prompt_templates;
CREATE TRIGGER prompt_templates_updated_at
    BEFORE UPDATE ON public.prompt_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS workflow_settings_updated_at ON public.workflow_settings;
CREATE TRIGGER workflow_settings_updated_at
    BEFORE UPDATE ON public.workflow_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS notification_settings_updated_at ON public.notification_settings;
CREATE TRIGGER notification_settings_updated_at
    BEFORE UPDATE ON public.notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS security_settings_updated_at ON public.security_settings;
CREATE TRIGGER security_settings_updated_at
    BEFORE UPDATE ON public.security_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
