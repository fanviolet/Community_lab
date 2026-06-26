-- User Management Module
-- Add user status, activity tracking, and statistics for user management

-- Add status column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active'
  CHECK (status IN ('active', 'suspended', 'deactivated'));

CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- Update role check to include guest and builder
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('guest', 'member', 'builder', 'expert', 'mentor', 'leader', 'admin'));

-- User statistics table
CREATE TABLE IF NOT EXISTS public.user_statistics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  problems_created INTEGER DEFAULT 0,
  problems_solved INTEGER DEFAULT 0,
  projects_joined INTEGER DEFAULT 0,
  projects_led INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  reviews_completed INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  votes_cast INTEGER DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_statistics_user_id ON public.user_statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_statistics_last_activity ON public.user_statistics(last_activity_at DESC);

-- User activity log table
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON public.user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_action ON public.user_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON public.user_activity_log(created_at DESC);

-- Row Level Security

ALTER TABLE public.user_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- User statistics policies
CREATE POLICY "Admins can view all user statistics"
  ON public.user_statistics
  FOR SELECT
  TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Users can view own statistics"
  ON public.user_statistics
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can update statistics"
  ON public.user_statistics
  FOR ALL
  TO authenticated
  USING (true);

-- User activity log policies
CREATE POLICY "Admins can view all activity logs"
  ON public.user_activity_log
  FOR SELECT
  TO authenticated
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Users can view own activity logs"
  ON public.user_activity_log
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create activity logs"
  ON public.user_activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Updated at trigger for statistics
CREATE TRIGGER user_statistics_updated_at
  BEFORE UPDATE ON public.user_statistics
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to initialize user statistics
CREATE OR REPLACE FUNCTION public.initialize_user_statistics(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  stats_id UUID;
BEGIN
  INSERT INTO public.user_statistics (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO stats_id;
  
  RETURN stats_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log user activity
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_user_id UUID,
  p_action TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.user_activity_log (
    user_id,
    action,
    entity_type,
    entity_id,
    metadata,
    ip_address,
    user_agent
  )
  VALUES (
    p_user_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_metadata,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO log_id;
  
  -- Update last activity timestamp
  INSERT INTO public.user_statistics (user_id, last_activity_at)
  VALUES (p_user_id, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    last_activity_at = NOW(),
    updated_at = NOW();
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment user statistics
CREATE OR REPLACE FUNCTION public.increment_user_stat(
  p_user_id UUID,
  p_stat_column TEXT
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.user_statistics (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id)
  DO UPDATE SET
    last_activity_at = NOW(),
    updated_at = NOW(),
    problems_created = CASE WHEN p_stat_column = 'problems_created' THEN user_statistics.problems_created + 1 ELSE user_statistics.problems_created END,
    problems_solved = CASE WHEN p_stat_column = 'problems_solved' THEN user_statistics.problems_solved + 1 ELSE user_statistics.problems_solved END,
    projects_joined = CASE WHEN p_stat_column = 'projects_joined' THEN user_statistics.projects_joined + 1 ELSE user_statistics.projects_joined END,
    projects_led = CASE WHEN p_stat_column = 'projects_led' THEN user_statistics.projects_led + 1 ELSE user_statistics.projects_led END,
    tasks_completed = CASE WHEN p_stat_column = 'tasks_completed' THEN user_statistics.tasks_completed + 1 ELSE user_statistics.tasks_completed END,
    reviews_completed = CASE WHEN p_stat_column = 'reviews_completed' THEN user_statistics.reviews_completed + 1 ELSE user_statistics.reviews_completed END,
    comments_count = CASE WHEN p_stat_column = 'comments_count' THEN user_statistics.comments_count + 1 ELSE user_statistics.comments_count END,
    votes_cast = CASE WHEN p_stat_column = 'votes_cast' THEN user_statistics.votes_cast + 1 ELSE user_statistics.votes_cast END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user directory with filters
CREATE OR REPLACE FUNCTION public.get_user_directory(
  p_search TEXT DEFAULT NULL,
  p_role TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  email TEXT,
  role TEXT,
  status TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  statistics JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.display_name,
    p.email,
    p.role,
    p.status,
    p.avatar_url,
    p.created_at,
    COALESCE(
      jsonb_build_object(
        'problems_created', COALESCE(us.problems_created, 0),
        'projects_joined', COALESCE(us.projects_joined, 0),
        'tasks_completed', COALESCE(us.tasks_completed, 0),
        'last_activity', us.last_activity_at
      ),
      '{}'::jsonb
    ) as statistics
  FROM public.profiles p
  LEFT JOIN public.user_statistics us ON p.id = us.user_id
  WHERE
    (p_search IS NULL OR 
     p.display_name ILIKE '%' || p_search || '%' OR 
     p.email ILIKE '%' || p_search || '%')
    AND (p_role IS NULL OR p.role = p_role)
    AND (p_status IS NULL OR p.status = p_status)
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Initialize statistics for existing users
INSERT INTO public.user_statistics (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;
