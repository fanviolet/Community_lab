"use server";

import { revalidatePath } from "next/cache";
import { getAuthSession } from "@/lib/auth/server";
import { requireProjectPermission } from "@/lib/rbac-server";
import {
  parsePlanningInfoFromRow,
  type ProjectPlanningInfo,
} from "@/lib/workspace/planning-utils";
import type { PlanningFormData } from "@/components/workspace/planning/StructuredPlanningForm";

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Normalize a value to an array.
 * Handles null, undefined, string, and array inputs.
 */
function normalizeArray<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

async function getSupabaseClient() {
  const { supabase, user } = await getAuthSession();

  if (!user) {
    throw new Error("Không có quyền truy cập");
  }

  return { supabase, user };
}

// ============================================================================
// SAVE PROJECT PLANNING INFO
// ============================================================================

export async function saveProjectPlanningInfo(
  projectId: string,
  data: PlanningFormData
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireProjectPermission(projectId, "project.edit");
  } catch {
    return { success: false, error: "Bạn không có quyền chỉnh sửa dự án này." };
  }

  const { supabase } = await getSupabaseClient();

  // Normalize all array fields before save
  // IMPORTANT: Do NOT use JSON.stringify() on JSONB columns.
  // Supabase JS client handles JSON serialization automatically.
  // Stringifying causes double-encoding, resulting in a string
  // being stored instead of an array, which breaks Array.isArray().
  const updatePayload: Record<string, unknown> = {
    domain: data.domain,
    project_type: data.project_type,
    team_size: data.team_size,
    experience_level: data.experience_level,
    budget_range: data.budget_range,
    duration_days: data.duration_days,
    main_goal: data.main_goal,
    deliverables: normalizeArray<string>(data.deliverables),
    target_audience: normalizeArray<string>(data.target_audience),
    success_metrics: normalizeArray(data.success_metrics),
  };

  console.log("[saveProjectPlanningInfo] Save payload:", {
    ...updatePayload,
    deliverables: JSON.stringify(updatePayload.deliverables),
    target_audience: JSON.stringify(updatePayload.target_audience),
    success_metrics: JSON.stringify(updatePayload.success_metrics),
  });

  const { error } = await supabase
    .from("projects")
    .update(updatePayload)
    .eq("id", projectId);

  if (error) {
    console.error("[saveProjectPlanningInfo] Error:", error);
    return { success: false, error: error.message };
  }

  console.log("[saveProjectPlanningInfo] Save successful");

  revalidatePath(`/dashboard/workspace/${projectId}`);
  return { success: true };
}

// ============================================================================
// GET PROJECT PLANNING INFO
// ============================================================================

export async function getProjectPlanningInfo(projectId: string): Promise<ProjectPlanningInfo | null> {
  const client = await getSupabaseClient();
  const { supabase, user } = client;

  // Check membership
  const { data: membership } = await supabase
    .from("project_members")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return null;
  }

  const { data, error } = await supabase
    .from("projects")
    .select(
      "domain, project_type, team_size, experience_level, budget_range, duration_days, main_goal, deliverables, target_audience, success_metrics"
    )
    .eq("id", projectId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return parsePlanningInfoFromRow(data);
}