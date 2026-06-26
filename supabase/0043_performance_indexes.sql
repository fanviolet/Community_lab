-- Performance indexes for common dashboard query patterns

CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_members_project_role ON public.project_members(project_id, role);
CREATE INDEX IF NOT EXISTS idx_tasks_project_status_due ON public.tasks(project_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_project_created ON public.activities(project_id, created_at DESC);
