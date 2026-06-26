import type { SupabaseClient } from "@supabase/supabase-js";

export interface ProjectCountMetrics {
  taskCount: number;
  completedCount: number;
  memberCount: number;
  leaderCount: number;
  overdueCount: number;
  milestoneCount: number;
  completedMilestones: number;
}

function emptyMetrics(): ProjectCountMetrics {
  return {
    taskCount: 0,
    completedCount: 0,
    memberCount: 0,
    leaderCount: 0,
    overdueCount: 0,
    milestoneCount: 0,
    completedMilestones: 0,
  };
}

/**
 * Fetches per-project summary counts in 3 queries instead of 7×N.
 */
export async function fetchProjectSummaryMetrics(
  supabase: SupabaseClient,
  projectIds: string[],
): Promise<Map<string, ProjectCountMetrics>> {
  const metrics = new Map<string, ProjectCountMetrics>();
  if (projectIds.length === 0) {
    return metrics;
  }

  for (const id of projectIds) {
    metrics.set(id, emptyMetrics());
  }

  const nowIso = new Date().toISOString();

  const [tasksResult, membersResult, milestonesResult] = await Promise.all([
    supabase
      .from("tasks")
      .select("project_id, status, due_date")
      .in("project_id", projectIds),
    supabase
      .from("project_members")
      .select("project_id, role")
      .in("project_id", projectIds),
    supabase
      .from("project_milestones")
      .select("project_id, status")
      .in("project_id", projectIds),
  ]);

  for (const task of tasksResult.data ?? []) {
    const entry = metrics.get(task.project_id);
    if (!entry) continue;

    entry.taskCount += 1;
    if (task.status === "completed") {
      entry.completedCount += 1;
    }
    if (
      task.due_date &&
      task.due_date < nowIso &&
      task.status !== "completed"
    ) {
      entry.overdueCount += 1;
    }
  }

  for (const member of membersResult.data ?? []) {
    const entry = metrics.get(member.project_id);
    if (!entry) continue;

    entry.memberCount += 1;
    if (member.role === "leader") {
      entry.leaderCount += 1;
    }
  }

  for (const milestone of milestonesResult.data ?? []) {
    const entry = metrics.get(milestone.project_id);
    if (!entry) continue;

    entry.milestoneCount += 1;
    if (milestone.status === "completed") {
      entry.completedMilestones += 1;
    }
  }

  return metrics;
}
