"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications/createNotification";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
} from "@/lib/rbac";
import type {
  CreatePitchInput,
  UpdatePitchInput,
  CreatePitchContentInput,
  CreatePitchFeedbackInput,
  PitchWithRelations,
  PitchContent,
  PitchHistoryWithUser,
  PitchFeedbackWithReviewer,
  PitchMetrics,
} from "@/types/pitch-management";

// Pitch Actions
export async function getPitches(filters?: {
  status?: string;
  created_by?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("pitches")
    .select(`
  *,
  problem:problems(id, title),
  creator:profiles!pitches_created_by_fkey(id, full_name, email, avatar_url),
  reviewer:profiles!pitches_reviewed_by_fkey(id, full_name, email)
`)
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.created_by) {
    query = query.eq("created_by", filters.created_by);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as PitchWithRelations[];
}

export async function getPitchById(id: string) {
  console.log("[getPitchById] called with id:", id, "| typeof:", typeof id);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pitches")
    .select(`
  *,
  problem:problems(id, title),
  creator:profiles!pitches_created_by_fkey(id, full_name, email, avatar_url),
  reviewer:profiles!pitches_reviewed_by_fkey(id, full_name, email)
`)
    .eq("id", id)
    .single();

  if (error) {
    console.error("[getPitchById] ERROR:", JSON.stringify(error, null, 2));
    throw error;
  }
  return data as PitchWithRelations;
}

export async function createPitch(input: CreatePitchInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("pitches")
    .insert({
      ...input,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dashboard/pitch");
  return data;
}

export async function updatePitch(id: string, input: UpdatePitchInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("pitches")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dashboard/pitch");
  revalidatePath(`/dashboard/pitch/${id}`);
  return data;
}

export async function deletePitch(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("pitches")
    .delete()
    .eq("id", id);

  if (error) throw error;

  revalidatePath("/dashboard/pitch");
}

export async function submitPitch(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("pitches")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dashboard/pitch");
  revalidatePath(`/dashboard/pitch/${id}`);
  return data;
}

export async function reviewPitch(id: string, status: "approved" | "rejected" | "revision_required", reviewNotes?: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Get pitch details to notify the creator
  const { data: pitch, error: pitchError } = await supabase
    .from("pitches")
    .select("created_by, title")
    .eq("id", id)
    .single();

  if (pitchError || !pitch) {
    console.error("[updatePitchStatus] Pitch not found:", id, pitchError);
  }

  const { data, error } = await supabase
    .from("pitches")
    .update({
      status,
      reviewed_by: user.id,
      review_notes: reviewNotes,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  // Send notification to pitch creator
  if (pitch?.created_by) {
    try {
      if (status === "approved") {
        await createNotification({
          userId: pitch.created_by,
          type: "pitch_approved",
          message: `Pitch "${pitch.title}" của bạn đã được phê duyệt`,
          link: `/dashboard/pitch/${id}`,
        });
        console.log("[updatePitchStatus] Pitch approved notification created for user:", pitch.created_by);
      } else if (status === "rejected") {
        await createNotification({
          userId: pitch.created_by,
          type: "pitch_rejected",
          message: `Pitch "${pitch.title}" của bạn đã bị từ chối`,
          link: `/dashboard/pitch/${id}`,
        });
        console.log("[updatePitchStatus] Pitch rejected notification created for user:", pitch.created_by);
      } else if (status === "revision_required") {
        await createNotification({
          userId: pitch.created_by,
          type: "pitch_revision_requested",
          message: `Pitch "${pitch.title}" của bạn cần được sửa đổi`,
          link: `/dashboard/pitch/${id}`,
        });
        console.log("[updatePitchStatus] Pitch revision requested notification created for user:", pitch.created_by);
      }
    } catch (notificationError) {
      console.error("[updatePitchStatus] Notification creation failed:", notificationError);
      // Don't throw - pitch status was updated successfully
    }
  }

  // Log history
  try {
    await supabase.rpc("log_review_history", {
      p_review_id: id,
      p_action: status,
      p_notes: reviewNotes || `Status: ${status}`,
    });
  } catch {
    // ignore if rpc doesn't exist for pitches
  }

  revalidatePath("/dashboard/pitch");
  revalidatePath(`/dashboard/pitch/${id}`);
  return data;
}

// Pitch Content Actions
export async function getPitchContent(pitchId: string) {
  console.log("[getPitchContent] called with pitchId:", pitchId, "| typeof:", typeof pitchId);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pitch_content")
    .select("*")
    .eq("pitch_id", pitchId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[getPitchContent] ERROR:", JSON.stringify(error, null, 2));
    throw error;
  }
  return data as PitchContent | null;
}

export async function createPitchContent(input: CreatePitchContentInput) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pitch_content")
    .insert(input)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dashboard/pitch");
  revalidatePath(`/dashboard/pitch/${input.pitch_id}`);
  return data;
}

export async function updatePitchContent(id: string, input: Partial<CreatePitchContentInput>) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pitch_content")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dashboard/pitch");
  revalidatePath(`/dashboard/pitch/${input.pitch_id}`);
  return data;
}

export async function updatePitchWithNotification(
  pitchId: string,
  pitchInput: UpdatePitchInput,
  contentId: string | null,
  contentInput: Partial<CreatePitchContentInput>
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Get pitch details to notify the creator
  const { data: pitch } = await supabase
    .from("pitches")
    .select("created_by, title")
    .eq("id", pitchId)
    .single();

  if (!pitch) {
    throw new Error("Pitch not found");
  }

  // Update pitch basic info
  const { data: updatedPitch, error: pitchError } = await supabase
    .from("pitches")
    .update(pitchInput)
    .eq("id", pitchId)
    .select()
    .single();

  if (pitchError) throw pitchError;

  // Update pitch content if contentId is provided
  if (contentId) {
    const { error: contentError } = await supabase
      .from("pitch_content")
      .update(contentInput)
      .eq("id", contentId);

    if (contentError) throw contentError;
  }

  // Send notification to pitch creator (owner)
  try {
    await createNotification({
      userId: pitch.created_by,
      type: "general",
      message: "Đề xuất của bạn đã được cập nhật thành công.",
      link: `/dashboard/pitch/${pitchId}`,
    });
    console.log("[updatePitch] General notification created for user:", pitch.created_by);
  } catch (notificationError) {
    console.error("[updatePitch] Notification creation failed:", notificationError);
    // Don't throw - pitch was updated successfully
  }

  revalidatePath("/dashboard/pitch");
  revalidatePath(`/dashboard/pitch/${pitchId}`);
  return updatedPitch;
}

// Pitch History Actions
export async function getPitchHistory(pitchId: string) {
  console.log("[getPitchHistory] called with pitchId:", pitchId, "| typeof:", typeof pitchId);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pitch_history")
    .select(`
      *,
      user:profiles(id, full_name, email, avatar_url)
    `)
    .eq("pitch_id", pitchId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[getPitchHistory] ERROR:", JSON.stringify(error, null, 2));
    throw error;
  }
  return data as PitchHistoryWithUser[];
}

// Pitch Feedback Actions
export async function getPitchFeedback(pitchId: string) {
  console.log("[getPitchFeedback] called with pitchId:", pitchId, "| typeof:", typeof pitchId);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pitch_feedback")
    .select(`
      *,
      reviewer:profiles(id, full_name, email, avatar_url)
    `)
    .eq("pitch_id", pitchId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getPitchFeedback] ERROR:", JSON.stringify(error, null, 2));
    throw error;
  }
  return data as PitchFeedbackWithReviewer[];
}

export async function createPitchFeedback(input: CreatePitchFeedbackInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("pitch_feedback")
    .insert({
      ...input,
      reviewer_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dashboard/pitch");
  revalidatePath(`/dashboard/pitch/${input.pitch_id}`);
  return data;
}

// Metrics Actions
export async function getPitchMetrics(filters?: { created_by?: string }): Promise<PitchMetrics> {
  const supabase = await createClient();
  

  let query = supabase.from("pitches").select("status, ai_score");

  if (filters?.created_by) {
    query = query.eq("created_by", filters.created_by);
  }

  const { data, error } = await query;

  if (error) throw error;

 const pitches = data || [];

const total_pitches = pitches.length;
const drafts = pitches.filter((p: any) => p.status === "draft").length;
const submitted = pitches.filter((p: any) => p.status === "submitted").length;
const under_review = pitches.filter((p: any) => p.status === "under_review").length;
const approved = pitches.filter((p: any) => p.status === "approved").length;
const rejected = pitches.filter((p: any) => p.status === "rejected").length;
const revision_required = pitches.filter((p: any) => p.status === "revision_required").length;

const pitchesWithScore = pitches.filter((p: any) => p.ai_score !== null);
const average_ai_score = pitchesWithScore.length > 0
  ? pitchesWithScore.reduce((sum: number, p: any) => sum + (p.ai_score || 0), 0) / pitchesWithScore.length
  : 0;

  return {
    total_pitches,
    drafts,
    submitted,
    under_review,
    approved,
    rejected,
    revision_required,
    average_ai_score,
  };
}

// Helper Actions
export async function getProblems() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("problems")
    .select("id, title")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// ============================================================================
// APPROVE & CREATE PROJECT WORKFLOW
// ============================================================================

export async function approvePitchAndCreateProject(pitchId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Get pitch with content
  const { data: pitch, error: pitchError } = await supabase
    .from("pitches")
    .select(`
      *,
      pitch_content (
        project_summary,
        target_audience,
        key_objectives,
        solution_description,
        implementation_plan,
        expected_impact
      )
    `)
    .eq("id", pitchId)
    .single();

  if (pitchError || !pitch) {
    throw new Error("Pitch not found");
  }

  // Check if project already created
  if (pitch.project_id) {
    throw new Error("Project already created for this pitch");
  }

  // Check if pitch is in approvable state
  if (pitch.status !== "submitted" && pitch.status !== "under_review") {
    throw new Error("Pitch must be submitted or under review to be approved");
  }

  // Check if already converted
  if (pitch.status === "converted") {
    throw new Error("Pitch has already been converted to a project");
  }

  const content = pitch.pitch_content?.[0];

  // Create project from pitch
  const projectPayload: Record<string, unknown> = {
    title: pitch.title,
    description: content?.project_summary || pitch.description || null,
    status: "active",
    created_from_pitch_id: pitchId,
  };

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert(projectPayload)
    .select()
    .single();

  if (projectError) {
    console.error("[approvePitchAndCreateProject] Error creating project:", projectError);
    throw new Error("Failed to create project");
  }

  // Add pitch creator as project leader
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", pitch.created_by)
    .maybeSingle();

  if (!profile) {
    console.error("[approvePitchAndCreateProject] Profile not found for pitch creator:", pitch.created_by);
  }

  const creatorName = profile?.full_name || profile?.email || "Unknown";

  const { error: memberError } = await supabase.from("project_members").insert({
    project_id: project.id,
    user_id: pitch.created_by,
    role: "leader",
    name: creatorName,
    email: profile?.email || null,
  });

  if (memberError) {
    console.error("[approvePitchAndCreateProject] Error adding member:", memberError);
  }

  // Get AI analysis for integration
  const { data: aiAnalyses } = await supabase
    .from("pitch_ai_analysis")
    .select("*")
    .eq("pitch_id", pitchId);

  // Integrate AI analysis into project
  if (aiAnalyses && aiAnalyses.length > 0) {
    for (const analysis of aiAnalyses) {
      const result = analysis.analysis_result as { json?: Record<string, unknown> };

      if (!result.json) continue;

      // Create tasks from KPIs
      if (analysis.analysis_type === "kpi_suggestion" && result.json.kpis && Array.isArray(result.json.kpis)) {
        for (const kpi of result.json.kpis as any[]) {
          try {
            await supabase.from("tasks").insert({
              project_id: project.id,
              title: `KPI: ${kpi.name}`,
              description: `Đơn vị: ${kpi.unit}\nMục tiêu: ${kpi.target}\nCách đo: ${kpi.measurement}`,
              status: "todo",
              priority: "medium",
              assigned_to: pitch.created_by,
            });
          } catch (e) {
            console.error("Error creating KPI task:", e);
          }
        }
      }

      // Create milestones from timeline
      if (analysis.analysis_type === "timeline_generation" && result.json.phases && Array.isArray(result.json.phases)) {
        for (const phase of result.json.phases as any[]) {
          try {
            await supabase.from("project_milestones").insert({
              project_id: project.id,
              title: phase.name,
              description: `Thời gian: ${phase.duration}\nĐầu ra: ${Array.isArray(phase.deliverables) ? phase.deliverables.join(", ") : phase.deliverables}`,
              status: "pending",
              created_by: user.id,
            });
          } catch (e) {
            console.error("Error creating milestone:", e);
          }
        }
      }

      // Store budget in project metadata (if projects table has metadata column)
      if (analysis.analysis_type === "budget_generation" && result.json.categories) {
        // Budget info could be stored in a separate budget table or as project metadata
        console.log("Budget analysis for project:", project.id, result.json);
      }
    }
  }

  // Log activity
  await supabase.from("activities").insert({
    project_id: project.id,
    user_id: user.id,
    user_name: user.email,
    action: "project_created_from_pitch",
    description: `Created project from approved pitch: ${pitch.title}`,
    metadata: {
      pitch_id: pitchId,
      pitch_title: pitch.title,
      ai_integrated: aiAnalyses?.length || 0,
    },
  });

  // Update pitch with project_id and status
  const { error: updateError } = await supabase
    .from("pitches")
    .update({
      status: "converted",
      project_id: project.id,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", pitchId);

  if (updateError) {
    console.error("[approvePitchAndCreateProject] Error updating pitch:", updateError);
  }

  // Send notification to pitch creator
  try {
    await createNotification({
      userId: pitch.created_by,
      type: "pitch_approved",
      message: `Pitch "${pitch.title}" của bạn đã được phê duyệt và dự án đã được tạo`,
      link: `/dashboard/workspace/${project.id}`,
      logActivity: {
        projectId: project.id,
        actorUserId: user.id,
        actorUserName: user.email || "Unknown",
      },
    });
    console.log("[approvePitchAndCreateProject] Pitch approved notification created for user:", pitch.created_by);
  } catch (notificationError) {
    console.error("[approvePitchAndCreateProject] Notification creation failed:", notificationError);
    // Don't throw - pitch was approved and project created successfully
  }

  revalidatePath("/dashboard/pitch");
  revalidatePath(`/dashboard/pitch/${pitchId}`);
  revalidatePath("/dashboard/workspace");

  return { pitch, project };
}

// ============================================================================
// REVIEW ACTIONS
// ============================================================================

export async function startPitchReview(pitchId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Check permissions
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = parseRole(profile?.role);
  const ctx = createAuthenticatedContext(role, user.id);

  if (!hasPermission(ctx, "pitch.start_review")) {
    throw new Error("You do not have permission to start review");
  }

  // Get pitch
  const { data: pitch, error: pitchError } = await supabase
    .from("pitches")
    .select("*")
    .eq("id", pitchId)
    .single();

  if (pitchError || !pitch) {
    throw new Error("Pitch not found");
  }

  // Check if pitch can be reviewed
  if (pitch.status !== "submitted") {
    throw new Error("Pitch must be submitted to start review");
  }

  // Update pitch status
  const { error: updateError } = await supabase
    .from("pitches")
    .update({
      status: "under_review",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", pitchId);

  if (updateError) {
    throw new Error("Failed to start review");
  }

  // Log history
  try {
    await supabase.from("pitch_history").insert({
      pitch_id: pitchId,
      user_id: user.id,
      action: "status_changed",
      old_value: pitch.status,
      new_value: "under_review",
      notes: "Review started",
    });
  } catch (e) {
    console.error("Error logging history:", e);
  }

  // Notify pitch creator
  try {
    await createNotification({
      userId: pitch.created_by,
      type: "general",
      message: "Đề xuất của bạn đang được xem xét.",
      link: `/dashboard/pitch/${pitchId}`,
    });
    console.log("[startPitchReview] General notification created for user:", pitch.created_by);
  } catch (notificationError) {
    console.error("[startPitchReview] Notification creation failed:", notificationError);
    // Don't throw - pitch review was started successfully
  }

  revalidatePath("/dashboard/pitch");
  revalidatePath(`/dashboard/pitch/${pitchId}`);

  return pitch;
}

export async function rejectPitch(pitchId: string, reason: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Check permissions
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = parseRole(profile?.role);
  const ctx = createAuthenticatedContext(role, user.id);

  if (!hasPermission(ctx, "pitch.reject")) {
    throw new Error("You do not have permission to reject pitches");
  }

  // Get pitch
  const { data: pitch, error: pitchError } = await supabase
    .from("pitches")
    .select("*")
    .eq("id", pitchId)
    .single();

  if (pitchError || !pitch) {
    throw new Error("Pitch not found");
  }

  // Check if pitch can be rejected
  if (pitch.status === "converted") {
    throw new Error("Cannot reject a converted pitch");
  }

  // Update pitch status
  const { error: updateError } = await supabase
    .from("pitches")
    .update({
      status: "rejected",
      review_notes: reason,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", pitchId);

  if (updateError) {
    throw new Error("Failed to reject pitch");
  }

  // Log history
  try {
    await supabase.from("pitch_history").insert({
      pitch_id: pitchId,
      user_id: user.id,
      action: "status_changed",
      old_value: pitch.status,
      new_value: "rejected",
      notes: reason,
    });
  } catch (e) {
    console.error("Error logging history:", e);
  }

  // Create feedback
  try {
    await supabase.from("pitch_feedback").insert({
      pitch_id: pitchId,
      reviewer_id: user.id,
      feedback_type: "rejection",
      feedback_text: reason,
    });
  } catch (e) {
    console.error("Error creating feedback:", e);
  }

  // Notify pitch creator
  try {
    await createNotification({
      userId: pitch.created_by,
      type: "pitch_rejected",
      message: "Đề xuất của bạn cần chỉnh sửa trước khi được phê duyệt.",
      link: `/dashboard/pitch/${pitchId}`,
    });
    console.log("[rejectPitch] Pitch rejected notification created for user:", pitch.created_by);
  } catch (notificationError) {
    console.error("[rejectPitch] Notification creation failed:", notificationError);
    // Don't throw - pitch was rejected successfully
  }

  revalidatePath("/dashboard/pitch");
  revalidatePath(`/dashboard/pitch/${pitchId}`);

  return pitch;
}