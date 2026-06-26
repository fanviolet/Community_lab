export type ProjectPlanningInfo = {
  domain: string | null;
  project_type: string | null;
  team_size: number | null;
  experience_level: string | null;
  budget_range: string | null;
  duration_days: number | null;
  main_goal: string | null;
  deliverables: string[];
  target_audience: string[];
  success_metrics: Array<{ metric: string; target: number }>;
};

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

export function parsePlanningInfoFromRow(
  data: Record<string, unknown> | null | undefined,
): ProjectPlanningInfo | null {
  if (!data) {
    return null;
  }

  return {
    domain: (data.domain as string | null) ?? null,
    project_type: (data.project_type as string | null) ?? null,
    team_size: (data.team_size as number | null) ?? null,
    experience_level: (data.experience_level as string | null) ?? null,
    budget_range: (data.budget_range as string | null) ?? null,
    duration_days: (data.duration_days as number | null) ?? null,
    main_goal: (data.main_goal as string | null) ?? null,
    deliverables: normalizeArray<string>(data.deliverables),
    target_audience: normalizeArray<string>(data.target_audience),
    success_metrics: normalizeArray<{ metric: string; target: number }>(
      data.success_metrics,
    ),
  };
}
