export interface Project {
  id: string;
  title: string;
  status: string;
}

export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type MilestoneStatus = "pending" | "in_progress" | "completed" | "delayed";
export type DependencyType = "finish_to_start" | "start_to_start" | "finish_to_finish" | "start_to_finish";
export type ActivityAction = "created" | "updated" | "deleted" | "assigned" | "status_changed";
export type EntityType = "task" | "milestone" | "project" | "member";

export interface ProjectTask {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: string | null;
  created_by: string;
  due_date: string | null;
  completed_at: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ProjectTaskWithRelations extends ProjectTask {
  project?: {
    id: string;
    title: string;
  };
  assignee?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  creator?: {
    id: string;
    full_name: string | null;
    email: string;
  };
  dependencies?: TaskDependency[];
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  target_date: string;
  completed_at: string | null;
  status: MilestoneStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMilestoneWithRelations extends ProjectMilestone {
  project?: {
    id: string;
    title: string;
  };
  creator?: {
    id: string;
    full_name: string | null;
    email: string;
  };
}

export interface ProjectActivityLog {
  id: string;
  project_id: string;
  task_id: string | null;
  user_id: string;
  action: ActivityAction;
  entity_type: EntityType;
  entity_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
}

export interface ProjectActivityLogWithUser extends ProjectActivityLog {
  user?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export interface TaskDependency {
  id: string;
  task_id: string;
  depends_on_task_id: string;
  dependency_type: DependencyType;
  created_at: string;
}

export interface CreateTaskInput {
  project_id: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigned_to?: string;
  due_date?: string;
  estimated_hours?: number;
  tags?: string[];
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  status?: TaskStatus;
  completed_at?: string;
  actual_hours?: number;
}

export interface CreateMilestoneInput {
  project_id: string;
  title: string;
  description?: string;
  target_date: string;
  status?: MilestoneStatus;
}

export interface UpdateMilestoneInput extends Partial<CreateMilestoneInput> {
  completed_at?: string;
}

export interface CreateDependencyInput {
  task_id: string;
  depends_on_task_id: string;
  dependency_type?: DependencyType;
}

export interface ProjectMetrics {
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  overdue_tasks: number;
  completion_percentage: number;
  total_estimated_hours: number;
  total_actual_hours: number;
  active_milestones: number;
  completed_milestones: number;
}
