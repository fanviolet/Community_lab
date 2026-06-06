-- Discussion Module - Discord-inspired Community Hub
-- Migration to create tables for channels, messages, reactions, and threads

-- ============================================================================
-- DISCUSSION CHANNELS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.discussion_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  channel_type TEXT DEFAULT 'text' CHECK (channel_type IN ('text', 'announcement', 'project')),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  is_archived BOOLEAN DEFAULT false
);

-- Indexes for channels
CREATE INDEX IF NOT EXISTS idx_discussion_channels_project_id ON public.discussion_channels(project_id);
CREATE INDEX IF NOT EXISTS idx_discussion_channels_created_by ON public.discussion_channels(created_by);
CREATE INDEX IF NOT EXISTS idx_discussion_channels_is_public ON public.discussion_channels(is_public);
CREATE INDEX IF NOT EXISTS idx_discussion_channels_is_archived ON public.discussion_channels(is_archived);

-- ============================================================================
-- DISCUSSION MESSAGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.discussion_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.discussion_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  pinned BOOLEAN DEFAULT false,
  pinned_at TIMESTAMPTZ,
  pinned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reply_to_id UUID REFERENCES public.discussion_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_discussion_messages_channel_id ON public.discussion_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_discussion_messages_user_id ON public.discussion_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_discussion_messages_reply_to_id ON public.discussion_messages(reply_to_id);
CREATE INDEX IF NOT EXISTS idx_discussion_messages_created_at ON public.discussion_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussion_messages_pinned ON public.discussion_messages(pinned);

-- Full-text search on message content
CREATE INDEX IF NOT EXISTS idx_discussion_messages_content_fts ON public.discussion_messages USING gin(to_tsvector('english', content));

-- ============================================================================
-- DISCUSSION REACTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.discussion_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.discussion_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Indexes for reactions
CREATE INDEX IF NOT EXISTS idx_discussion_reactions_message_id ON public.discussion_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_discussion_reactions_user_id ON public.discussion_reactions(user_id);

-- ============================================================================
-- DISCUSSION THREADS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.discussion_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.discussion_messages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for threads
CREATE INDEX IF NOT EXISTS idx_discussion_threads_message_id ON public.discussion_threads(message_id);
CREATE INDEX IF NOT EXISTS idx_discussion_threads_created_by ON public.discussion_threads(created_by);

-- ============================================================================
-- DISCUSSION THREAD MESSAGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.discussion_thread_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.discussion_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for thread messages
CREATE INDEX IF NOT EXISTS idx_discussion_thread_messages_thread_id ON public.discussion_thread_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_discussion_thread_messages_user_id ON public.discussion_thread_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_discussion_thread_messages_created_at ON public.discussion_thread_messages(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.discussion_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_thread_messages ENABLE ROW LEVEL SECURITY;

-- Channels RLS Policies
CREATE POLICY "Channels: Public read access" ON public.discussion_channels
  FOR SELECT USING (is_public = true);

CREATE POLICY "Channels: Project members read access" ON public.discussion_channels
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = discussion_channels.project_id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Channels: Leaders can create" ON public.discussion_channels
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND (
      is_public = true
      OR EXISTS (
        SELECT 1 FROM public.project_members
        WHERE project_members.project_id = discussion_channels.project_id
        AND project_members.user_id = auth.uid()
        AND project_members.role = 'leader'
      )
    )
  );

CREATE POLICY "Channels: Creators can update" ON public.discussion_channels
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Channels: Leaders can archive" ON public.discussion_channels
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = discussion_channels.project_id
      AND project_members.user_id = auth.uid()
      AND project_members.role = 'leader'
    )
  );

-- Messages RLS Policies
CREATE POLICY "Messages: Channel members can read" ON public.discussion_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.discussion_channels
      WHERE discussion_channels.id = discussion_messages.channel_id
      AND (
        discussion_channels.is_public = true
        OR EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_members.project_id = discussion_channels.project_id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Messages: Users can create" ON public.discussion_messages
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.discussion_channels
      WHERE discussion_channels.id = discussion_messages.channel_id
      AND (
        discussion_channels.is_public = true
        OR EXISTS (
          SELECT 1 FROM public.project_members
          WHERE project_members.project_id = discussion_channels.project_id
          AND project_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Messages: Authors can edit" ON public.discussion_messages
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Messages: Authors can delete" ON public.discussion_messages
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Messages: Leaders can pin" ON public.discussion_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.discussion_channels
      WHERE discussion_channels.id = discussion_messages.channel_id
      AND EXISTS (
        SELECT 1 FROM public.project_members
        WHERE project_members.project_id = discussion_channels.project_id
        AND project_members.user_id = auth.uid()
        AND project_members.role = 'leader'
      )
    )
  );

-- Reactions RLS Policies
CREATE POLICY "Reactions: Channel members can read" ON public.discussion_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.discussion_messages
      WHERE discussion_messages.id = discussion_reactions.message_id
      AND EXISTS (
        SELECT 1 FROM public.discussion_channels
        WHERE discussion_channels.id = discussion_messages.channel_id
        AND (
          discussion_channels.is_public = true
          OR EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_members.project_id = discussion_channels.project_id
            AND project_members.user_id = auth.uid()
          )
        )
      )
    )
  );

CREATE POLICY "Reactions: Users can create" ON public.discussion_reactions
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.discussion_messages
      WHERE discussion_messages.id = discussion_reactions.message_id
      AND EXISTS (
        SELECT 1 FROM public.discussion_channels
        WHERE discussion_channels.id = discussion_messages.channel_id
        AND (
          discussion_channels.is_public = true
          OR EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_members.project_id = discussion_channels.project_id
            AND project_members.user_id = auth.uid()
          )
        )
      )
    )
  );

CREATE POLICY "Reactions: Users can delete own" ON public.discussion_reactions
  FOR DELETE USING (user_id = auth.uid());

-- Threads RLS Policies
CREATE POLICY "Threads: Channel members can read" ON public.discussion_threads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.discussion_messages
      WHERE discussion_messages.id = discussion_threads.message_id
      AND EXISTS (
        SELECT 1 FROM public.discussion_channels
        WHERE discussion_channels.id = discussion_messages.channel_id
        AND (
          discussion_channels.is_public = true
          OR EXISTS (
            SELECT 1 FROM public.project_members
            WHERE project_members.project_id = discussion_channels.project_id
            AND project_members.user_id = auth.uid()
          )
        )
      )
    )
  );

CREATE POLICY "Threads: Users can create" ON public.discussion_threads
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.discussion_messages
      WHERE discussion_messages.id = discussion_threads.message_id
      AND discussion_messages.user_id = auth.uid()
    )
  );

-- Thread Messages RLS Policies
CREATE POLICY "Thread Messages: Thread participants can read" ON public.discussion_thread_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.discussion_threads
      WHERE discussion_threads.id = discussion_thread_messages.thread_id
      AND EXISTS (
        SELECT 1 FROM public.discussion_messages
        WHERE discussion_messages.id = discussion_threads.message_id
        AND EXISTS (
          SELECT 1 FROM public.discussion_channels
          WHERE discussion_channels.id = discussion_messages.channel_id
          AND (
            discussion_channels.is_public = true
            OR EXISTS (
              SELECT 1 FROM public.project_members
              WHERE project_members.project_id = discussion_channels.project_id
              AND project_members.user_id = auth.uid()
            )
          )
        )
      )
    )
  );

CREATE POLICY "Thread Messages: Users can create" ON public.discussion_thread_messages
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.discussion_threads
      WHERE discussion_threads.id = discussion_thread_messages.thread_id
      AND EXISTS (
        SELECT 1 FROM public.discussion_messages
        WHERE discussion_messages.id = discussion_threads.message_id
        AND EXISTS (
          SELECT 1 FROM public.discussion_channels
          WHERE discussion_channels.id = discussion_messages.channel_id
          AND (
            discussion_channels.is_public = true
            OR EXISTS (
              SELECT 1 FROM public.project_members
              WHERE project_members.project_id = discussion_channels.project_id
              AND project_members.user_id = auth.uid()
            )
          )
        )
      )
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp for channels
CREATE OR REPLACE FUNCTION update_discussion_channels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER discussion_channels_updated_at
  BEFORE UPDATE ON public.discussion_channels
  FOR EACH ROW
  EXECUTE FUNCTION update_discussion_channels_updated_at();

-- ============================================================================
-- DEFAULT CHANNELS
-- ============================================================================

-- Function to create default channels
CREATE OR REPLACE FUNCTION create_default_channels()
RETURNS VOID AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get first admin user (or any user for initial setup)
  SELECT id INTO admin_user_id FROM public.profiles LIMIT 1;
  
  IF admin_user_id IS NOT NULL THEN
    -- Create default public channels
    INSERT INTO public.discussion_channels (name, description, is_public, channel_type, created_by)
    VALUES 
      ('general', 'General discussions and community updates', true, 'text', admin_user_id),
      ('ideas', 'Share and discuss new ideas', true, 'text', admin_user_id),
      ('problems', 'Report and discuss issues', true, 'text', admin_user_id),
      ('announcements', 'Official announcements from admins', true, 'announcement', admin_user_id),
      ('volunteers', 'Find volunteer opportunities', true, 'text', admin_user_id)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute default channel creation
SELECT create_default_channels();
