-- Migration: Group layer above Project
-- Creates groups, group_members, group_join_requests
-- Adds group_id to root resources and updates RLS

-- ============================================================================
-- 1. GROUPS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  is_public boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_groups_slug ON public.groups(slug);
CREATE INDEX IF NOT EXISTS idx_groups_is_public ON public.groups(is_public);

-- ============================================================================
-- 2. GROUP MEMBERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'leader')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);

-- ============================================================================
-- 3. GROUP JOIN REQUESTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.group_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message text,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_group_join_requests_group_id ON public.group_join_requests(group_id);
CREATE INDEX IF NOT EXISTS idx_group_join_requests_user_id ON public.group_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_group_join_requests_status ON public.group_join_requests(status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_group_join_requests_pending_unique
  ON public.group_join_requests(group_id, user_id)
  WHERE status = 'pending';

-- ============================================================================
-- 4. ADD group_id TO ROOT RESOURCES
-- ============================================================================

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.groups(id) ON DELETE RESTRICT;

ALTER TABLE public.problems
  ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.groups(id) ON DELETE RESTRICT;

ALTER TABLE public.pitches
  ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.groups(id) ON DELETE RESTRICT;

ALTER TABLE public.discussion_channels
  ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.groups(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_projects_group_id ON public.projects(group_id);
CREATE INDEX IF NOT EXISTS idx_problems_group_id ON public.problems(group_id);
CREATE INDEX IF NOT EXISTS idx_pitches_group_id ON public.pitches(group_id);
CREATE INDEX IF NOT EXISTS idx_discussion_channels_group_id ON public.discussion_channels(group_id);

-- ============================================================================
-- 5. BACKFILL DEFAULT GROUP
-- ============================================================================

INSERT INTO public.groups (id, name, slug, description, is_public, created_at, updated_at)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'Community Lab',
  'community-lab',
  'Default community group for existing CPL data',
  true,
  now(),
  now()
)
ON CONFLICT (slug) DO NOTHING;

DO $$
DECLARE
  v_default_group_id uuid;
BEGIN
  SELECT id INTO v_default_group_id
  FROM public.groups
  WHERE slug = 'community-lab'
  LIMIT 1;

  UPDATE public.projects SET group_id = v_default_group_id WHERE group_id IS NULL;
  UPDATE public.problems SET group_id = v_default_group_id WHERE group_id IS NULL;
  UPDATE public.pitches SET group_id = v_default_group_id WHERE group_id IS NULL;
  UPDATE public.discussion_channels SET group_id = v_default_group_id WHERE group_id IS NULL;

  INSERT INTO public.group_members (group_id, user_id, role)
  SELECT v_default_group_id, p.id, 'member'
  FROM public.profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = v_default_group_id AND gm.user_id = p.id
  );

  UPDATE public.group_members
  SET role = 'leader'
  WHERE group_id = v_default_group_id
    AND user_id IN (
      SELECT DISTINCT pm.user_id
      FROM public.project_members pm
      WHERE pm.role = 'leader'
    );
END $$;

ALTER TABLE public.projects ALTER COLUMN group_id SET NOT NULL;
ALTER TABLE public.problems ALTER COLUMN group_id SET NOT NULL;
ALTER TABLE public.pitches ALTER COLUMN group_id SET NOT NULL;
ALTER TABLE public.discussion_channels ALTER COLUMN group_id SET NOT NULL;

-- ============================================================================
-- 5b. FIX AUDIT TRIGGERS FOR MIGRATION SAFETY
-- Auth triggers use auth.uid() which is NULL during migration backfill.
-- Guard against NULL to preserve NOT NULL constraints on history tables.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_pitch_history()
RETURNS TRIGGER AS $$
DECLARE
  old_val JSONB;
  new_val JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'INSERT' THEN
    new_val := to_jsonb(NEW);
    INSERT INTO public.pitch_history (
      pitch_id,
      user_id,
      action,
      new_value
    )
    VALUES (
      NEW.id,
      auth.uid(),
      'created',
      new_val
    );
  ELSIF TG_OP = 'UPDATE' THEN
    old_val := to_jsonb(OLD);
    new_val := to_jsonb(NEW);

    IF OLD.status != NEW.status THEN
      INSERT INTO public.pitch_history (
        pitch_id,
        user_id,
        action,
        old_value,
        new_value
      )
      VALUES (
        NEW.id,
        auth.uid(),
        'status_changed',
        jsonb_build_object('status', OLD.status),
        jsonb_build_object('status', NEW.status)
      );
    END IF;

    INSERT INTO public.pitch_history (
      pitch_id,
      user_id,
      action,
      old_value,
      new_value
    )
    VALUES (
      NEW.id,
      auth.uid(),
      'updated',
      old_val,
      new_val
    );
  ELSIF TG_OP = 'DELETE' THEN
    old_val := to_jsonb(OLD);
    INSERT INTO public.pitch_history (
      pitch_id,
      user_id,
      action,
      old_value
    )
    VALUES (
      OLD.id,
      auth.uid(),
      'deleted',
      old_val
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.log_project_activity()
RETURNS TRIGGER AS $$
DECLARE
  old_val JSONB;
  new_val JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'INSERT' THEN
    new_val := to_jsonb(NEW);
    INSERT INTO public.project_activity_log (
      project_id,
      task_id,
      user_id,
      action,
      entity_type,
      entity_id,
      new_value
    )
    VALUES (
      NEW.project_id,
      NEW.id,
      auth.uid(),
      'created',
      TG_TABLE_NAME,
      NEW.id,
      new_val
    );
  ELSIF TG_OP = 'UPDATE' THEN
    old_val := to_jsonb(OLD);
    new_val := to_jsonb(NEW);
    INSERT INTO public.project_activity_log (
      project_id,
      task_id,
      user_id,
      action,
      entity_type,
      entity_id,
      old_value,
      new_value
    )
    VALUES (
      NEW.project_id,
      NEW.id,
      auth.uid(),
      'updated',
      TG_TABLE_NAME,
      NEW.id,
      old_val,
      new_val
    );
  ELSIF TG_OP = 'DELETE' THEN
    old_val := to_jsonb(OLD);
    INSERT INTO public.project_activity_log (
      project_id,
      task_id,
      user_id,
      action,
      entity_type,
      entity_id,
      old_value
    )
    VALUES (
      NEW.project_id,
      NEW.id,
      auth.uid(),
      'deleted',
      TG_TABLE_NAME,
      NEW.id,
      old_val
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. GROUP HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_leader(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id
      AND user_id = auth.uid()
      AND role = 'leader'
  );
$$;

CREATE OR REPLACE FUNCTION public.can_discover_group(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = p_group_id
      AND (
        public.is_admin()
        OR g.is_public = true
        OR public.is_group_member(g.id)
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_group_internal(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin() OR public.is_group_member(p_group_id);
$$;

CREATE OR REPLACE FUNCTION public.can_access_project_resource(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects p
    INNER JOIN public.project_members pm
      ON pm.project_id = p.id AND pm.user_id = auth.uid()
    WHERE p.id = p_project_id
      AND (public.is_admin() OR public.is_group_member(p.group_id))
  );
$$;

CREATE OR REPLACE FUNCTION public.get_project_group_id(p_project_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT group_id FROM public.projects WHERE id = p_project_id;
$$;

-- ============================================================================
-- 7. JOIN REQUEST RPCs
-- ============================================================================

CREATE OR REPLACE FUNCTION public.request_group_join(
  p_group_id uuid,
  p_message text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.can_discover_group(p_group_id) THEN
    RAISE EXCEPTION 'Group not discoverable';
  END IF;

  IF public.is_group_member(p_group_id) THEN
    RAISE EXCEPTION 'Already a group member';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.group_join_requests
    WHERE group_id = p_group_id
      AND user_id = auth.uid()
      AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Join request already pending';
  END IF;

  INSERT INTO public.group_join_requests (group_id, user_id, message)
  VALUES (p_group_id, auth.uid(), p_message)
  RETURNING id INTO v_request_id;

  RETURN v_request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_group_join_request(
  p_request_id uuid,
  p_approve boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id uuid;
  v_user_id uuid;
  v_status text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT group_id, user_id, status
  INTO v_group_id, v_user_id, v_status
  FROM public.group_join_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Join request not found';
  END IF;

  IF v_status <> 'pending' THEN
    RAISE EXCEPTION 'Join request already reviewed';
  END IF;

  IF NOT (public.is_admin() OR public.is_group_leader(v_group_id)) THEN
    RAISE EXCEPTION 'Not authorized to review join requests';
  END IF;

  UPDATE public.group_join_requests
  SET
    status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
    reviewed_by = auth.uid(),
    reviewed_at = now()
  WHERE id = p_request_id;

  IF p_approve THEN
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (v_group_id, v_user_id, 'member')
    ON CONFLICT (group_id, user_id) DO NOTHING;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_group_join(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_group_join_request(uuid, boolean) TO authenticated;

-- ============================================================================
-- 8. GROUPS RLS
-- ============================================================================

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Groups discoverable by authenticated users" ON public.groups;
DROP POLICY IF EXISTS "Admins can manage groups" ON public.groups;
DROP POLICY IF EXISTS "Group leaders can update their groups" ON public.groups;

CREATE POLICY "Groups discoverable by authenticated users"
  ON public.groups
  FOR SELECT
  TO authenticated
  USING (public.can_discover_group(id));

CREATE POLICY "Authenticated users can create groups"
  ON public.groups
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid() OR public.is_admin());

CREATE POLICY "Group leaders and admins can update groups"
  ON public.groups
  FOR UPDATE
  TO authenticated
  USING (public.is_admin() OR public.is_group_leader(id));

CREATE POLICY "Admins can delete groups"
  ON public.groups
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- 9. GROUP MEMBERS RLS
-- ============================================================================

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Group members visible to group members" ON public.group_members;
DROP POLICY IF EXISTS "Leaders can add group members" ON public.group_members;
DROP POLICY IF EXISTS "Leaders can update group members" ON public.group_members;
DROP POLICY IF EXISTS "Leaders can remove group members" ON public.group_members;

CREATE POLICY "Group members visible to group members"
  ON public.group_members
  FOR SELECT
  TO authenticated
  USING (public.is_admin() OR public.is_group_member(group_id));

CREATE POLICY "Leaders can add group members"
  ON public.group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() OR public.is_group_leader(group_id));

CREATE POLICY "Leaders can update group members"
  ON public.group_members
  FOR UPDATE
  TO authenticated
  USING (public.is_admin() OR public.is_group_leader(group_id));

CREATE POLICY "Leaders can remove group members"
  ON public.group_members
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
    OR public.is_group_leader(group_id)
    OR user_id = auth.uid()
  );

-- ============================================================================
-- 10. GROUP JOIN REQUESTS RLS
-- ============================================================================

ALTER TABLE public.group_join_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own join requests" ON public.group_join_requests;
DROP POLICY IF EXISTS "Leaders can view group join requests" ON public.group_join_requests;
DROP POLICY IF EXISTS "Users can create join requests via RPC only" ON public.group_join_requests;

CREATE POLICY "Users can view own join requests"
  ON public.group_join_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Leaders can view group join requests"
  ON public.group_join_requests
  FOR SELECT
  TO authenticated
  USING (public.is_admin() OR public.is_group_leader(group_id));

-- Direct inserts blocked; use request_group_join RPC
CREATE POLICY "Block direct join request inserts"
  ON public.group_join_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- ============================================================================
-- 11. PROJECTS RLS — GROUP + PROJECT MEMBERSHIP
-- ============================================================================

DROP POLICY IF EXISTS "Project members can view projects" ON public.projects;
DROP POLICY IF EXISTS "Leaders and admins can create projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Project leaders can update projects" ON public.projects;
DROP POLICY IF EXISTS "Project leaders can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects;

CREATE POLICY "Project members can view projects"
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR (
      public.is_group_member(group_id)
      AND public.is_project_member(id)
    )
  );

CREATE POLICY "Group members can create projects"
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    OR public.is_group_member(group_id)
  );

CREATE POLICY "Project leaders can update projects"
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR (
      public.is_group_member(group_id)
      AND public.is_project_leader(id)
    )
  );

CREATE POLICY "Project leaders can delete projects"
  ON public.projects
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
    OR (
      public.is_group_member(group_id)
      AND public.is_project_leader(id)
    )
  );

-- ============================================================================
-- 12. PROBLEMS RLS — GROUP SCOPED
-- ============================================================================

DROP POLICY IF EXISTS "Problems viewable by all authenticated" ON public.problems;
DROP POLICY IF EXISTS "Members can create problems" ON public.problems;
DROP POLICY IF EXISTS "Users can edit own problems" ON public.problems;
DROP POLICY IF EXISTS "Users can delete own problems" ON public.problems;

CREATE POLICY "Group members can view problems"
  ON public.problems
  FOR SELECT
  TO authenticated
  USING (public.is_admin() OR public.can_access_group_internal(group_id));

CREATE POLICY "Group members can create problems"
  ON public.problems
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    OR (
      public.can_access_group_internal(group_id)
      AND public.get_user_role() IN ('member', 'expert', 'mentor', 'leader', 'admin')
    )
  );

CREATE POLICY "Group members can edit own problems"
  ON public.problems
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR (
      public.can_access_group_internal(group_id)
      AND (
        author_id = auth.uid()
        OR public.get_user_role() IN ('leader')
      )
    )
  );

CREATE POLICY "Group members can delete own problems"
  ON public.problems
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
    OR (
      public.can_access_group_internal(group_id)
      AND (
        author_id = auth.uid()
        OR public.get_user_role() IN ('leader')
      )
    )
  );

-- ============================================================================
-- 13. PITCHES RLS — GROUP SCOPED
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own pitches" ON public.pitches;
DROP POLICY IF EXISTS "Leaders and experts can view all pitches" ON public.pitches;
DROP POLICY IF EXISTS "Group members can view pitches" ON public.pitches;

CREATE POLICY "Group members can view pitches"
  ON public.pitches
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR public.can_access_group_internal(group_id)
  );

DROP POLICY IF EXISTS "Builders can create pitches" ON public.pitches;

CREATE POLICY "Group members can create pitches"
  ON public.pitches
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      public.is_admin()
      OR (
        public.can_access_group_internal(group_id)
        AND public.get_user_role() IN ('member', 'builder', 'leader', 'admin')
      )
    )
  );

-- ============================================================================
-- 14. DISCUSSION CHANNELS RLS — GROUP SCOPED
-- ============================================================================

DROP POLICY IF EXISTS "Channels: Public read access" ON public.discussion_channels;
DROP POLICY IF EXISTS "Channels: Project members read access" ON public.discussion_channels;
DROP POLICY IF EXISTS "Channels: Leaders can create" ON public.discussion_channels;
DROP POLICY IF EXISTS "Group members can view channels" ON public.discussion_channels;
DROP POLICY IF EXISTS "Group members can create channels" ON public.discussion_channels;

CREATE POLICY "Group members can view channels"
  ON public.discussion_channels
  FOR SELECT
  TO authenticated
  USING (public.is_admin() OR public.can_access_group_internal(group_id));

CREATE POLICY "Group members can create channels"
  ON public.discussion_channels
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (public.is_admin() OR public.can_access_group_internal(group_id))
  );

-- ============================================================================
-- 15. CHILD RESOURCES — INHERIT VIA PROJECT → GROUP
-- ============================================================================

DROP POLICY IF EXISTS "Project members can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Project members can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Assignee or leader can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Leaders can delete tasks" ON public.tasks;

CREATE POLICY "Project members can view tasks"
  ON public.tasks FOR SELECT TO authenticated
  USING (public.is_admin() OR public.can_access_project_resource(project_id));

CREATE POLICY "Project members can create tasks"
  ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR public.can_access_project_resource(project_id));

CREATE POLICY "Assignee or leader can update tasks"
  ON public.tasks FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    OR assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.project_members pm
      JOIN public.projects p ON p.id = pm.project_id
      WHERE pm.project_id = tasks.project_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'leader'
        AND public.is_group_member(p.group_id)
    )
  );

CREATE POLICY "Leaders can delete tasks"
  ON public.tasks FOR DELETE TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.project_members pm
      JOIN public.projects p ON p.id = pm.project_id
      WHERE pm.project_id = tasks.project_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'leader'
        AND public.is_group_member(p.group_id)
    )
  );

DROP POLICY IF EXISTS "Members can view project reports" ON public.project_reports;
DROP POLICY IF EXISTS "Leaders can create project reports" ON public.project_reports;

CREATE POLICY "Members can view project reports"
  ON public.project_reports FOR SELECT
  USING (public.is_admin() OR public.can_access_project_resource(project_id));

CREATE POLICY "Leaders can create project reports"
  ON public.project_reports FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.project_members pm
      JOIN public.projects p ON p.id = pm.project_id
      WHERE pm.project_id = project_reports.project_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'leader'
        AND public.is_group_member(p.group_id)
    )
  );

DROP POLICY IF EXISTS "Members can view project workflows" ON public.ai_workflows;
DROP POLICY IF EXISTS "Leaders can create project workflows" ON public.ai_workflows;

CREATE POLICY "Members can view project workflows"
  ON public.ai_workflows FOR SELECT
  USING (public.is_admin() OR public.can_access_project_resource(project_id));

CREATE POLICY "Leaders can create project workflows"
  ON public.ai_workflows FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.project_members pm
      JOIN public.projects p ON p.id = pm.project_id
      WHERE pm.project_id = ai_workflows.project_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'leader'
        AND public.is_group_member(p.group_id)
    )
  );

DROP POLICY IF EXISTS "Project members can view tasks" ON public.project_tasks;
DROP POLICY IF EXISTS "Project members can create tasks" ON public.project_tasks;

CREATE POLICY "Project members can view project_tasks"
  ON public.project_tasks FOR SELECT TO authenticated
  USING (public.is_admin() OR public.can_access_project_resource(project_id));

CREATE POLICY "Project members can create project_tasks"
  ON public.project_tasks FOR INSERT TO authenticated
  WITH CHECK (public.is_admin() OR public.can_access_project_resource(project_id));

-- ============================================================================
-- 16. DISCUSSION MESSAGES — INHERIT VIA CHANNEL → GROUP
-- ============================================================================

DROP POLICY IF EXISTS "Messages: Channel members can read" ON public.discussion_messages;
DROP POLICY IF EXISTS "Messages: Users can create" ON public.discussion_messages;

CREATE POLICY "Messages: Group members can read"
  ON public.discussion_messages FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.discussion_channels dc
      WHERE dc.id = discussion_messages.channel_id
        AND public.can_access_group_internal(dc.group_id)
    )
  );

CREATE POLICY "Messages: Group members can create"
  ON public.discussion_messages FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.discussion_channels dc
      WHERE dc.id = discussion_messages.channel_id
        AND public.can_access_group_internal(dc.group_id)
    )
  );

-- ============================================================================
-- 17. AUTO-ADD GROUP CREATOR AS LEADER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_group()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'leader')
    ON CONFLICT (group_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_group_created ON public.groups;
CREATE TRIGGER on_group_created
  AFTER INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_group();
