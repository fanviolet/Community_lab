-- Workspace Chat UX Improvements
-- 1. Create message_mentions table for tracking @mentions
-- 2. Add username field support for mentions
-- 3. Add RLS policies for mentions

-- ============================================================================
-- MESSAGE MENTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.message_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.discussion_messages(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, mentioned_user_id)
);

-- Indexes for mentions
CREATE INDEX IF NOT EXISTS idx_message_mentions_message_id ON public.message_mentions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_mentions_mentioned_user_id ON public.message_mentions(mentioned_user_id);

-- ============================================================================
-- ROW LEVEL SECURITY FOR MENTIONS
-- ============================================================================

ALTER TABLE public.message_mentions ENABLE ROW LEVEL SECURITY;

-- Users can read mentions where they are the mentioned user or the message author
CREATE POLICY "Mentions: Users can read own mentions" ON public.message_mentions
  FOR SELECT USING (
    mentioned_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.discussion_messages
      WHERE discussion_messages.id = message_mentions.message_id
      AND discussion_messages.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.discussion_messages dm
      JOIN public.discussion_channels dc ON dc.id = dm.channel_id
      WHERE dm.id = message_mentions.message_id
      AND (
        dc.is_public = true
        OR EXISTS (
          SELECT 1 FROM public.project_members pm
          WHERE pm.project_id = dc.project_id
          AND pm.user_id = auth.uid()
        )
      )
    )
  );

-- System can create mentions (via function or authenticated users with message access)
CREATE POLICY "Mentions: Users can create in accessible channels" ON public.message_mentions
  FOR INSERT WITH CHECK (
    mentioned_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.discussion_messages dm
      JOIN public.discussion_channels dc ON dc.id = dm.channel_id
      WHERE dm.id = message_mentions.message_id
      AND dm.user_id = auth.uid()
      AND (
        dc.is_public = true
        OR EXISTS (
          SELECT 1 FROM public.project_members pm
          WHERE pm.project_id = dc.project_id
          AND pm.user_id = auth.uid()
        )
      )
    )
  );

-- Users can delete their own mentions
CREATE POLICY "Mentions: Users can delete own mentions" ON public.message_mentions
  FOR DELETE USING (mentioned_user_id = auth.uid());

-- ============================================================================
-- FUNCTION TO GET WORKSPACE MEMBERS FOR MENTION AUTOCOMPLETE
-- ============================================================================

CREATE OR REPLACE FUNCTION get_workspace_members(project_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT,
  email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pm.id,
    pm.user_id,
    p.username,
    p.full_name,
    p.avatar_url,
    pm.role,
    p.email
  FROM public.project_members pm
  JOIN public.profiles p ON p.id = pm.user_id
  WHERE pm.project_id = project_id
  ORDER BY pm.role DESC, p.full_name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION TO PARSE AND CREATE MENTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION process_message_mentions(
  p_message_id UUID,
  p_content TEXT,
  p_project_id UUID
) RETURNS VOID AS $$
DECLARE
  mention_regex TEXT := '@\[([^\]]+)\]';
  matches TEXT[];
  match_item TEXT;
  mentioned_user RECORD;
BEGIN
  -- Extract all @mentions from content
  matches := regexp_matches(p_content, mention_regex, 'g');
  
  IF matches IS NOT NULL AND array_length(matches, 1) > 0 THEN
    FOREACH match_item IN ARRAY matches LOOP
      -- Find user by username (case-insensitive)
      SELECT id INTO mentioned_user
      FROM public.profiles
      WHERE username ILIKE match_item
      LIMIT 1;
      
      -- Verify user is in the workspace (if project_id provided)
      IF mentioned_user.id IS NOT NULL AND p_project_id IS NOT NULL THEN
        IF EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_id = p_project_id AND user_id = mentioned_user.id
        ) THEN
          -- Insert mention (ignore duplicates)
          INSERT INTO public.message_mentions (message_id, mentioned_user_id)
          VALUES (p_message_id, mentioned_user.id)
          ON CONFLICT (message_id, mentioned_user_id) DO NOTHING;
        END IF;
      ELSIF mentioned_user.id IS NOT NULL THEN
        -- For public channels, allow mentions without workspace check
        INSERT INTO public.message_mentions (message_id, mentioned_user_id)
        VALUES (p_message_id, mentioned_user.id)
        ON CONFLICT (message_id, mentioned_user_id) DO NOTHING;
      END IF;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  table_count INT;
  policy_count INT;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_name = 'message_mentions' AND table_schema = 'public';
  
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'message_mentions' AND schemaname = 'public';
  
  RAISE NOTICE 'message_mentions table created: %', table_count > 0;
  RAISE NOTICE 'message_mentions policies created: %', policy_count;
END $$;