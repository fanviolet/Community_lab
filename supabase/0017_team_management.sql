-- Team Management Module
-- Create tables for team invitations, member skills, and team analytics

-- Team invitations table
CREATE TABLE IF NOT EXISTS public.team_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'leader', 'builder', 'expert', 'mentor', 'member')),
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Member skills table
CREATE TABLE IF NOT EXISTS public.member_skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  skill_name TEXT NOT NULL,
  proficiency_level TEXT NOT NULL CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  years_experience NUMERIC(3, 1),
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, skill_name)
);

-- Member availability table
CREATE TABLE IF NOT EXISTS public.member_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week IN (0, 1, 2, 3, 4, 5, 6)),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, day_of_week)
);

-- Member contributions table
CREATE TABLE IF NOT EXISTS public.member_contributions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  contribution_type TEXT NOT NULL CHECK (contribution_type IN ('task', 'comment', 'pitch', 'analysis', 'mentorship', 'code_review')),
  contribution_id UUID NOT NULL,
  contribution_title TEXT,
  contribution_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  impact_score NUMERIC(3, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team activity log table
CREATE TABLE IF NOT EXISTS public.team_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('login', 'task_completed', 'pitch_submitted', 'review_completed', 'mentorship_session', 'comment_posted', 'analysis_created')),
  activity_description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_invitations_email ON public.team_invitations(email);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON public.team_invitations(status);
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON public.team_invitations(token);
CREATE INDEX IF NOT EXISTS idx_team_invitations_expires_at ON public.team_invitations(expires_at);

CREATE INDEX IF NOT EXISTS idx_member_skills_profile_id ON public.member_skills(profile_id);
CREATE INDEX IF NOT EXISTS idx_member_skills_skill_name ON public.member_skills(skill_name);
CREATE INDEX IF NOT EXISTS idx_member_skills_proficiency ON public.member_skills(proficiency_level);

CREATE INDEX IF NOT EXISTS idx_member_availability_profile_id ON public.member_availability(profile_id);
CREATE INDEX IF NOT EXISTS idx_member_availability_day ON public.member_availability(day_of_week);

CREATE INDEX IF NOT EXISTS idx_member_contributions_profile_id ON public.member_contributions(profile_id);
CREATE INDEX IF NOT EXISTS idx_member_contributions_type ON public.member_contributions(contribution_type);
CREATE INDEX IF NOT EXISTS idx_member_contributions_date ON public.member_contributions(contribution_date DESC);

CREATE INDEX IF NOT EXISTS idx_team_activity_log_profile_id ON public.team_activity_log(profile_id);
CREATE INDEX IF NOT EXISTS idx_team_activity_log_type ON public.team_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_team_activity_log_created_at ON public.team_activity_log(created_at DESC);

-- Row Level Security policies

-- Enable RLS
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_activity_log ENABLE ROW LEVEL SECURITY;

-- Team invitations policies
CREATE POLICY "Users can view invitations they created"
  ON public.team_invitations
  FOR SELECT
  TO authenticated
  USING (invited_by = auth.uid());

CREATE POLICY "Leaders and admins can view all invitations"
  ON public.team_invitations
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() IN ('leader', 'admin')
  );

CREATE POLICY "Leaders and admins can create invitations"
  ON public.team_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() IN ('leader', 'admin')
  );

CREATE POLICY "Leaders and admins can update invitations"
  ON public.team_invitations
  FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role() IN ('leader', 'admin')
  )
  WITH CHECK (
    public.get_user_role() IN ('leader', 'admin')
  );

CREATE POLICY "Leaders and admins can delete invitations"
  ON public.team_invitations
  FOR DELETE
  TO authenticated
  USING (
    public.get_user_role() IN ('leader', 'admin')
  );

-- Member skills policies
CREATE POLICY "Users can view their own skills"
  ON public.member_skills
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "All authenticated users can view skills"
  ON public.member_skills
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own skills"
  ON public.member_skills
  FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own skills"
  ON public.member_skills
  FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can delete their own skills"
  ON public.member_skills
  FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Admins can verify skills"
  ON public.member_skills
  FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.member_skills
      WHERE id = member_skills.id
      AND profile_id != auth.uid()
    )
  )
  WITH CHECK (
    public.get_user_role() = 'admin'
  );

-- Member availability policies
CREATE POLICY "Users can view their own availability"
  ON public.member_availability
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Leaders and admins can view all availability"
  ON public.member_availability
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() IN ('leader', 'admin')
  );

CREATE POLICY "Users can create their own availability"
  ON public.member_availability
  FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update their own availability"
  ON public.member_availability
  FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can delete their own availability"
  ON public.member_availability
  FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

-- Member contributions policies
CREATE POLICY "Users can view their own contributions"
  ON public.member_contributions
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Leaders and admins can view all contributions"
  ON public.member_contributions
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() IN ('leader', 'admin')
  );

CREATE POLICY "System can create contributions"
  ON public.member_contributions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update contributions"
  ON public.member_contributions
  FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Admins can delete contributions"
  ON public.member_contributions
  FOR DELETE
  TO authenticated
  USING (public.get_user_role() = 'admin');

-- Team activity log policies
CREATE POLICY "Users can view their own activity"
  ON public.team_activity_log
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Leaders and admins can view all activity"
  ON public.team_activity_log
  FOR SELECT
  TO authenticated
  USING (
    public.get_user_role() IN ('leader', 'admin')
  );

CREATE POLICY "System can create activity logs"
  ON public.team_activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Updated at triggers
CREATE TRIGGER member_skills_updated_at
  BEFORE UPDATE ON public.member_skills
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER member_availability_updated_at
  BEFORE UPDATE ON public.member_availability
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to generate invitation token
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log team activity
CREATE OR REPLACE FUNCTION public.log_team_activity(
  p_profile_id UUID,
  p_activity_type TEXT,
  p_activity_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO public.team_activity_log (
    profile_id,
    activity_type,
    activity_description,
    metadata
  )
  VALUES (
    p_profile_id,
    p_activity_type,
    p_activity_description,
    p_metadata
  )
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
