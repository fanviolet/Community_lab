"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications/createNotification";
import type {
  CreateTaskInput,
  UpdateTaskInput,
  CreateMilestoneInput,
  UpdateMilestoneInput,
  CreateDependencyInput,
  ProjectTaskWithRelations,
  ProjectMilestoneWithRelations,
  ProjectActivityLogWithUser,
  ProjectMetrics,
  Project,
} from "@/types/project-management";

// Task Actions
export async function getTasks(projectId: string, filters?: {
  status?: string;
  assigned_to?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("project_tasks")
    .select(`
      *,
      project:projects(id, title),
      assignee:profiles(id, full_name, email, avatar_url),
      creator:profiles(id, full_name, email)
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.assigned_to) {
    query = query.eq("assigned_to", filters.assigned_to);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as ProjectTaskWithRelations[];
}

export async function getTaskById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("project_tasks")
    .select(`
      *,
      project:projects(id, title),
      assignee:profiles(id, full_name, email, avatar_url),
      creator:profiles(id, full_name, email)
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as ProjectTaskWithRelations;
}

export async function createTask(input: CreateTaskInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("project_tasks")
    .insert({
      ...input,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/workspace/${input.project_id}`);
  return data;
}

export async function updateTask(id: string, input: UpdateTaskInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Get current task to detect changes
  const { data: currentTask } = await supabase
    .from("project_tasks")
    .select("assigned_to, status, title, project_id, created_by")
    .eq("id", id)
    .single();

  const updateData: any = { ...input };
  
  if (input.status === "done" && !input.completed_at) {
    updateData.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("project_tasks")
    .update(updateData)
    .eq("id", id)
    .select(`
      *,
      project:projects(id, title)
    `)
    .single();

  if (error) throw error;

  // Task Assignment Notification
  if (input.assigned_to && input.assigned_to !== currentTask?.assigned_to) {
    try {
      await createNotification({
        userId: input.assigned_to,
        type: "task_assigned",
        message: `Bạn vừa được giao nhiệm vụ: ${data.title}`,
        link: `/dashboard/projects/${data.project_id}/tasks`,
      });
      console.log("[updateTask] Task assignment notification created for user:", input.assigned_to);
    } catch (notificationError) {
      console.error("[updateTask] Task assignment notification creation failed:", notificationError);
      // Don't throw - task was updated successfully
    }
  }

  // Task Completed Notification
  if (input.status === "done" && currentTask?.status !== "done") {
    // Notify all project members (leaders and members)
    const { data: projectMembers } = await supabase
      .from("project_members")
      .select("user_id")
      .eq("project_id", data.project_id);

    if (projectMembers) {
      for (const member of projectMembers) {
        try {
          await createNotification({
            userId: member.user_id,
            type: "task_completed",
            message: `Nhiệm vụ "${data.title}" đã hoàn thành`,
            link: `/dashboard/projects/${data.project_id}/tasks`,
          });
          console.log("[updateTask] Task completion notification created for user:", member.user_id);
        } catch (notificationError) {
          console.error("[updateTask] Task completion notification creation failed for user:", member.user_id, notificationError);
          // Don't throw - continue with other members
        }
      }
    }

    // Notify task creator
    if (currentTask?.created_by && currentTask.created_by !== user.id) {
      try {
        await createNotification({
          userId: currentTask.created_by,
          type: "task_completed",
          message: `Nhiệm vụ "${data.title}" đã hoàn thành`,
          link: `/dashboard/projects/${data.project_id}/tasks`,
        });
        console.log("[updateTask] Task completion notification created for task creator:", currentTask.created_by);
      } catch (notificationError) {
        console.error("[updateTask] Task completion notification creation failed for task creator:", notificationError);
        // Don't throw - task was updated successfully
      }
    }
  }

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/workspace/${input.project_id}`);
  return data;
}

export async function deleteTask(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("project_tasks")
    .delete()
    .eq("id", id);

  if (error) throw error;

  revalidatePath("/dashboard/projects");
}

// Milestone Actions
export async function getMilestones(projectId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("project_milestones")
    .select(`
      *,
      project:projects(id, title),
      creator:profiles(id, full_name, email)
    `)
    .eq("project_id", projectId)
    .order("target_date", { ascending: true });

  if (error) throw error;
  return data as ProjectMilestoneWithRelations[];
}

export async function getMilestoneById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("project_milestones")
    .select(`
      *,
      project:projects(id, title),
      creator:profiles(id, full_name, email)
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as ProjectMilestoneWithRelations;
}

export async function createMilestone(input: CreateMilestoneInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("project_milestones")
    .insert({
      ...input,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/workspace/${input.project_id}`);
  return data;
}

export async function updateMilestone(id: string, input: UpdateMilestoneInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const updateData: any = { ...input };
  
  if (input.status === "completed" && !input.completed_at) {
    updateData.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("project_milestones")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/workspace/${input.project_id}`);
  return data;
}

export async function deleteMilestone(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("project_milestones")
    .delete()
    .eq("id", id);

  if (error) throw error;

  revalidatePath("/dashboard/projects");
}

// Activity Log Actions
export async function getActivityLog(projectId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("project_activity_log")
    .select(`
      *,
      user:profiles(id, full_name, email, avatar_url)
    `)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data as ProjectActivityLogWithUser[];
}

// Dependency Actions
export async function getTaskDependencies(taskId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("task_dependencies")
    .select("*")
    .eq("task_id", taskId);

  if (error) throw error;
  return data;
}

export async function createDependency(input: CreateDependencyInput) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("task_dependencies")
    .insert(input)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dashboard/projects");
  return data;
}

export async function deleteDependency(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("task_dependencies")
    .delete()
    .eq("id", id);

  if (error) throw error;

  revalidatePath("/dashboard/projects");
}

// Metrics Actions
export async function getProjectMetrics(projectId: string): Promise<ProjectMetrics> {
  const supabase = await createClient();

  const [tasksResult, milestonesResult] = await Promise.all([
    supabase
      .from("project_tasks")
      .select("status, due_date, estimated_hours, actual_hours")
      .eq("project_id", projectId),
    supabase
      .from("project_milestones")
      .select("status")
      .eq("project_id", projectId),
  ]);

  if (tasksResult.error) throw tasksResult.error;
  if (milestonesResult.error) throw milestonesResult.error;

  const tasks = tasksResult.data || [];
  const milestones = milestonesResult.data || [];

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t: { status: string }) => t.status === "done").length;
  const inProgressTasks = tasks.filter((t: { status: string }) => t.status === "in_progress").length;
  const overdueTasks = tasks.filter(
    (t: { due_date: string | null; status: string }) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "done"
  ).length;
  const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const totalEstimatedHours = tasks.reduce((sum: number, t: { estimated_hours: number | null }) => sum + (t.estimated_hours || 0), 0);
  const totalActualHours = tasks.reduce((sum: number, t: { actual_hours: number | null }) => sum + (t.actual_hours || 0), 0);
  const activeMilestones = milestones.filter((m: { status: string }) => m.status === "in_progress").length;
  const completedMilestones = milestones.filter((m: { status: string }) => m.status === "completed").length;

  return {
    total_tasks: totalTasks,
    completed_tasks: completedTasks,
    in_progress_tasks: inProgressTasks,
    overdue_tasks: overdueTasks,
    completion_percentage: completionPercentage,
    total_estimated_hours: totalEstimatedHours,
    total_actual_hours: totalActualHours,
    active_milestones: activeMilestones,
    completed_milestones: completedMilestones,
  };
}

// Helper Actions
export async function getProjects(): Promise<Project[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select("id, title, status")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Project[];
}

export async function getProjectMembers(projectId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("project_members")
    .select(`
      user_id,
      role,
      profiles(id, full_name, email, avatar_url)
    `)
    .eq("project_id", projectId);

  if (error) throw error;
  return data;
}

export async function getUsers() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url")
    .order("full_name", { ascending: true });

  if (error) throw error;
  return data;
}
