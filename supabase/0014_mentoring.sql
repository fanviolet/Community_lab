-- Mentoring Module
-- Create tables for mentor directory, mentorship requests, sessions, and progress tracking

-- Mentor profiles table (extends profiles with mentor-specific info)
CREATE TABLE IF NOT EXISTS public.mentor_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  expertise TEXT[] NOT NULL DEFAULT '{}',
  bio TEXT,
  availability TEXT,
  years_experience INTEGER DEFAULT 0,
  mentorship_count INTEGER DEFAULT 0,
  rating_avg NUMERIC(2, 1) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Mentorship requests table
CREATE TABLE IF NOT EXISTS public.mentorship_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  mentor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  requested_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  challenge_description TEXT NOT NULL,
  expected_outcome TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mentoring sessions table
CREATE TABLE IF NOT EXISTS public.mentoring_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentorship_request_id UUID REFERENCES public.mentorship_requests(id) ON DELETE CASCADE NOT NULL,
  topic TEXT NOT NULL,
  session_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  action_items TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Progress tracking table
CREATE TABLE IF NOT EXISTS public.mentoring_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentorship_request_id UUID REFERENCES public.mentorship_requests(id) ON DELETE CASCADE NOT NULL,
  issue TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'blocked')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mentor feedback table
CREATE TABLE IF NOT EXISTS public.mentor_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentorship_request_id UUID REFERENCES public.mentorship_requests(id) ON DELETE CASCADE NOT NULL,
  from_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  to_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Communication timeline table
CREATE TABLE IF NOT EXISTS public.mentor_communications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentorship_request_id UUID REFERENCES public.mentorship_requests(id) ON DELETE CASCADE NOT NULL,
  from_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  message TEXT NOT NULL,
  communication_type TEXT DEFAULT 'message' CHECK (communication_type IN ('message', 'note', 'update', 'feedback')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_user_id ON public.mentor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_expertise ON public.mentor_profiles USING GIN(expertise);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_project_id ON public.mentorship_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_mentor_id ON public.mentorship_requests(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_requested_by ON public.mentorship_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_status ON public.mentorship_requests(status);
CREATE INDEX IF NOT EXISTS idx_mentoring_sessions_request_id ON public.mentoring_sessions(mentorship_request_id);
CREATE INDEX IF NOT EXISTS idx_mentoring_sessions_date ON public.mentoring_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_mentoring_progress_request_id ON public.mentoring_progress(mentorship_request_id);
CREATE INDEX IF NOT EXISTS idx_mentoring_progress_status ON public.mentoring_progress(status);
CREATE INDEX IF NOT EXISTS idx_mentor_feedback_request_id ON public.mentor_feedback(mentorship_request_id);
CREATE INDEX IF NOT EXISTS idx_mentor_communications_request_id ON public.mentor_communications(mentorship_request_id);
CREATE INDEX IF NOT EXISTS idx_mentor_communications_created_at ON public.mentor_communications(created_at DESC);

-- Row Level Security policies

-- Enable RLS
ALTER TABLE public.mentor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentoring_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentoring_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_communications ENABLE ROW LEVEL SECURITY;

-- Mentor profiles policies
CREATE POLICY "Anyone can view mentor profiles"
  ON public.mentor_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Mentors can edit own profile"
  ON public.mentor_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can edit any mentor profile"
  ON public.mentor_profiles
  FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Mentors can create own profile"
  ON public.mentor_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Mentorship requests policies
CREATE POLICY "Users can create mentorship requests"
  ON public.mentorship_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Users can view own mentorship requests"
  ON public.mentorship_requests
  FOR SELECT
  TO authenticated
  USING (
    requested_by = auth.uid()
    OR mentor_id = auth.uid()
    OR public.get_user_role() IN ('leader', 'admin')
  );

CREATE POLICY "Mentors can update requests for their mentorships"
  ON public.mentorship_requests
  FOR UPDATE
  TO authenticated
  USING (
    mentor_id = auth.uid()
    OR public.get_user_role() IN ('leader', 'admin')
  )
  WITH CHECK (
    mentor_id = auth.uid()
    OR public.get_user_role() IN ('leader', 'admin')
  );

CREATE POLICY "Users can delete own requests"
  ON public.mentorship_requests
  FOR DELETE
  TO authenticated
  USING (
    requested_by = auth.uid()
    OR public.get_user_role() = 'admin'
  );

-- Mentoring sessions policies
CREATE POLICY "Users can create sessions for their mentorships"
  ON public.mentoring_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.mentorship_requests
      WHERE mentorship_requests.id = mentoring_sessions.mentorship_request_id
      AND (mentorship_requests.mentor_id = auth.uid() OR mentorship_requests.requested_by = auth.uid())
    )
  );

CREATE POLICY "Users can view sessions for their mentorships"
  ON public.mentoring_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.mentorship_requests
      WHERE mentorship_requests.id = mentoring_sessions.mentorship_request_id
      AND (mentorship_requests.mentor_id = auth.uid() OR mentorship_requests.requested_by = auth.uid())
    )
    OR public.get_user_role() IN ('leader', 'admin')
  );

CREATE POLICY "Users can update own sessions"
  ON public.mentoring_sessions
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

CREATE POLICY "Users can delete own sessions"
  ON public.mentoring_sessions
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR public.get_user_role() = 'admin'
  );

-- Progress tracking policies
CREATE POLICY "Users can view progress for their mentorships"
  ON public.mentoring_progress
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.mentorship_requests
      WHERE mentorship_requests.id = mentoring_progress.mentorship_request_id
      AND (mentorship_requests.mentor_id = auth.uid() OR mentorship_requests.requested_by = auth.uid())
    )
    OR public.get_user_role() IN ('leader', 'admin')
  );

CREATE POLICY "Users can create progress for their mentorships"
  ON public.mentoring_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.mentorship_requests
      WHERE mentorship_requests.id = mentoring_progress.mentorship_request_id
      AND (mentorship_requests.mentor_id = auth.uid() OR mentorship_requests.requested_by = auth.uid())
    )
  );

CREATE POLICY "Users can update progress for their mentorships"
  ON public.mentoring_progress
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.mentorship_requests
      WHERE mentorship_requests.id = mentoring_progress.mentorship_request_id
      AND (mentorship_requests.mentor_id = auth.uid() OR mentorship_requests.requested_by = auth.uid())
    )
    OR public.get_user_role() IN ('leader', 'admin')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.mentorship_requests
      WHERE mentorship_requests.id = mentoring_progress.mentorship_request_id
      AND (mentorship_requests.mentor_id = auth.uid() OR mentorship_requests.requested_by = auth.uid())
    )
    OR public.get_user_role() IN ('leader', 'admin')
  );

CREATE POLICY "Users can delete progress for their mentorships"
  ON public.mentoring_progress
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.mentorship_requests
      WHERE mentorship_requests.id = mentoring_progress.mentorship_request_id
      AND (mentorship_requests.mentor_id = auth.uid() OR mentorship_requests.requested_by = auth.uid())
    )
    OR public.get_user_role() = 'admin'
  );

-- Mentor feedback policies
CREATE POLICY "Users can create feedback for their mentorships"
  ON public.mentor_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (
    from_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.mentorship_requests
      WHERE mentorship_requests.id = mentor_feedback.mentorship_request_id
      AND (mentorship_requests.mentor_id = auth.uid() OR mentorship_requests.requested_by = auth.uid())
    )
  );

CREATE POLICY "Users can view feedback for their mentorships"
  ON public.mentor_feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.mentorship_requests
      WHERE mentorship_requests.id = mentor_feedback.mentorship_request_id
      AND (mentorship_requests.mentor_id = auth.uid() OR mentorship_requests.requested_by = auth.uid())
    )
    OR public.get_user_role() IN ('leader', 'admin')
  );

-- Communication timeline policies
CREATE POLICY "Users can create communications for their mentorships"
  ON public.mentor_communications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    from_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.mentorship_requests
      WHERE mentorship_requests.id = mentor_communications.mentorship_request_id
      AND (mentorship_requests.mentor_id = auth.uid() OR mentorship_requests.requested_by = auth.uid())
    )
  );

CREATE POLICY "Users can view communications for their mentorships"
  ON public.mentor_communications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.mentorship_requests
      WHERE mentorship_requests.id = mentor_communications.mentorship_request_id
      AND (mentorship_requests.mentor_id = auth.uid() OR mentorship_requests.requested_by = auth.uid())
    )
    OR public.get_user_role() IN ('leader', 'admin')
  );

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mentor_profiles_updated_at
  BEFORE UPDATE ON public.mentor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER mentorship_requests_updated_at
  BEFORE UPDATE ON public.mentorship_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER mentoring_sessions_updated_at
  BEFORE UPDATE ON public.mentoring_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER mentoring_progress_updated_at
  BEFORE UPDATE ON public.mentoring_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to update mentor rating when feedback is added
CREATE OR REPLACE FUNCTION public.update_mentor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.mentor_profiles
  SET rating_avg = (
    SELECT AVG(rating)
    FROM public.mentor_feedback
    WHERE to_user_id = NEW.to_user_id
  ),
  rating_count = (
    SELECT COUNT(*)
    FROM public.mentor_feedback
    WHERE to_user_id = NEW.to_user_id
  )
  WHERE user_id = NEW.to_user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mentor_rating_trigger
  AFTER INSERT ON public.mentor_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_mentor_rating();
