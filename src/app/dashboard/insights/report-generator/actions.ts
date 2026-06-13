"use server";

import { createClient } from "@/lib/supabase/server";
import { buildProjectTimelineContext } from "@/lib/project-timeline";
import type {
  ReportPeriodType,
  ProjectOption,
  ReportInput,
  ReportMetricsData,
  ReportAchievement,
  ReportChallenge,
  ReportRecommendation,
  GeneratedReport,
} from "./report-types";

interface ProjectRow {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  assigned_to: string | null;
  assigned_user: string | null;
  due_date: string | null;
  created_at: string | null;
  updated_at?: string | null;
}

interface MemberRow {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  created_at: string | null;
}

interface ActivityRow {
  id: string;
  user_id: string | null;
  user_name: string | null;
  action: string | null;
  description: string | null;
  created_at: string | null;
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getPeriodRange(input: ReportInput) {
  const now = new Date();
  const end = input.endDate ? new Date(input.endDate) : now;
  const start = input.startDate ? new Date(input.startDate) : new Date(now);

  if (input.periodType === "weekly" && !input.startDate) {
    start.setDate(end.getDate() - 6);
  }

  if (input.periodType === "monthly" && !input.startDate) {
    start.setDate(1);
  }

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Invalid reporting period.");
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const label =
    input.periodType === "weekly"
      ? "Weekly Report"
      : input.periodType === "monthly"
        ? "Monthly Report"
        : "Custom Report";

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

function buildOverview(project: ProjectRow, metrics: ReportMetricsData) {
  const progressLabel =
    metrics.completionRate >= 80
      ? "strong progress"
      : metrics.completionRate >= 40
        ? "steady progress"
        : "early-stage progress";
  const timelineContext = buildProjectTimelineContext({
    title: project.title,
    description: project.description,
    status: project.status,
    startDate: project.start_date,
    endDate: project.end_date,
  });

  return `${project.title} is currently ${project.status ?? "active"} with ${progressLabel}. The team has completed ${metrics.completedTasks} of ${metrics.totalTasks} tasks, reaching a ${metrics.completionRate}% completion rate with ${metrics.activeMembers} active member${metrics.activeMembers === 1 ? "" : "s"}.\n\n${timelineContext}`;
}

function buildCommunityImpact(project: ProjectRow, members: MemberRow[], activities: ActivityRow[]) {
  const activityCount = activities.length;
  const memberCount = members.length;
  const activityText =
    activityCount > 0
      ? `${activityCount} documented project activit${activityCount === 1 ? "y" : "ies"}`
      : "the current project plan and team coordination";

  return `${project.title} is building community impact through ${activityText}. With ${memberCount} participating member${memberCount === 1 ? "" : "s"}, the expected benefit is a more organized, measurable response to the community need described by the project.`;
}

function buildRecommendations(
  metrics: ReportMetricsData,
  challenges: ReportChallenge[],
  project?: ProjectRow
) {
  const recommendations: ReportRecommendation[] = [];

  if (project?.end_date) {
    const daysRemaining = Math.max(
      0,
      Math.floor(
        (new Date(project.end_date).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      )
    );

    if (daysRemaining <= 14 && metrics.completionRate < 70) {
      recommendations.push({
        id: "timeline-risk",
        title: "Address timeline risk",
        description: `Only ${daysRemaining} day${daysRemaining === 1 ? "" : "s"} remain before the project end date. Prioritize critical tasks to stay on schedule.`,
        priority: "high",
      });
    }
  }

  if (metrics.delayedTasks > 0) {
    recommendations.push({
      id: "delayed-tasks",
      title: "Resolve delayed tasks first",
      description: `Review the ${metrics.delayedTasks} delayed task${metrics.delayedTasks === 1 ? "" : "s"}, assign clear owners, and reset realistic due dates.`,
      priority: "high",
    });
  }

  if (metrics.completionRate < 50) {
    recommendations.push({
      id: "increase-completion-rate",
      title: "Focus on task completion",
      description: "Prioritize a smaller set of high-impact tasks for the next reporting period to improve visible progress.",
      priority: "high",
    });
  }

  if (metrics.activitiesConducted < 2) {
    recommendations.push({
      id: "increase-activity-logging",
      title: "Document project activity",
      description: "Record meetings, outreach, completed work, and decisions so the report can show stronger evidence of implementation.",
      priority: "medium",
    });
  }

  if (metrics.activeMembers < 2) {
    recommendations.push({
      id: "strengthen-participation",
      title: "Strengthen team participation",
      description: "Invite or re-engage members and clarify roles so implementation does not depend on one person.",
      priority: "medium",
    });
  }

  if (recommendations.length === 0 && challenges.length === 0) {
    recommendations.push({
      id: "maintain-momentum",
      title: "Maintain current momentum",
      description: "Continue weekly progress reviews and keep documenting outcomes for competition-ready evidence.",
      priority: "low",
    });
  }

  return recommendations;
}

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

export async function getReportProjects(): Promise<ProjectOption[]> {
  const { supabase, user } = await getSupabaseClient();

  const { data: memberships, error: membershipError } = await supabase
    .from("project_members")
    .select("project_id")
    .eq("user_id", user.id);

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  const projectIds = (memberships ?? [])
    .map((row: any) => row.project_id)
    .filter((id: any): id is string => typeof id === "string");

  if (projectIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("projects")
    .select("id,title,status")
    .in("id", projectIds)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((project: any) => ({
    id: project.id,
    title: project.title,
    status: project.status,
  }));
}

export async function generateReport(input: ReportInput): Promise<GeneratedReport> {
  if (!input.projectId) {
    throw new Error("Project is required.");
  }

  const { supabase, user } = await getSupabaseClient();
  const { label, start, end } = getPeriodRange(input);

  const { data: membership } = await supabase
    .from("project_members")
    .select("id")
    .eq("project_id", input.projectId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    throw new Error("You do not have access to this project.");
  }

  const [projectResult, tasksResult, membersResult, activitiesResult] = await Promise.all([
    supabase
      .from("projects")
      .select("id,title,description,status,start_date,end_date")
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

  const project = projectResult.data as ProjectRow;
  const tasks = (tasksResult.data ?? []) as TaskRow[];
  const members = (membersResult.data ?? []) as MemberRow[];
  const activities = (activitiesResult.data ?? []) as ActivityRow[];
  const periodTasks = tasks.filter((task) => {
    return (
      isInPeriod(task.created_at, start, end) ||
      isInPeriod(task.updated_at, start, end) ||
      isInPeriod(task.due_date, start, end)
    );
  });
  const tasksForMetrics = periodTasks.length > 0 ? periodTasks : tasks;
  const completedTasks = tasksForMetrics.filter((task) => isComplete(task.status));
  const today = new Date();
  const delayedTasks = tasksForMetrics.filter((task) => {
    if (!task.due_date || isComplete(task.status)) return false;
    return new Date(task.due_date) < today;
  });
  const activeUserIds = new Set(activities.map((activity) => activity.user_id).filter(Boolean));
  const activeMembers = Math.max(activeUserIds.size, members.length > 0 && activities.length > 0 ? 1 : 0);
  const completionRate =
    tasksForMetrics.length > 0
      ? Math.round((completedTasks.length / tasksForMetrics.length) * 100)
      : 0;

  const metrics: ReportMetricsData = {
    totalTasks: tasksForMetrics.length,
    completedTasks: completedTasks.length,
    completionRate,
    activeMembers,
    projectStatus: project.status ?? "active",
    delayedTasks: delayedTasks.length,
    activitiesConducted: activities.length,
  };

  const achievements = [
    ...completedTasks.slice(0, 6).map((task): ReportAchievement => ({
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
        title: activity.description ?? "Completed activity",
        description: `${activity.user_name ?? "Team member"} recorded a completion milestone.`,
        date: activity.created_at,
      })),
  ].slice(0, 8);

  const challenges: ReportChallenge[] = [
    ...delayedTasks.slice(0, 4).map((task): ReportChallenge => ({
      id: task.id,
      title: `Delayed task: ${task.title}`,
      description: task.due_date
        ? `Due date passed on ${toIsoDate(new Date(task.due_date))}.`
        : "This task is delayed and needs follow-up.",
      severity: task.priority === "high" ? "high" : "medium",
    })),
  ];

  if (activities.length === 0) {
    challenges.push({
      id: "no-activity",
      title: "Limited activity evidence",
      description: "No activities were recorded in this reporting period.",
      severity: "medium",
    });
  }

  if (activeMembers <= 1 && members.length > 1) {
    challenges.push({
      id: "inactive-participation",
      title: "Inactive participation",
      description: "Only limited member participation is visible in the activity log.",
      severity: "medium",
    });
  }

  const overview = buildOverview(project, metrics);
  const communityImpact = buildCommunityImpact(project, members, activities);
  const recommendations = buildRecommendations(metrics, challenges, project);

  return {
    project,
    period: {
      label,
      startDate: toIsoDate(start),
      endDate: toIsoDate(end),
    },
    overview,
    metrics,
    achievements,
    challenges,
    communityImpact,
    recommendations,
  };
}
