-- Project Management Module
-- Create tables for tasks, milestones, activity logs, and project metrics

-- Tasks table
CREATE TABLE IF NOT EXISTS public.project_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  estimated_hours NUMERIC(5, 2),
  actual_hours NUMERIC(5, 2),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Milestones table
CREATE TABLE IF NOT EXISTS public.project_milestones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_date TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity log table
CREATE TABLE IF NOT EXISTS public.project_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES public.project_tasks(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('task', 'milestone', 'project', 'member')),
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task dependencies table
CREATE TABLE IF NOT EXISTS public.task_dependencies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.project_tasks(id) ON DELETE CASCADE NOT NULL,
  depends_on_task_id UUID REFERENCES public.project_tasks(id) ON DELETE CASCADE NOT NULL,
  dependency_type TEXT DEFAULT 'finish_to_start' CHECK (dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, depends_on_task_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON public.project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_assigned_to ON public.project_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON public.project_tasks(status);
CREATE INDEX IF NOT EXISTS idx_project_tasks_due_date ON public.project_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_project_tasks_created_by ON public.project_tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_project_tasks_tags ON public.project_tasks USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON public.project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_status ON public.project_milestones(status);
CREATE INDEX IF NOT EXISTS idx_project_milestones_target_date ON public.project_milestones(target_date);

CREATE INDEX IF NOT EXISTS idx_project_activity_log_project_id ON public.project_activity_log(project_id);
CREATE INDEX IF NOT EXISTS idx_project_activity_log_user_id ON public.project_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_project_activity_log_created_at ON public.project_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_activity_log_entity ON public.project_activity_log(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id ON public.task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on ON public.task_dependencies(depends_on_task_id);

-- Row Level Security policies

-- Enable RLS
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;

-- Tasks policies
CREATE POLICY "Project members can view tasks"
  ON public.project_tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = project_tasks.project_id
      AND project_members.user_id = auth.uid()
    )
    OR created_by = auth.uid()
    OR assigned_to = auth.uid()
    OR public.get_user_role() IN ('leader', 'admin')
  );

CREATE POLICY "Project members can create tasks"
  ON public.project_tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = project_tasks.project_id
      AND project_members.user_id = auth.uid()
    )
    OR public.get_user_role() IN ('leader', 'admin')
  );

CREATE POLICY "Task assignee or creator can edit tasks"
  ON public.project_tasks
  FOR UPDATE
  TO authenticated
  USING (
    assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR public.get_user_role() IN ('leader', 'admin')
  )
  WITH CHECK (
    assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR public.get_user_role() IN ('leader', 'admin')
  );

CREATE POLICY "Task creator or leader can delete tasks"
  ON public.project_tasks
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR public.get_user_role() IN ('leader', 'admin')
  );

-- Milestones policies
CREATE POLICY "Project members can view milestones"
  ON public.project_milestones
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = project_milestones.project_id
      AND project_members.user_id = auth.uid()
    )
    OR public.get_user_role() IN ('leader', 'admin')
  );

CREATE POLICY "Leaders can create milestones"
  ON public.project_milestones
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = project_milestones.project_id
      AND project_members.role = 'leader'
      AND project_members.user_id = auth.uid()
    )
    OR public.get_user_role() IN ('leader', 'admin')
  );

CREATE POLICY "Leaders can edit milestones"
  ON public.project_milestones
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

CREATE POLICY "Leaders can delete milestones"
  ON public.project_milestones
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR public.get_user_role() = 'admin'
  );

-- Activity log policies
CREATE POLICY "Project members can view activity log"
  ON public.project_activity_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = project_activity_log.project_id
      AND project_members.user_id = auth.uid()
    )
    OR public.get_user_role() IN ('leader', 'admin')
  );

CREATE POLICY "System can create activity log"
  ON public.project_activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Task dependencies policies
CREATE POLICY "Project members can view dependencies"
  ON public.task_dependencies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_tasks
      WHERE project_tasks.id = task_dependencies.task_id
      AND EXISTS (
        SELECT 1 FROM public.project_members
        WHERE project_members.project_id = project_tasks.project_id
        AND project_members.user_id = auth.uid()
      )
    )
    OR public.get_user_role() IN ('leader', 'admin')
  );

CREATE POLICY "Project members can create dependencies"
  ON public.task_dependencies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_tasks
      WHERE project_tasks.id = task_dependencies.task_id
      AND EXISTS (
        SELECT 1 FROM public.project_members
        WHERE project_members.project_id = project_tasks.project_id
        AND project_members.user_id = auth.uid()
      )
    )
    OR public.get_user_role() IN ('leader', 'admin')
  );

CREATE POLICY "Project members can delete dependencies"
  ON public.task_dependencies
  FOR DELETE
  TO authenticated
  USING (
    public.get_user_role() IN ('leader', 'admin')
  );

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_tasks_updated_at
  BEFORE UPDATE ON public.project_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER project_milestones_updated_at
  BEFORE UPDATE ON public.project_milestones
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to log activity
CREATE OR REPLACE FUNCTION public.log_project_activity()
RETURNS TRIGGER AS $$
DECLARE
  old_val JSONB;
  new_val JSONB;
BEGIN
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
      OLD.project_id,
      OLD.id,
      auth.uid(),
      'deleted',
      TG_TABLE_NAME,
      OLD.id,
      old_val
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_project_tasks_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.project_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.log_project_activity();

CREATE TRIGGER log_project_milestones_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.project_milestones
  FOR EACH ROW
  EXECUTE FUNCTION public.log_project_activity();
