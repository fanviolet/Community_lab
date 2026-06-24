import Link from "next/link";
import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, FolderKanban, Search, TrendingDown, UserX, Calendar, Target, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { buildRBACContext } from "@/lib/rbac-server";
import { getWorkspacePermissions } from "@/lib/rbac";
import { ProjectHealthCard } from "@/components/dashboard/ProjectHealthCard";

interface ProjectSummary {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  taskCount: number;
  memberCount: number;
  progress: number;
  hasLeader: boolean;
  overdueTasks: number;
  healthIndicators: any[];
  milestoneCount?: number;
  completedMilestones?: number;
  endDate?: string;
}

export default async function WorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Supabase chưa được cấu hình. Thêm biến môi trường vào{' '}
        <code className="font-mono">.env.local</code>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get projects where user is a member
  const { data: membershipRows, error: membershipError } = await supabase
    .from("project_members")
    .select("project_id")
    .eq("user_id", user.id);

  if (membershipError) {
    console.error("[WorkspacePage] Error fetching memberships:", membershipError);
  }

  if (!membershipRows || membershipRows.length === 0) {
    console.log("[WorkspacePage] User is not a member of any projects:", user.id);
  }

  const rbacCtx = await buildRBACContext({ isProjectMember: (membershipRows?.length ?? 0) > 0 });
  const permissions = getWorkspacePermissions(rbacCtx);

  const projectIds = membershipRows?.map((m: any) => m.project_id) ?? [];

  if (projectIds.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="rounded-2xl border border-border/50 bg-gradient-to-r from-primary/10 to-primary/5 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/20">
                <FolderKanban className="size-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Project Workspace</h1>
                <p className="text-sm text-muted-foreground">
                  Browse all active projects, tasks, and team members.
                </p>
              </div>
            </div>
            {permissions.canCreateProject && (
              <Link href="/dashboard/workspace/new">
                <Button>New Project</Button>
              </Link>
            )}
          </div>
        </div>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardContent className="space-y-6 py-8">
            <p className="text-sm text-muted-foreground">
              You're not a member of any projects yet. Create a new project to get started.
            </p>
            {permissions.canCreateProject && (
              <Link href="/dashboard/workspace/new">
                <Button>Create First Project</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch project details for user's projects
  const { data: projectRows, error: projectError } = await supabase
    .from("projects")
    .select("id,title,description,status,end_date")
    .in("id", projectIds)
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  if (projectError) {
    console.error("[WorkspacePage] Error fetching projects:", projectError);
  }

  if (!projectRows || projectRows.length === 0) {
    console.log("[WorkspacePage] No projects found for user's memberships:", projectIds);
  }

  let projects: ProjectSummary[] = [];

  if (projectRows?.length) {
    const counts = await Promise.all(
      projectRows.map(async (project: any) => {
        const [{ count: taskCount }, { count: completedCount }, { count: memberCount }, { count: leaderCount }, { count: overdueCount }, { count: milestoneCount }, { count: completedMilestones }] =
          await Promise.all([
            supabase
              .from("tasks")
              .select("id", { count: "exact", head: true })
              .eq("project_id", project.id),
            supabase
              .from("tasks")
              .select("id", { count: "exact", head: true })
              .eq("project_id", project.id)
              .eq("status", "completed"),
            supabase
              .from("project_members")
              .select("id", { count: "exact", head: true })
              .eq("project_id", project.id),
            supabase
              .from("project_members")
              .select("id", { count: "exact", head: true })
              .eq("project_id", project.id)
              .eq("role", "leader"),
            supabase
              .from("tasks")
              .select("id", { count: "exact", head: true })
              .eq("project_id", project.id)
              .lt("due_date", new Date().toISOString())
              .neq("status", "completed"),
            supabase
              .from("milestones")
              .select("id", { count: "exact", head: true })
              .eq("project_id", project.id),
            supabase
              .from("milestones")
              .select("id", { count: "exact", head: true })
              .eq("project_id", project.id)
              .eq("status", "completed"),
          ]);

        const progress = taskCount && taskCount > 0 ? Math.round(((completedCount ?? 0) / taskCount) * 100) : 0;

        const healthIndicators = [];
        if ((leaderCount ?? 0) === 0) {
          healthIndicators.push({
            type: "missing_leader" as const,
            label: "No leader assigned",
            icon: UserX,
            color: "text-amber-600",
          });
        }
        if ((overdueCount ?? 0) > 0) {
          healthIndicators.push({
            type: "overdue_tasks" as const,
            label: `${overdueCount} overdue tasks`,
            icon: Clock,
            color: "text-rose-600",
          });
        }
        if (progress < 25 && (taskCount ?? 0) > 0) {
          healthIndicators.push({
            type: "stalled_progress" as const,
            label: "Low progress",
            icon: TrendingDown,
            color: "text-amber-600",
          });
        }

        return {
          id: project.id,
          title: project.title,
          description: project.description,
          status: project.status,
          taskCount: taskCount ?? 0,
          memberCount: memberCount ?? 0,
          progress,
          hasLeader: (leaderCount ?? 0) > 0,
          overdueTasks: overdueCount ?? 0,
          healthIndicators,
          milestoneCount: milestoneCount ?? 0,
          completedMilestones: completedMilestones ?? 0,
          endDate: project.end_date,
        };
      })
    );

    projects = counts;
  }

  // Filter by search query if provided
  if (q) {
    const query = q.toLowerCase();
    projects = projects.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query))
    );
  }

  // Calculate workspace metrics
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const totalTasks = projects.reduce((sum, p) => sum + p.taskCount, 0);
  const projectsNeedingAttention = projects.filter((p) => p.healthIndicators.length > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-border/50 bg-gradient-to-r from-primary/10 to-primary/5 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/20">
              <FolderKanban className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Project Workspace</h1>
              <p className="text-sm text-muted-foreground">
                Manage and track your project execution
              </p>
            </div>
          </div>
          {permissions.canCreateProject && (
            <Link href="/dashboard/workspace/new">
              <Button>New Project</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Workspace Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalProjects}</div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Active
              <FolderKanban className="size-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeProjects}</div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Total Tasks
              <Target className="size-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalTasks}</div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Needs Attention
              <AlertTriangle className="size-4 text-rose-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{projectsNeedingAttention}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            defaultValue={q}
            className="pl-10"
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.length > 0 ? (
          projects.map((project: any) => (
            <ProjectHealthCard
              key={project.id}
              id={project.id}
              title={project.title}
              status={project.status || "active"}
              progress={project.progress}
              memberCount={project.memberCount}
              taskCount={project.taskCount}
              healthIndicators={project.healthIndicators || []}
            />
          ))
        ) : (
          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5 col-span-full">
            <CardContent className="space-y-6 py-8">
              <p className="text-sm text-muted-foreground">
                {q ? "No projects found matching your search." : "No projects yet."}
              </p>
              {!q && permissions.canCreateProject && (
                <Link href="/dashboard/workspace/new">
                  <Button>Create First Project</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
