import Link from "next/link";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";

import { t } from "@/lib/translate";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAuthSession } from "@/lib/auth/server";
import MemberManagement from "@/components/workspace/MemberManagement";
import TaskManagement from "@/components/workspace/TaskManagement";
import ActivityTimeline from "@/components/workspace/ActivityTimeline";
import { LazyTabsContent } from "@/components/workspace/LazyTabsContent";
import { getProjectTimelineInfo } from "@/lib/project-timeline";
import { buildProjectRBACContext } from "@/lib/rbac-server";
import { getWorkspacePermissions, hasPermission } from "@/lib/rbac";
import StructuredPlanningForm from "@/components/workspace/planning/StructuredPlanningForm";
import { saveProjectPlanningInfo } from "../planning-actions";
import { parsePlanningInfoFromRow } from "@/lib/workspace/planning-utils";
import {
  getDomainLabel,
  getProjectTypeLabel,
  getDeliverableLabel,
  getTargetAudienceLabel,
  DOMAIN_LABELS,
  PROJECT_TYPE_LABELS,
  DELIVERABLE_LABELS,
  TARGET_AUDIENCE_LABELS,
  type ProjectDomain,
  type ProjectType,
  type Deliverable,
  type TargetAudience,
  type SuccessMetricInput,
} from "@/types/planning-types";
import { updateProject, archiveProject } from "../actions";
import {
  generateProjectReport,
  getProjectReports,
  getSavedReport,
  deleteReport,
} from "./report-actions";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { isSupabaseConfigured } from "@/lib/supabase-env";

const ProjectWorkflow = dynamic(
  () => import("@/components/workspace/ProjectWorkflow"),
  {
    loading: () => (
      <div
        className="h-32 animate-pulse rounded-lg bg-muted"
        aria-hidden="true"
      />
    ),
  },
);

const DiscussionHub = dynamic(
  () => import("@/components/discussion/DiscussionHub"),
  {
    loading: () => (
      <div
        className="h-[calc(100vh-12rem)] animate-pulse rounded-lg bg-muted"
        aria-hidden="true"
      />
    ),
  },
);

const ProjectReport = dynamic(
  () => import("@/components/workspace/ProjectReport"),
  {
    loading: () => (
      <div
        className="h-32 animate-pulse rounded-lg bg-muted"
        aria-hidden="true"
      />
    ),
  },
);

interface ProjectDetail {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string | null;
}

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  assigned_to: string | null; // UUID
  assigned_user: string | null; // display name or email
  assignee?: {
    id: string;
    display_name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
  };
  due_date: string | null;
  created_at: string | null;
}

interface MemberItem {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  avatar_url: string | null;
  created_at: string | null;
}

interface ActivityItem {
  id: string;
  user_id: string | null;
  user_name: string | null;
  action: string | null;
  description: string | null;
  created_at: string | null;
}

function statusBadgeVariant(status: string | null) {
  if (!status) return "pending";

  switch (status.toString().toLowerCase()) {
    case "active":
      return "secondary";
    case "completed":
    case "done":
      return "approved";
    case "archived":
      return "muted";
    default:
      return "pending";
  }
}

const statusLabels: Record<string, string> = {
  planning: t("projectDetail.statusLabels.planning"),
  active: t("projectDetail.statusLabels.active"),
  paused: t("projectDetail.statusLabels.paused"),
  completed: t("projectDetail.statusLabels.completed"),
  archived: t("projectDetail.statusLabels.archived"),
};

function isCompleteStatus(status: string | null) {
  return ["completed", "done", "complete"].includes(
    status?.toString().toLowerCase() ?? "",
  );
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Supabase chưa được cấu hình. Thêm biến môi trường vào{" "}
        <code className="font-mono">.env.local</code>
      </div>
    );
  }

  const { supabase, user } = await getAuthSession();

  if (!user) {
    redirect("/login");
  }

  const rbacCtx = await buildProjectRBACContext(id);

  if (!hasPermission(rbacCtx, "workspace.view")) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {t("projectDetail.accessDenied")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("projectDetail.accessDeniedDescription")}
            </p>
          </div>
          <Link
            href="/dashboard/workspace"
            className="inline-flex items-center rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
          >
            {t("projectDetail.backToWorkspace")}
          </Link>
        </div>
      </div>
    );
  }

  const permissions = getWorkspacePermissions(rbacCtx);
  const isLeader = permissions.canEditProject;

  const [projectResult, tasksResult, membersResult, activitiesResult] =
    await Promise.all([
      // Debug: we will log any query errors after the results are returned
      // (no change to the queries themselves)
      supabase
        .from("projects")
        .select(
          "id,title,description,status,start_date,end_date,created_at,domain,project_type,team_size,experience_level,budget_range,duration_days,main_goal,deliverables,target_audience,success_metrics",
        )
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("tasks")
        .select(
          `
        id,
        title,
        description,
        status,
        priority,
        assigned_to,
        assigned_user,
        due_date,
        created_at
      `,
        )
        .eq("project_id", id)
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("project_members")
        .select("id,user_id,name,email,role,avatar_url,created_at")
        .eq("project_id", id)
        .order("role", { ascending: false })
        .order("name", { ascending: true }),
      supabase
        .from("activities")
        .select("id,user_id,user_name,action,description,created_at")
        .eq("project_id", id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  if (!projectResult.data) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {t("projectDetail.notFound")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("projectDetail.notFoundDescription")}
            </p>
          </div>
          <Link
            href="/dashboard/workspace"
            className="inline-flex items-center rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
          >
            {t("projectDetail.backToWorkspace")}
          </Link>
        </div>
      </div>
    );
  }

  const project: ProjectDetail = projectResult.data;
  const planningData = parsePlanningInfoFromRow(projectResult.data);
  const rawTasks: TaskItem[] = tasksResult.data ?? [];
  const members: MemberItem[] = membersResult.data ?? [];
  const activities: ActivityItem[] = activitiesResult.data ?? [];

  // Resolve assignee profiles separately because the DB may lack FK relationships
  let tasks: TaskItem[] = rawTasks;
  try {
    const assignedIds = Array.from(
      new Set((rawTasks || []).map((t) => t.assigned_to).filter(Boolean)),
    );
    if (assignedIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, display_name, email, avatar_url")
        .in("id", assignedIds);
      if (profilesError) {
        console.error("[ProjectPage] Profiles fetch error:", profilesError);
      } else if (profiles) {
        const byId: Record<string, any> = {};
        for (const p of profiles) byId[p.id] = p;
        tasks = (rawTasks || []).map((t) => ({
          ...t,
          assignee: t.assigned_to ? (byId[t.assigned_to] ?? null) : null,
        }));
      }
    }

    if (tasksResult.error)
      console.error("[ProjectPage] Tasks query error:", tasksResult.error);
    console.log("[ProjectPage] Fetched tasks count:", tasks.length);
  } catch (err) {
    console.error("[ProjectPage] Error resolving assignees:", err);
  }

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) =>
    isCompleteStatus(task.status),
  ).length;
  const inProgressTasks = tasks.filter(
    (task) => task.status === "in_progress",
  ).length;
  const progress =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const timeline = getProjectTimelineInfo({
    startDate: project.start_date,
    endDate: project.end_date,
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {project.title}
            </h1>
            <Badge
              variant={statusBadgeVariant(project.status)}
              className="mt-1"
            >
              {(project.status && statusLabels[project.status.toLowerCase()]) ||
                project.status ||
                t("projectDetail.defaultStatus")}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {project.description ?? t("projectDetail.noDescription")}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/workspace"
            className="inline-flex items-center rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
              />
            </svg>
            {t("projectDetail.back")}
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("projectDetail.totalTasks")}
                </p>
                <p className="text-2xl font-semibold text-foreground">
                  {totalTasks}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("projectDetail.completed")}
                </p>
                <p className="text-2xl font-semibold text-foreground">
                  {completedTasks}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                <svg
                  className="h-6 w-6 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("projectDetail.teamMembers")}
                </p>
                <p className="text-2xl font-semibold text-foreground">
                  {members.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                <svg
                  className="h-6 w-6 text-amber-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("projectDetail.progress")}
                </p>
                <p className="text-2xl font-semibold text-foreground">
                  {progress}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList
          className="grid w-full lg:w-auto lg:inline-grid"
          style={{
            gridTemplateColumns: isLeader ? "repeat(8, 1fr)" : "repeat(7, 1fr)",
          }}
        >
          <TabsTrigger value="overview">
            {t("projectDetail.tabs.overview")}
          </TabsTrigger>
          <TabsTrigger value="workflow">
            {t("projectDetail.tabs.workflow")}
          </TabsTrigger>
          <TabsTrigger value="tasks">
            {t("projectDetail.tabs.tasks")}
          </TabsTrigger>
          <TabsTrigger value="members">
            {t("projectDetail.tabs.members")}
          </TabsTrigger>
          <TabsTrigger value="discussion">
            {t("projectDetail.tabs.discussion")}
          </TabsTrigger>
          <TabsTrigger value="activity">
            {t("projectDetail.tabs.activity")}
          </TabsTrigger>
          <TabsTrigger value="reports">
            {t("projectDetail.tabs.reports")}
          </TabsTrigger>
          {isLeader && (
            <TabsTrigger value="settings">
              {t("projectDetail.tabs.settings")}
            </TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab - Redesigned Layout */}
        <LazyTabsContent value="overview" className="space-y-6" eager={true}>
          {/* AI Planning Inputs Card */}
          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {t("projectDetail.overview.aiPlanningInputs")}
                  </CardTitle>
                  <CardDescription>
                    {t("projectDetail.overview.aiPlanningDescription")}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {planningData?.domain && (
                    <Badge variant="approved" className="text-xs">
                      {getDomainLabel(planningData.domain as ProjectDomain)}
                    </Badge>
                  )}
                  {planningData?.duration_days && (
                    <Badge variant="secondary" className="text-xs">
                      {planningData.duration_days} ngày
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <StructuredPlanningForm
                projectId={project.id}
                initialData={{
                  domain: (planningData?.domain as ProjectDomain) ?? null,
                  project_type:
                    (planningData?.project_type as ProjectType) ?? null,
                  team_size: planningData?.team_size ?? null,
                  experience_level:
                    (planningData?.experience_level as any) ?? null,
                  budget_range: (planningData?.budget_range as any) ?? null,
                  duration_days: planningData?.duration_days ?? null,
                  main_goal: planningData?.main_goal ?? null,
                  deliverables: Array.isArray(planningData?.deliverables)
                    ? (planningData.deliverables as Deliverable[])
                    : [],
                  target_audience: Array.isArray(planningData?.target_audience)
                    ? (planningData.target_audience as TargetAudience[])
                    : [],
                  success_metrics: Array.isArray(planningData?.success_metrics)
                    ? (planningData.success_metrics as SuccessMetricInput[])
                    : [],
                }}
                isLeader={isLeader}
                onSave={saveProjectPlanningInfo.bind(null, project.id)}
              />
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
            <div className="space-y-6">
              {/* Progress Section */}
              <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
                <CardHeader>
                  <CardTitle>{t("projectDetail.overview.progress")}</CardTitle>
                  <CardDescription>
                    {t("projectDetail.overview.progressDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t("projectDetail.overview.overallProgress")}
                      </span>
                      <span className="font-medium text-foreground">
                        {progress}%
                      </span>
                    </div>
                    <Progress value={progress} className="h-3" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-foreground">
                        {totalTasks}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("projectDetail.overview.totalTasks")}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-foreground">
                        {completedTasks}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("projectDetail.overview.completed")}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-foreground">
                        {inProgressTasks}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("projectDetail.overview.inProgress")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Project Timeline */}
              <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
                <CardHeader>
                  <CardTitle>
                    {t("projectDetail.overview.projectTimeline")}
                  </CardTitle>
                  <CardDescription>
                    {t("projectDetail.overview.timelineDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">
                        {t("projectDetail.overview.startDate")}
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-foreground">
                        {timeline.startDate ??
                          t("projectDetail.overview.notSet")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">
                        {t("projectDetail.overview.endDate")}
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-foreground">
                        {timeline.endDate ?? t("projectDetail.overview.notSet")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">
                        {t("projectDetail.overview.duration")}
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-foreground">
                        {timeline.duration ??
                          t("projectDetail.overview.notSet")}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Team Members Summary */}
              <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
                <CardHeader>
                  <CardTitle>{t("projectDetail.overview.team")}</CardTitle>
                  <CardDescription>
                    {t("projectDetail.overview.membersCount", {
                      count: members.length,
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {members.slice(0, 5).map((member) => (
                      <div key={member.id} className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                          {member.name
                            ? member.name.charAt(0).toUpperCase()
                            : "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {member.name || t("projectDetail.overview.unknown")}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {member.role || "member"}
                          </p>
                        </div>
                      </div>
                    ))}
                    {members.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center">
                        {t("projectDetail.overview.moreMembers", {
                          count: members.length - 5,
                        })}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Deliverables Summary */}
              {Array.isArray(planningData?.deliverables) &&
                planningData.deliverables.length > 0 && (
                  <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
                    <CardHeader>
                      <CardTitle>
                        {t("projectDetail.overview.deliverables")}
                      </CardTitle>
                      <CardDescription>
                        {t("projectDetail.overview.deliverablesCount", {
                          count: planningData.deliverables.length,
                        })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {planningData.deliverables.map((d) => (
                          <Badge key={d} variant="secondary">
                            {getDeliverableLabel(d as Deliverable)}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Target Audience Summary */}
              {Array.isArray(planningData?.target_audience) &&
                planningData.target_audience.length > 0 && (
                  <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
                    <CardHeader>
                      <CardTitle>
                        {t("projectDetail.overview.targetAudience")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {planningData.target_audience.map((a) => (
                          <Badge key={a} variant="outline">
                            {getTargetAudienceLabel(a as TargetAudience)}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Success Metrics Summary */}
              {Array.isArray(planningData?.success_metrics) &&
                planningData.success_metrics.length > 0 && (
                  <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
                    <CardHeader>
                      <CardTitle>
                        {t("projectDetail.overview.successMetrics")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {planningData.success_metrics.map((m, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-muted-foreground">
                              {m.metric}
                            </span>
                            <span className="font-medium">{m.target}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
            </div>
          </div>
        </LazyTabsContent>

        {/* Workflow Tab */}
        <LazyTabsContent value="workflow" className="space-y-6">
          <ProjectWorkflow projectId={project.id} isLeader={isLeader} />
        </LazyTabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6">
          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardHeader>
              <CardTitle>{t("projectDetail.tasks.title")}</CardTitle>
              <CardDescription>
                {t("projectDetail.tasks.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TaskManagement
                projectId={project.id}
                tasks={tasks}
                currentUserId={user.id}
                isLeader={isLeader}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-6">
          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardHeader>
              <CardTitle>{t("projectDetail.members.title")}</CardTitle>
              <CardDescription>
                {t("projectDetail.members.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MemberManagement
                projectId={project.id}
                members={members}
                currentUserId={user.id}
                isLeader={isLeader}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Discussion Tab */}
        <LazyTabsContent value="discussion" className="space-y-6">
          <div className="h-[calc(100vh-12rem)]">
            <DiscussionHub projectId={project.id} />
          </div>
        </LazyTabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardHeader>
              <CardTitle>{t("projectDetail.activity.title")}</CardTitle>
              <CardDescription>
                {t("projectDetail.activity.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityTimeline activities={activities} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        {isFeatureEnabled("AI_REPORT_GENERATION") && (
          <LazyTabsContent value="reports" className="space-y-6">
            <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
              <CardHeader>
                <CardTitle>{t("projectDetail.reports.title")}</CardTitle>
                <CardDescription>
                  {t("projectDetail.reports.description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProjectReport
                  projectId={project.id}
                  isLeader={isLeader}
                  generateReport={generateProjectReport}
                  getReports={getProjectReports}
                  getReport={getSavedReport}
                  deleteReport={deleteReport}
                />
              </CardContent>
            </Card>
          </LazyTabsContent>
        )}

        {/* Settings Tab - Leaders Only */}
        {isLeader && (
          <TabsContent value="settings" className="space-y-6">
            <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
              <CardHeader>
                <CardTitle>{t("projectDetail.settings.title")}</CardTitle>
                <CardDescription>
                  {t("projectDetail.settings.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Edit Project Form */}
                <form action={updateProject} className="space-y-4">
                  <input type="hidden" name="projectId" value={project.id} />
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {t("projectDetail.settings.projectName")}
                    </label>
                    <Input name="title" defaultValue={project.title} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {t("projectDetail.settings.description")}
                    </label>
                    <Textarea
                      name="description"
                      defaultValue={project.description ?? ""}
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {t("projectDetail.settings.status")}
                    </label>
                    <select
                      name="status"
                      defaultValue={project.status ?? "active"}
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <option value="planning">
                        {t("projectDetail.statusLabels.planning")}
                      </option>
                      <option value="active">
                        {t("projectDetail.statusLabels.active")}
                      </option>
                      <option value="paused">
                        {t("projectDetail.statusLabels.paused")}
                      </option>
                      <option value="completed">
                        {t("projectDetail.statusLabels.completed")}
                      </option>
                      <option value="archived">
                        {t("projectDetail.statusLabels.archived")}
                      </option>
                    </select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        {t("projectDetail.settings.startDate")}
                      </label>
                      <Input
                        name="startDate"
                        type="date"
                        defaultValue={project.start_date?.slice(0, 10) ?? ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        {t("projectDetail.settings.endDate")}
                      </label>
                      <Input
                        name="endDate"
                        type="date"
                        defaultValue={project.end_date?.slice(0, 10) ?? ""}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">
                      {t("projectDetail.settings.saveChanges")}
                    </Button>
                  </div>
                </form>

                {/* Danger Zone */}
                <div className="mt-8 rounded-xl border border-destructive/20 bg-destructive/5 p-6">
                  <h3 className="text-lg font-semibold text-destructive">
                    {t("projectDetail.settings.dangerZone")}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("projectDetail.settings.dangerDescription")}
                  </p>
                  <div className="mt-4">
                    <form action={archiveProject}>
                      <input
                        type="hidden"
                        name="projectId"
                        value={project.id}
                      />
                      <Button type="submit" variant="destructive">
                        {t("projectDetail.settings.archiveProject")}
                      </Button>
                    </form>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
