"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications/createNotification";
import {
  ForbiddenError,
  requirePermission,
  requireProjectPermission,
} from "@/lib/rbac-server";
import type { ActionResult } from "./workspace-types";

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

function handleRBACError(error: unknown): ActionResult {
  if (error instanceof ForbiddenError) {
    return { success: false, error: error.message };
  }
  throw error;
}

async function logActivity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  userId: string,
  userName: string,
  action: string,
  description: string,
  metadata: Record<string, unknown> = {},
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
  const startDateRaw = String(formData.get("startDate") ?? "").trim();
  const endDateRaw = String(formData.get("endDate") ?? "").trim();

  if (!title) {
    return { success: false, error: "Project title is required" };
  }

  if (startDateRaw && endDateRaw && startDateRaw > endDateRaw) {
    return {
      success: false,
      error: "Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.",
    };
  }

  try {
    await requirePermission("project.create");
  } catch (error) {
    return handleRBACError(error);
  }

  const { supabase, user } = await getSupabaseClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const userName = profile?.display_name || user.email;

  const projectPayload: Record<string, unknown> = {
    title,
    description: description || null,
    status: "active",
  };

  if (startDateRaw) {
    projectPayload.start_date = startDateRaw;
  }

  if (endDateRaw) {
    projectPayload.end_date = endDateRaw;
  }

  // Create project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert(projectPayload)
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
    { title },
  );

  revalidatePath("/dashboard/workspace");
  redirect(`/dashboard/workspace/${project.id}`);
}

export async function updateProject(formData: FormData): Promise<void> {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "active").trim();
  const startDateRaw = String(formData.get("startDate") ?? "").trim();
  const endDateRaw = String(formData.get("endDate") ?? "").trim();

  if (!projectId || !title) {
    throw new Error("Thiếu trường bắt buộc");
  }

  if (startDateRaw && endDateRaw && startDateRaw > endDateRaw) {
    throw new Error("Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.");
  }

  await requireProjectPermission(projectId, "project.edit");

  const { supabase, user } = await getSupabaseClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const userName = profile?.display_name || user.email;

  const updatePayload: Record<string, unknown> = {
    title,
    description: description || null,
    status,
    start_date: startDateRaw || null,
    end_date: endDateRaw || null,
  };

  // Get current project status
  const { data: currentProject } = await supabase
    .from("projects")
    .select("status")
    .eq("id", projectId)
    .single();

  // Update project
  const { error } = await supabase
    .from("projects")
    .update(updatePayload)
    .eq("id", projectId);

  if (error) {
    console.error("[updateProject] Error:", error);
    throw new Error(error.message);
  }

  // Project Status Changed Notification
  const statusTransitions = [
    { from: "planning", to: "active", message: "Dự án đã bắt đầu" },
    { from: "active", to: "completed", message: "Dự án đã hoàn thành" },
    { from: "active", to: "archived", message: "Dự án đã được lưu trữ" },
  ];

  const transition = statusTransitions.find(
    (t) => t.from === currentProject?.status && t.to === status,
  );

  if (transition) {
    // Notify all project members
    const { data: members } = await supabase
      .from("project_members")
      .select("user_id")
      .eq("project_id", projectId);

    if (members) {
      for (const member of members) {
        try {
          await createNotification({
            userId: member.user_id,
            type: "project_updated",
            message: `${transition.message}: ${title}`,
            link: `/dashboard/workspace/${projectId}`,
          });
          console.log(
            "[updateProjectStatus] Notification created for user:",
            member.user_id,
          );
        } catch (notificationError) {
          console.error(
            "[updateProjectStatus] Notification creation failed for user:",
            member.user_id,
            notificationError,
          );
          // Don't throw - continue with other members
        }
      }
    }
  }

  // Log activity
  await logActivity(
    supabase,
    projectId,
    user.id,
    userName,
    "project_updated",
    `Updated project: ${title}`,
    { title, status },
  );

  revalidatePath(`/dashboard/workspace/${projectId}`);
}

export async function archiveProject(formData: FormData): Promise<void> {
  const projectId = String(formData.get("projectId") ?? "").trim();

  if (!projectId) {
    throw new Error("Cần có ID dự án");
  }

  await requireProjectPermission(projectId, "project.archive");

  const { supabase, user } = await getSupabaseClient();

  // Get project title for activity log
  const { data: project } = await supabase
    .from("projects")
    .select("title")
    .eq("id", projectId)
    .maybeSingle();

  // Get user name for activity log
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const userName = profile?.display_name || user.email;

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
    {},
  );

  revalidatePath("/dashboard/workspace");
  revalidatePath(`/dashboard/workspace/${projectId}`);
}

export async function restoreProject(formData: FormData): Promise<void> {
  const projectId = String(formData.get("projectId") ?? "").trim();

  if (!projectId) {
    throw new Error("Cần có ID dự án");
  }

  await requireProjectPermission(projectId, "project.archive");

  const { supabase, user } = await getSupabaseClient();

  // Get project title for activity log
  const { data: project } = await supabase
    .from("projects")
    .select("title")
    .eq("id", projectId)
    .maybeSingle();

  // Get user name for activity log
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const userName = profile?.display_name || user.email;

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
    {},
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
  // From UI we expect a selected member email in 'assigned_to'
  const assignedEmail = String(formData.get("assigned_to") ?? "").trim();
  const dueDate = String(formData.get("dueDate") ?? "").trim();
  const priority = String(formData.get("priority") ?? "medium").trim();

  if (!projectId || !title) {
    return { success: false, error: "Project ID and title are required" };
  }

  try {
    await requireProjectPermission(projectId, "task.create");
  } catch (error) {
    return handleRBACError(error);
  }

  const { supabase, user } = await getSupabaseClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const userName = profile?.display_name || user.email;

  // Resolve assigned email -> profile.id and verify workspace membership
  let assignedToUserId: string | null = null;
  let assignedUserDisplay: string | null = null;

  if (assignedEmail) {
    const email = assignedEmail.trim().toLowerCase();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        error: "Email không hợp lệ",
      };
    }

    // Find user by email
    const { data: assigneeProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, display_name, email")
      .ilike("email", email)
      .maybeSingle();

    if (profileError) {
      console.error("[createTask] Profile lookup error:", profileError);

      return {
        success: false,
        error: "Không thể tìm người dùng.",
      };
    }

    if (!assigneeProfile) {
      return {
        success: false,
        error: "Không tìm thấy người dùng với email này.",
      };
    }

    // Verify workspace membership
    const { data: membership, error: membershipError } = await supabase
      .from("project_members")
      .select("user_id")
      .eq("project_id", projectId)
      .eq("user_id", assigneeProfile.id)
      .maybeSingle();

    if (membershipError) {
      console.error("[createTask] Membership lookup error:", membershipError);

      return {
        success: false,
        error: "Không thể kiểm tra thành viên dự án.",
      };
    }

    if (!membership) {
      return {
        success: false,
        error: "Người dùng chưa tham gia workspace.",
      };
    }

    assignedToUserId = assigneeProfile.id;

    assignedUserDisplay =
      assigneeProfile.display_name || assigneeProfile.email || null;
  }

  // Log incoming values
  console.log("[createTask] Received form values:", {
    projectId,
    title,
    description,
    assignedEmail,
    dueDate,
    priority,
  });
  console.log("[createTask] Resolved assignee:", {
    assignedToUserId,
    assignedUserDisplay,
  });

  // Prepare payload
  const insertPayload: Record<string, any> = {
    project_id: projectId,
    title,
    description: description || null,
    status: "todo",
    priority: priority || "medium",
    assigned_user: assignedUserDisplay || null,
    assigned_to: assignedToUserId,
    due_date: dueDate || null,
  };

  console.log("[createTask] Insert payload:", insertPayload);

  // Create task
  const { data: insertedTask, error } = await supabase
    .from("tasks")
    .insert(insertPayload)
    .select()
    .maybeSingle();

  if (error) {
    console.error("[createTask] Error:", error);
    return { success: false, error: error.message };
  }

  console.log("[createTask] Inserted task row:", insertedTask);

  // Log activity
  await logActivity(
    supabase,
    projectId,
    user.id,
    userName,
    "task_created",
    `Created task: ${title}`,
    { title, priority },
  );

  // For debug: fetch tasks for project and log count
  try {
    const { data: tasksAfterInsert, error: tasksError } = await supabase
      .from("tasks")
      .select("id, title, assigned_to, assigned_user")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (tasksError) {
      console.error(
        "[createTask] Error fetching tasks after insert:",
        tasksError,
      );
    } else {
      console.log(
        "[createTask] Tasks after insert count:",
        (tasksAfterInsert || []).length,
      );
    }
  } catch (err) {
    console.error(
      "[createTask] Unexpected error fetching tasks after insert:",
      err,
    );
  }

  revalidatePath(`/dashboard/workspace/${projectId}`);
  return { success: true };
}

export async function updateTask(formData: FormData): Promise<ActionResult> {
  const taskId = String(formData.get("taskId") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  // Expect assigned member email in 'assigned_to' when submitting edit form
  const assignedEmail = String(formData.get("assigned_to") ?? "").trim();
  const status = String(formData.get("status") ?? "todo").trim();
  const dueDate = String(formData.get("dueDate") ?? "").trim();
  const priority = String(formData.get("priority") ?? "medium").trim();

  if (!taskId || !projectId || !title) {
    return { success: false, error: "Thiếu trường bắt buộc" };
  }

  const { supabase, user } = await getSupabaseClient();

  const { data: task } = await supabase
    .from("tasks")
    .select("assigned_to, assigned_user")
    .eq("id", taskId)
    .maybeSingle();

  const isAssignee = task?.assigned_to === user.id;
  try {
    await requireProjectPermission(projectId, "task.update.own", {
      isAssignee,
    });
  } catch {
    try {
      await requireProjectPermission(projectId, "member.manage");
    } catch (error) {
      return handleRBACError(error);
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const userName = profile?.display_name || user.email;

  // Resolve assigned email -> profile.id and verify membership
  let assignedToUserId: string | null = null;
  let assignedUserDisplay: string | null = null;
  if (assignedEmail) {
    const email = assignedEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: "Email không hợp lệ" };
    }

    const { data: assigneeProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id, display_name, email")
      .ilike("email", email)
      .limit(1)
      .maybeSingle();

    if (profileError || !assigneeProfile) {
      return { success: false, error: "This user does not exist." };
    }

    const { data: member } = await supabase
      .from("project_members")
      .select("user_id")
      .eq("project_id", projectId)
      .eq("user_id", assigneeProfile.id)
      .limit(1)
      .maybeSingle();

    if (!member) {
      return {
        success: false,
        error: "This user is not a member of this workspace.",
      };
    }

    assignedToUserId = assigneeProfile.id;
    assignedUserDisplay = assigneeProfile.display_name || assigneeProfile.email;
  }

  // Update task
  const { error } = await supabase
    .from("tasks")
    .update({
      title,
      description: description || null,
      assigned_user: assignedUserDisplay || null,
      assigned_to: assignedToUserId,
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
    { task_id: taskId, status, priority },
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

  try {
    await requireProjectPermission(projectId, "member.manage");
  } catch (error) {
    return handleRBACError(error);
  }

  const { supabase, user } = await getSupabaseClient();

  // Get task title for activity log
  const { data: task } = await supabase
    .from("tasks")
    .select("title")
    .eq("id", taskId)
    .maybeSingle();

  // Get user name for activity log
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const userName = profile?.display_name || user.email;

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
    { task_id: taskId },
  );

  revalidatePath(`/dashboard/workspace/${projectId}`);
  return { success: true };
}

export async function toggleTaskComplete(
  formData: FormData,
): Promise<ActionResult> {
  const taskId = String(formData.get("taskId") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "").trim();
  const currentStatus = String(formData.get("currentStatus") ?? "").trim();

  if (!taskId || !projectId) {
    return { success: false, error: "Task ID and project ID are required" };
  }

  const { supabase, user } = await getSupabaseClient();

  const { data: task } = await supabase
    .from("tasks")
    .select("assigned_to, title")
    .eq("id", taskId)
    .maybeSingle();

  const isAssignee = task?.assigned_to === user.id;
  try {
    await requireProjectPermission(projectId, "task.update.own", {
      isAssignee,
    });
  } catch {
    try {
      await requireProjectPermission(projectId, "member.manage");
    } catch (error) {
      return handleRBACError(error);
    }
  }

  const isComplete = ["completed", "done", "complete"].includes(
    currentStatus?.toLowerCase() ?? "",
  );
  const nextStatus = isComplete ? "todo" : "completed";

  // Get user name for activity log
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const userName = profile?.display_name || user.email;

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
    { task_id: taskId, status: nextStatus },
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

  try {
    await requireProjectPermission(projectId, "member.manage");
  } catch (error) {
    return handleRBACError(error);
  }

  const { supabase, user } = await getSupabaseClient();

  // Find user by email
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, email, avatar_url")
    .ilike("email", email)
    .maybeSingle();

  if (profileError) {
    console.error("[addMember] Profile query error:", profileError);
    return { success: false, error: "Database error" };
  }

  if (!profile) {
    return {
      success: false,
      error:
        "Không tìm thấy người dùng. Make sure they have registered an account first.",
    };
  }

  // Check if user is already a member
  const { data: existingMember } = await supabase
    .from("project_members")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", profile.id)
    .maybeSingle();

  if (existingMember) {
    return {
      success: false,
      error: "User is already a member of this project",
    };
  }

  // Get user name for activity log
  const { data: currentUserProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const userName = currentUserProfile?.display_name || user.email;

  // Add member
  const { error } = await supabase.from("project_members").insert({
    project_id: projectId,
    user_id: profile.id,
    role: "member",
    name: profile.display_name,
    email: profile.email,
    avatar_url: profile.avatar_url,
  });

  if (error) {
    console.error("[addMember] Error:", error);
    return { success: false, error: error.message };
  }

  // Get project title for notification
  const { data: project } = await supabase
    .from("projects")
    .select("title")
    .eq("id", projectId)
    .single();

  // Send notification to added member
  try {
    await createNotification({
      userId: profile.id,
      type: "member_added",
      message: `Bạn đã được thêm vào dự án: ${project?.title || "Dự án"}`,
      link: `/dashboard/workspace/${projectId}`,
    });
    console.log("[addMember] Notification created for user:", profile.id);
  } catch (notificationError) {
    console.error(
      "[addMember] Notification creation failed:",
      notificationError,
    );
    // Don't throw - member was added successfully
  }

  // Log activity
  await logActivity(
    supabase,
    projectId,
    user.id,
    userName,
    "member_added",
    `Added ${profile.display_name || profile.email} to the project`,
    { user_id: profile.id, user_name: profile.display_name },
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

  try {
    await requireProjectPermission(projectId, "member.manage");
  } catch (error) {
    return handleRBACError(error);
  }

  const { supabase, user } = await getSupabaseClient();

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
    return {
      success: false,
      error: "You cannot remove yourself from the project",
    };
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
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const userName = currentUserProfile?.display_name || user.email;

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
    { user_id: member.user_id },
  );

  revalidatePath(`/dashboard/workspace/${projectId}`);
  return { success: true };
}

export async function updateMemberRole(
  formData: FormData,
): Promise<ActionResult> {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const memberId = String(formData.get("memberId") ?? "").trim();
  const newRole = String(formData.get("role") ?? "").trim();

  if (!projectId || !memberId || !newRole) {
    return { success: false, error: "Thiếu trường bắt buộc" };
  }

  try {
    await requireProjectPermission(projectId, "member.manage");
  } catch (error) {
    return handleRBACError(error);
  }

  const { supabase, user } = await getSupabaseClient();

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
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const userName = currentUserProfile?.display_name || user.email;

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
    { user_id: member.user_id, new_role: newRole },
  );

  revalidatePath(`/dashboard/workspace/${projectId}`);
  return { success: true };
}
