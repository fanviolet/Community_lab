"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ============================================================================
// TYPES
// ============================================================================

interface ActionResult {
  success: boolean;
  error?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getSupabaseClient() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return { supabase, user };
}

async function isProjectLeader(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  projectId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .eq("role", "leader")
    .maybeSingle();

  return !!data;
}

async function isProjectMember(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  projectId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("project_members")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  return !!data;
}

async function logActivity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  userId: string,
  userName: string,
  action: string,
  description: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  await supabase.from("activities").insert({
    project_id: projectId,
    user_id: userId,
    user_name: userName,
    action,
    description,
    metadata,
  });
}

// ============================================================================
// PROJECT ACTIONS
// ============================================================================

export async function createProject(formData: FormData): Promise<ActionResult> {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "").trim();
  const endDate = String(formData.get("endDate") ?? "").trim();

  if (!title) {
    return { success: false, error: "Project title is required" };
  }

  const { supabase, user } = await getSupabaseClient();

  // Get user name for activity log
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const userName = profile?.full_name || user.email;

  // Create project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      title,
      description: description || null,
      status: "active",
    })
    .select()
    .single();

  if (projectError) {
    console.error("[createProject] Error:", projectError);
    return { success: false, error: projectError.message };
  }

  // Add creator as leader
  const { error: memberError } = await supabase.from("project_members").insert({
    project_id: project.id,
    user_id: user.id,
    role: "leader",
    name: userName,
    email: user.email,
  });

  if (memberError) {
    console.error("[createProject] Error adding member:", memberError);
    return { success: false, error: memberError.message };
  }

  // Log activity
  await logActivity(
    supabase,
    project.id,
    user.id,
    userName,
    "project_created",
    `Created project: ${title}`,
    { title }
  );

  revalidatePath("/dashboard/workspace");
  redirect(`/dashboard/workspace/${project.id}`);
}

export async function updateProject(formData: FormData): Promise<void> {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "active").trim();

  if (!projectId || !title) {
    throw new Error("Missing required fields");
  }

  const { supabase, user } = await getSupabaseClient();

  // Check if user is a leader
  const isLeader = await isProjectLeader(supabase, user.id, projectId);
  if (!isLeader) {
    throw new Error("Only project leaders can update projects");
  }

  // Get user name for activity log
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const userName = profile?.full_name || user.email;

  // Update project
  const { error } = await supabase
    .from("projects")
    .update({
      title,
      description: description || null,
      status,
    })
    .eq("id", projectId);

  if (error) {
    console.error("[updateProject] Error:", error);
    throw new Error(error.message);
  }

  // Log activity
  await logActivity(
    supabase,
    projectId,
    user.id,
    userName,
    "project_updated",
    `Updated project: ${title}`,
    { title, status }
  );

  revalidatePath(`/dashboard/workspace/${projectId}`);
}

export async function archiveProject(formData: FormData): Promise<void> {
  const projectId = String(formData.get("projectId") ?? "").trim();

  if (!projectId) {
    throw new Error("Project ID is required");
  }

  const { supabase, user } = await getSupabaseClient();

  // Check if user is a leader
  const isLeader = await isProjectLeader(supabase, user.id, projectId);
  if (!isLeader) {
    throw new Error("Only project leaders can archive projects");
  }

  // Get project title for activity log
  const { data: project } = await supabase
    .from("projects")
    .select("title")
    .eq("id", projectId)
    .maybeSingle();

  // Get user name for activity log
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const userName = profile?.full_name || user.email;

  // Archive project
  const { error } = await supabase
    .from("projects")
    .update({ status: "archived" })
    .eq("id", projectId);

  if (error) {
    console.error("[archiveProject] Error:", error);
    throw new Error(error.message);
  }

  // Log activity
  await logActivity(
    supabase,
    projectId,
    user.id,
    userName,
    "project_archived",
    `Archived project: ${project?.title || projectId}`,
    {}
  );

  revalidatePath("/dashboard/workspace");
  revalidatePath(`/dashboard/workspace/${projectId}`);
}

export async function restoreProject(formData: FormData): Promise<void> {
  const projectId = String(formData.get("projectId") ?? "").trim();

  if (!projectId) {
    throw new Error("Project ID is required");
  }

  const { supabase, user } = await getSupabaseClient();

  // Check if user is a leader
  const isLeader = await isProjectLeader(supabase, user.id, projectId);
  if (!isLeader) {
    throw new Error("Only project leaders can restore projects");
  }

  // Get project title for activity log
  const { data: project } = await supabase
    .from("projects")
    .select("title")
    .eq("id", projectId)
    .maybeSingle();

  // Get user name for activity log
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const userName = profile?.full_name || user.email;

  // Restore project
  const { error } = await supabase
    .from("projects")
    .update({ status: "active" })
    .eq("id", projectId);

  if (error) {
    console.error("[restoreProject] Error:", error);
    throw new Error(error.message);
  }

  // Log activity
  await logActivity(
    supabase,
    projectId,
    user.id,
    userName,
    "project_restored",
    `Restored project: ${project?.title || projectId}`,
    {}
  );

  revalidatePath("/dashboard/workspace");
  revalidatePath(`/dashboard/workspace/${projectId}`);
}

// ============================================================================
// TASK ACTIONS
// ============================================================================

export async function createTask(formData: FormData): Promise<ActionResult> {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const assignedUser = String(formData.get("assignedUser") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "").trim();
  const priority = String(formData.get("priority") ?? "medium").trim();

  if (!projectId || !title) {
    return { success: false, error: "Project ID and title are required" };
  }

  const { supabase, user } = await getSupabaseClient();

  // Check if user is a member
  const isMember = await isProjectMember(supabase, user.id, projectId);
  if (!isMember) {
    return { success: false, error: "You must be a project member to create tasks" };
  }

  // Get user name for activity log
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const userName = profile?.full_name || user.email;

  // Create task
  const { error } = await supabase.from("tasks").insert({
    project_id: projectId,
    title,
    description: description || null,
    status: "todo",
    priority: priority || "medium",
    assigned_user: assignedUser || null,
    assigned_to: null,
    due_date: dueDate || null,
  });

  if (error) {
    console.error("[createTask] Error:", error);
    return { success: false, error: error.message };
  }

  // Log activity
  await logActivity(
    supabase,
    projectId,
    user.id,
    userName,
    "task_created",
    `Created task: ${title}`,
    { title, priority }
  );

  revalidatePath(`/dashboard/workspace/${projectId}`);
  return { success: true };
}

export async function updateTask(formData: FormData): Promise<ActionResult> {
  const taskId = String(formData.get("taskId") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const assignedUser = String(formData.get("assignedUser") ?? "").trim();
  const status = String(formData.get("status") ?? "todo").trim();
  const dueDate = String(formData.get("dueDate") ?? "").trim();
  const priority = String(formData.get("priority") ?? "medium").trim();

  if (!taskId || !projectId || !title) {
    return { success: false, error: "Missing required fields" };
  }

  const { supabase, user } = await getSupabaseClient();

  // Check if user can update this task (leader or assignee)
  const isLeader = await isProjectLeader(supabase, user.id, projectId);
  const { data: task } = await supabase
    .from("tasks")
    .select("assigned_to")
    .eq("id", taskId)
    .maybeSingle();

  if (!isLeader && task?.assigned_to !== user.id) {
    return { success: false, error: "You can only update your own tasks" };
  }

  // Get user name for activity log
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const userName = profile?.full_name || user.email;

  // Update task
  const { error } = await supabase
    .from("tasks")
    .update({
      title,
      description: description || null,
      assigned_user: assignedUser || null,
      status: status || "todo",
      priority: priority || "medium",
      due_date: dueDate || null,
    })
    .eq("id", taskId);

  if (error) {
    console.error("[updateTask] Error:", error);
    return { success: false, error: error.message };
  }

  // Log activity
  await logActivity(
    supabase,
    projectId,
    user.id,
    userName,
    "task_updated",
    `Updated task: ${title}`,
    { task_id: taskId, status, priority }
  );

  revalidatePath(`/dashboard/workspace/${projectId}`);
  return { success: true };
}

export async function deleteTask(formData: FormData): Promise<ActionResult> {
  const taskId = String(formData.get("taskId") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "").trim();

  if (!taskId || !projectId) {
    return { success: false, error: "Task ID and project ID are required" };
  }

  const { supabase, user } = await getSupabaseClient();

  // Only leaders can delete tasks
  const isLeader = await isProjectLeader(supabase, user.id, projectId);
  if (!isLeader) {
    return { success: false, error: "Only project leaders can delete tasks" };
  }

  // Get task title for activity log
  const { data: task } = await supabase
    .from("tasks")
    .select("title")
    .eq("id", taskId)
    .maybeSingle();

  // Get user name for activity log
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const userName = profile?.full_name || user.email;

  // Delete task
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  if (error) {
    console.error("[deleteTask] Error:", error);
    return { success: false, error: error.message };
  }

  // Log activity
  await logActivity(
    supabase,
    projectId,
    user.id,
    userName,
    "task_deleted",
    `Deleted task: ${task?.title || taskId}`,
    { task_id: taskId }
  );

  revalidatePath(`/dashboard/workspace/${projectId}`);
  return { success: true };
}

export async function toggleTaskComplete(formData: FormData): Promise<ActionResult> {
  const taskId = String(formData.get("taskId") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const currentStatus = String(formData.get("currentStatus") ?? "").trim();

  if (!taskId || !projectId) {
    return { success: false, error: "Task ID and project ID are required" };
  }

  const { supabase, user } = await getSupabaseClient();

  // Check if user can update this task (leader or assignee)
  const isLeader = await isProjectLeader(supabase, user.id, projectId);
  const { data: task } = await supabase
    .from("tasks")
    .select("assigned_to, title")
    .eq("id", taskId)
    .maybeSingle();

  if (!isLeader && task?.assigned_to !== user.id) {
    return { success: false, error: "You can only update your own tasks" };
  }

  const isComplete = ["completed", "done", "complete"].includes(
    currentStatus?.toLowerCase() ?? ""
  );
  const nextStatus = isComplete ? "todo" : "completed";

  // Get user name for activity log
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const userName = profile?.full_name || user.email;

  // Update task status
  const { error } = await supabase
    .from("tasks")
    .update({ status: nextStatus })
    .eq("id", taskId);

  if (error) {
    console.error("[toggleTaskComplete] Error:", error);
    return { success: false, error: error.message };
  }

  // Log activity
  await logActivity(
    supabase,
    projectId,
    user.id,
    userName,
    isComplete ? "task_reopened" : "task_completed",
    `${isComplete ? "Reopened" : "Completed"} task: ${task?.title || taskId}`,
    { task_id: taskId, status: nextStatus }
  );

  revalidatePath(`/dashboard/workspace/${projectId}`);
  return { success: true };
}

// ============================================================================
// MEMBER ACTIONS
// ============================================================================

export async function addMember(formData: FormData): Promise<ActionResult> {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!projectId || !email) {
    return { success: false, error: "Project ID and email are required" };
  }

  const { supabase, user } = await getSupabaseClient();

  // Check if user is a leader
  const isLeader = await isProjectLeader(supabase, user.id, projectId);
  if (!isLeader) {
    return { success: false, error: "Only project leaders can add members" };
  }

  // Find user by email
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url")
    .ilike("email", email)
    .maybeSingle();

  if (profileError) {
    console.error("[addMember] Profile query error:", profileError);
    return { success: false, error: "Database error" };
  }

  if (!profile) {
    return { success: false, error: "User not found. Make sure they have registered an account first." };
  }

  // Check if user is already a member
  const { data: existingMember } = await supabase
    .from("project_members")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", profile.id)
    .maybeSingle();

  if (existingMember) {
    return { success: false, error: "User is already a member of this project" };
  }

  // Get user name for activity log
  const { data: currentUserProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const userName = currentUserProfile?.full_name || user.email;

  // Add member
  const { error } = await supabase.from("project_members").insert({
    project_id: projectId,
    user_id: profile.id,
    role: "member",
    name: profile.full_name,
    email: profile.email,
    avatar_url: profile.avatar_url,
  });

  if (error) {
    console.error("[addMember] Error:", error);
    return { success: false, error: error.message };
  }

  // Log activity
  await logActivity(
    supabase,
    projectId,
    user.id,
    userName,
    "member_added",
    `Added ${profile.full_name || profile.email} to the project`,
    { user_id: profile.id, user_name: profile.full_name }
  );

  revalidatePath(`/dashboard/workspace/${projectId}`);
  return { success: true };
}

export async function removeMember(formData: FormData): Promise<ActionResult> {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const memberId = String(formData.get("memberId") ?? "").trim();

  if (!projectId || !memberId) {
    return { success: false, error: "Project ID and member ID are required" };
  }

  const { supabase, user } = await getSupabaseClient();

  // Check if user is a leader
  const isLeader = await isProjectLeader(supabase, user.id, projectId);
  if (!isLeader) {
    return { success: false, error: "Only project leaders can remove members" };
  }

  // Get member info
  const { data: member } = await supabase
    .from("project_members")
    .select("user_id, role, name")
    .eq("id", memberId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (!member) {
    return { success: false, error: "Member not found" };
  }

  // Prevent removing yourself
  if (member.user_id === user.id) {
    return { success: false, error: "You cannot remove yourself from the project" };
  }

  // If removing a leader, check there's at least one other leader
  if (member.role === "leader") {
    const { count } = await supabase
      .from("project_members")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("role", "leader");

    if ((count ?? 0) <= 1) {
      return { success: false, error: "Cannot remove the last leader" };
    }
  }

  // Get user name for activity log
  const { data: currentUserProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const userName = currentUserProfile?.full_name || user.email;

  // Remove member
  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("id", memberId);

  if (error) {
    console.error("[removeMember] Error:", error);
    return { success: false, error: error.message };
  }

  // Log activity
  await logActivity(
    supabase,
    projectId,
    user.id,
    userName,
    "member_removed",
    `Removed ${member.name || member.user_id} from the project`,
    { user_id: member.user_id }
  );

  revalidatePath(`/dashboard/workspace/${projectId}`);
  return { success: true };
}

export async function updateMemberRole(formData: FormData): Promise<ActionResult> {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const memberId = String(formData.get("memberId") ?? "").trim();
  const newRole = String(formData.get("role") ?? "").trim();

  if (!projectId || !memberId || !newRole) {
    return { success: false, error: "Missing required fields" };
  }

  const { supabase, user } = await getSupabaseClient();

  // Check if user is a leader
  const isLeader = await isProjectLeader(supabase, user.id, projectId);
  if (!isLeader) {
    return { success: false, error: "Only project leaders can change member roles" };
  }

  // Get member info
  const { data: member } = await supabase
    .from("project_members")
    .select("user_id, role, name")
    .eq("id", memberId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (!member) {
    return { success: false, error: "Member not found" };
  }

  // If demoting a leader, check there's at least one other leader
  if (newRole !== "leader" && member.role === "leader") {
    const { count } = await supabase
      .from("project_members")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("role", "leader");

    if ((count ?? 0) <= 1) {
      return { success: false, error: "Cannot remove the last leader" };
    }
  }

  // Get user name for activity log
  const { data: currentUserProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const userName = currentUserProfile?.full_name || user.email;

  // Update role
  const { error } = await supabase
    .from("project_members")
    .update({ role: newRole })
    .eq("id", memberId);

  if (error) {
    console.error("[updateMemberRole] Error:", error);
    return { success: false, error: error.message };
  }

  // Log activity
  await logActivity(
    supabase,
    projectId,
    user.id,
    userName,
    "role_changed",
    `Changed ${member.name || memberId}'s role to ${newRole}`,
    { user_id: member.user_id, new_role: newRole }
  );

  revalidatePath(`/dashboard/workspace/${projectId}`);
  return { success: true };
}
