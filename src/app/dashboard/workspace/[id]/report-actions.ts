"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ============================================================================
// TYPES
// ============================================================================

export type ReportType = "weekly" | "monthly" | "full";

export interface ReportInput {
  projectId: string;
  reportType: ReportType;
  startDate?: string;
  endDate?: string;
}

export interface ReportMetrics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  highPriorityTasks: number;
  completionRate: number;
  taskVelocity: number;
  activeMemberRatio: number;
  overdueTaskRatio: number;
}

export interface ReportAchievement {
  id: string;
  title: string;
  description: string;
  date: string | null;
}

export interface ReportChallenge {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
}

export interface ReportRecommendation {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
}

export interface ProjectHealthScore {
  score: number;
  category: "Healthy" | "Good" | "At Risk" | "Critical";
  explanation: string;
}

export interface GeneratedReport {
  project: {
    id: string;
    title: string;
    description: string | null;
    status: string | null;
    start_date: string | null;
    end_date: string | null;
  };
  reportType: ReportType;
  period: {
    label: string;
    startDate: string;
    endDate: string;
  };
  executiveSummary: string;
  metrics: ReportMetrics;
  achievements: ReportAchievement[];
  challenges: ReportChallenge[];
  recommendations: ReportRecommendation[];
  healthScore: ProjectHealthScore;
  workflow?: {
    phases: Array<{
      name: string;
      progress: number;
      tasks: number;
    }>;
  };
  generatedAt: string;
}

export interface ReportHistoryItem {
  id: string;
  reportType: ReportType;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
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
    throw new Error("Unauthorized");
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

function getPeriodRange(input: ReportInput) {
  const now = new Date();
  const end = input.endDate ? new Date(input.endDate) : now;
  const start = input.startDate ? new Date(input.startDate) : new Date(now);

  if (input.reportType === "weekly" && !input.startDate) {
    start.setDate(end.getDate() - 6);
  }

  if (input.reportType === "monthly" && !input.startDate) {
    start.setDate(1);
  }

  if (input.reportType === "full" && !input.startDate) {
    start.setFullYear(start.getFullYear() - 1);
  }

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid reporting period.");
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const label =
    input.reportType === "weekly"
      ? "Weekly Report"
      : input.reportType === "monthly"
        ? "Monthly Report"
        : "Full Project Report";

  return { label, start, end };
}

function isComplete(status: string | null) {
  return ["completed", "done", "complete"].includes(status?.toLowerCase() ?? "");
}

function isInPeriod(value: string | null | undefined, start: Date, end: Date) {
  if (!value) return false;
  const date = new Date(value);
  return date >= start && date <= end;
}

function calculateHealthScore(metrics: ReportMetrics): ProjectHealthScore {
  let score = 100;

  // Deduct for low completion rate
  if (metrics.completionRate < 50) score -= 30;
  else if (metrics.completionRate < 70) score -= 15;

  // Deduct for high overdue ratio
  if (metrics.overdueTaskRatio > 0.3) score -= 25;
  else if (metrics.overdueTaskRatio > 0.15) score -= 10;

  // Deduct for low active member ratio
  if (metrics.activeMemberRatio < 0.3) score -= 20;
  else if (metrics.activeMemberRatio < 0.5) score -= 10;

  // Deduct for low task velocity
  if (metrics.taskVelocity < 1) score -= 15;
  else if (metrics.taskVelocity < 2) score -= 5;

  score = Math.max(0, Math.min(100, score));

  let category: ProjectHealthScore["category"];
  if (score >= 90) category = "Healthy";
  else if (score >= 70) category = "Good";
  else if (score >= 50) category = "At Risk";
  else category = "Critical";

  const explanation =
    score >= 90
      ? "Project is performing excellently with strong completion rates and active team engagement."
      : score >= 70
        ? "Project is progressing well with minor areas for improvement."
        : score >= 50
          ? "Project shows concerning trends that need attention to prevent delays."
          : "Project requires immediate intervention to address critical issues.";

  return { score, category, explanation };
}

function buildExecutiveSummary(project: any, metrics: ReportMetrics, healthScore: ProjectHealthScore) {
  const statusLabel = project.status ?? "active";
  const healthLabel = healthScore.category.toLowerCase();
  
  return `${project.title} is currently ${statusLabel} with a ${healthLabel} health score of ${healthScore.score}/100. The team has completed ${metrics.completedTasks} of ${metrics.totalTasks} tasks (${metrics.completionRate}% completion rate). ${metrics.overdueTasks > 0 ? `${metrics.overdueTasks} tasks are overdue and require attention.` : "No tasks are currently overdue."} The project shows ${metrics.taskVelocity.toFixed(1)} tasks completed per week on average.`;
}

function buildRecommendations(metrics: ReportMetrics, challenges: ReportChallenge[]): ReportRecommendation[] {
  const recommendations: ReportRecommendation[] = [];

  if (metrics.overdueTasks > 0) {
    recommendations.push({
      id: "overdue-tasks",
      title: "Address overdue tasks",
      description: `${metrics.overdueTasks} task${metrics.overdueTasks === 1 ? "" : "s"} ${metrics.overdueTasks === 1 ? "is" : "are"} overdue. Review priorities and reset realistic deadlines.`,
      priority: "high",
    });
  }

  if (metrics.completionRate < 50) {
    recommendations.push({
      id: "low-completion",
      title: "Improve task completion",
      description: "Focus on completing high-priority tasks to boost the completion rate above 50%.",
      priority: "high",
    });
  }

  if (metrics.activeMemberRatio < 0.5) {
    recommendations.push({
      id: "member-engagement",
      title: "Increase team engagement",
      description: "Only ${(metrics.activeMemberRatio * 100).toFixed(0)}% of members are actively contributing. Re-engage inactive team members.",
      priority: "medium",
    });
  }

  if (metrics.highPriorityTasks > 5) {
    recommendations.push({
      id: "priority-focus",
      title: "Reduce priority backlog",
      description: `${metrics.highPriorityTasks} high-priority tasks may be overwhelming. Consider deprioritizing or breaking down large tasks.`,
      priority: "medium",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: "maintain-momentum",
      title: "Maintain current momentum",
      description: "Continue current practices. Project is performing well with no critical issues.",
      priority: "low",
    });
  }

  return recommendations;
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

export async function generateProjectReport(input: ReportInput): Promise<GeneratedReport> {
  if (!input.projectId) {
    throw new Error("Project ID is required.");
  }

  const { supabase, user } = await getSupabaseClient();

  // Check if user is a leader (required for generating reports)
  const isLeader = await isProjectLeader(supabase, user.id, input.projectId);
  if (!isLeader) {
    throw new Error("Only project leaders can generate reports.");
  }

  const { label, start, end } = getPeriodRange(input);

  // Fetch all project data in parallel
  const [projectResult, tasksResult, membersResult, activitiesResult, workflowResult] = await Promise.all([
    supabase
      .from("projects")
      .select("id,title,description,status,created_at")
      .eq("id", input.projectId)
      .maybeSingle(),
    supabase
      .from("tasks")
      .select("id,title,description,status,priority,assigned_to,assigned_user,due_date,created_at,updated_at")
      .eq("project_id", input.projectId),
    supabase
      .from("project_members")
      .select("id,user_id,name,email,role,created_at")
      .eq("project_id", input.projectId),
    supabase
      .from("activities")
      .select("id,user_id,user_name,action,description,created_at")
      .eq("project_id", input.projectId)
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())
      .order("created_at", { ascending: false }),
    supabase
      .from("ai_workflows")
      .select("workflow_json")
      .eq("project_id", input.projectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (projectResult.error || !projectResult.data) {
    throw new Error(projectResult.error?.message ?? "Project not found.");
  }

  if (tasksResult.error) {
    throw new Error(tasksResult.error.message);
  }

  if (membersResult.error) {
    throw new Error(membersResult.error.message);
  }

  if (activitiesResult.error) {
    throw new Error(activitiesResult.error.message);
  }

  const project = projectResult.data;
  const tasks = tasksResult.data ?? [];
  const members = membersResult.data ?? [];
  const activities = activitiesResult.data ?? [];
  const workflowData = workflowResult.data?.workflow_json;

  // Filter tasks for the reporting period
  const periodTasks = tasks.filter((task) => {
    return (
      isInPeriod(task.created_at, start, end) ||
      isInPeriod(task.updated_at, start, end) ||
      isInPeriod(task.due_date, start, end)
    );
  });

  const tasksForMetrics = periodTasks.length > 0 ? periodTasks : tasks;
  const completedTasks = tasksForMetrics.filter((task) => isComplete(task.status));
  const pendingTasks = tasksForMetrics.filter((task) => !isComplete(task.status));
  const today = new Date();
  const overdueTasks = tasksForMetrics.filter((task) => {
    if (!task.due_date || isComplete(task.status)) return false;
    return new Date(task.due_date) < today;
  });
  const highPriorityTasks = tasksForMetrics.filter((task) => task.priority === "high");

  // Calculate metrics
  const totalTasks = tasksForMetrics.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;
  const overdueTaskRatio = totalTasks > 0 ? overdueTasks.length / totalTasks : 0;
  
  // Calculate task velocity (tasks completed per week)
  const weeksInPeriod = Math.max(1, (end.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const taskVelocity = completedTasks.length / weeksInPeriod;

  // Calculate active member ratio
  const activeUserIds = new Set(activities.map((activity) => activity.user_id).filter(Boolean));
  const activeMemberRatio = members.length > 0 ? activeUserIds.size / members.length : 0;

  const metrics: ReportMetrics = {
    totalTasks,
    completedTasks: completedTasks.length,
    pendingTasks: pendingTasks.length,
    overdueTasks: overdueTasks.length,
    highPriorityTasks: highPriorityTasks.length,
    completionRate,
    taskVelocity,
    activeMemberRatio,
    overdueTaskRatio,
  };

  // Generate achievements
  const achievements: ReportAchievement[] = [
    ...completedTasks.slice(0, 8).map((task): ReportAchievement => ({
      id: task.id,
      title: task.title,
      description: task.description ?? "Task completed during this reporting cycle.",
      date: task.updated_at ?? task.due_date ?? task.created_at,
    })),
    ...activities
      .filter((activity) => activity.action?.includes("completed"))
      .slice(0, 4)
      .map((activity): ReportAchievement => ({
        id: activity.id,
        title: activity.description ?? "Completed milestone",
        description: `${activity.user_name ?? "Team member"} recorded a completion.`,
        date: activity.created_at,
      })),
  ].slice(0, 10);

  // Generate challenges
  const challenges: ReportChallenge[] = [
    ...overdueTasks.slice(0, 5).map((task): ReportChallenge => ({
      id: task.id,
      title: `Overdue: ${task.title}`,
      description: task.due_date
        ? `Due date passed on ${new Date(task.due_date).toLocaleDateString()}.`
        : "This task is overdue.",
      severity: task.priority === "high" ? "high" : "medium",
    })),
  ];

  if (activeMemberRatio < 0.3 && members.length > 1) {
    challenges.push({
      id: "low-engagement",
      title: "Low team engagement",
      description: `Only ${(activeMemberRatio * 100).toFixed(0)}% of members are actively participating.`,
      severity: "medium",
    });
  }

  if (completionRate < 30) {
    challenges.push({
      id: "low-completion",
      title: "Low completion rate",
      description: `Only ${completionRate}% of tasks are completed. Project may be at risk.`,
      severity: "high",
    });
  }

  // Calculate health score
  const healthScore = calculateHealthScore(metrics);

  // Generate executive summary
  const executiveSummary = buildExecutiveSummary(project, metrics, healthScore);

  // Generate recommendations
  const recommendations = buildRecommendations(metrics, challenges);

  // Process workflow data if available
  let workflow;
  if (workflowData && workflowData.phases) {
    workflow = {
      phases: workflowData.phases.map((phase: any) => ({
        name: phase.phase_name,
        progress: phase.progress ?? 0,
        tasks: phase.tasks?.length ?? 0,
      })),
    };
  }

  const report: GeneratedReport = {
    project: {
      id: project.id,
      title: project.title,
      description: project.description,
      status: project.status,
      start_date: project.created_at,
      end_date: null,
    },
    reportType: input.reportType,
    period: {
      label,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    },
    executiveSummary,
    metrics,
    achievements,
    challenges,
    recommendations,
    healthScore,
    workflow,
    generatedAt: new Date().toISOString(),
  };

  // Save report to database
  const { error: saveError } = await supabase.from("project_reports").insert({
    project_id: input.projectId,
    report_type: input.reportType,
    period_start: start.toISOString(),
    period_end: end.toISOString(),
    report_json: report as any,
    created_by: user.id,
  });

  if (saveError) {
    console.error("[generateProjectReport] Failed to save report:", saveError);
    // Continue anyway, report is generated even if save fails
  }

  revalidatePath(`/dashboard/workspace/${input.projectId}`);

  return report;
}

export async function getProjectReports(projectId: string): Promise<ReportHistoryItem[]> {
  const { supabase, user } = await getSupabaseClient();

  // Check if user is a member
  const { data: membership } = await supabase
    .from("project_members")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    throw new Error("You must be a project member to view reports.");
  }

  const { data, error } = await supabase
    .from("project_reports")
    .select("id,report_type,period_start,period_end,created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => ({
    id: item.id,
    reportType: item.report_type as ReportType,
    periodStart: item.period_start,
    periodEnd: item.period_end,
    createdAt: item.created_at,
  }));
}

export async function getSavedReport(reportId: string): Promise<GeneratedReport> {
  const { supabase, user } = await getSupabaseClient();

  const { data, error } = await supabase
    .from("project_reports")
    .select("report_json")
    .eq("id", reportId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message ?? "Report not found.");
  }

  return data.report_json as GeneratedReport;
}

export async function deleteReport(reportId: string, projectId: string): Promise<void> {
  const { supabase, user } = await getSupabaseClient();

  // Check if user is a leader
  const isLeader = await isProjectLeader(supabase, user.id, projectId);
  if (!isLeader) {
    throw new Error("Only project leaders can delete reports.");
  }

  const { error } = await supabase
    .from("project_reports")
    .delete()
    .eq("id", reportId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/workspace/${projectId}`);
}
