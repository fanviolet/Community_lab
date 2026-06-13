-- Fix RLS policy issues
-- This migration fixes the proposals table reference which was renamed to pitches

-- Drop the non-existent proposals RLS policies from 0012_rbac_roles.sql
DROP POLICY IF EXISTS "Builders can create proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can view proposals" ON public.proposals;
DROP POLICY IF EXISTS "Proposal creators can edit own proposals" ON public.proposals;
DROP POLICY IF EXISTS "Leaders and experts can edit any proposal" ON public.proposals;
DROP POLICY IF EXISTS "Leaders and experts can delete any proposal" ON public.proposals;

-- Ensure pitches table has proper RLS policies (already exists in 0016_pitch_management.sql)
-- This is a no-op if the policies already exist, but ensures consistency

-- Fix overly permissive RLS policies
-- project_activity_log should only allow project members to insert
DROP POLICY IF EXISTS "Users can insert activity logs" ON public.project_activity_log;

CREATE POLICY "Project members can insert activity logs" ON public.project_activity_log
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_members.project_id = project_activity_log.project_id
            AND project_members.user_id = auth.uid()
        )
        OR auth.jwt() ->> 'role' = 'admin'
    );

-- Fix user_activity_log RLS to be more restrictive
DROP POLICY IF EXISTS "Users can insert activity logs" ON public.user_activity_log;

CREATE POLICY "Users can insert own activity logs" ON public.user_activity_log
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Ensure all tables have RLS enabled
ALTER TABLE public.project_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_activity_log ENABLE ROW LEVEL SECURITY;

-- Add missing RLS policies for team_activity_log
DROP POLICY IF EXISTS "Users can view own activity logs" ON public.team_activity_log;

CREATE POLICY "Users can view own activity logs" ON public.team_activity_log
    FOR SELECT
    USING (profile_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can insert own activity logs" ON public.team_activity_log
    FOR INSERT
    WITH CHECK (profile_id = auth.uid());
