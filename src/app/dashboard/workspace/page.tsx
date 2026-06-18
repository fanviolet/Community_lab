import Link from "next/link";
import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/server";
import { buildRBACContext } from "@/lib/rbac-server";
import { getWorkspacePermissions } from "@/lib/rbac";

interface ProjectSummary {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  taskCount: number;
  memberCount: number;
  progress: number;
}

const statusLabels: Record<string, string> = {
  planning: "Lên kế hoạch",
  active: "Đang hoạt động",
  paused: "Tạm dừng",
  completed: "Hoàn thành",
  archived: "Đã lưu trữ",
};

function statusBadgeVariant(status: string | null) {
  if (!status) return "pending";
  switch (status.toLowerCase()) {
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

  const rbacCtx = await buildRBACContext({ isProjectMember: (membershipRows?.length ?? 0) > 0 });
  const permissions = getWorkspacePermissions(rbacCtx);

  const projectIds = membershipRows?.map((m: any) => m.project_id) ?? [];

  if (projectIds.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Project Workspace</h1>
            <p className="text-sm text-muted-foreground">
              Browse all active projects, tasks, and team members.
            </p>
          </div>
          {permissions.canCreateProject && (
            <Link href="/dashboard/workspace/new">
              <Button>Dự án mới</Button>
            </Link>
          )}
        </div>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardContent className="space-y-6 py-8">
            <p className="text-sm text-muted-foreground">
              Bạn chưa là thành viên của dự án nào. Tạo dự án mới để bắt đầu.
            </p>
            {permissions.canCreateProject && (
              <Link href="/dashboard/workspace/new">
                <Button>Tạo dự án đầu tiên</Button>
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
    .select("id,title,description,status")
    .in("id", projectIds)
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  if (projectError) {
    console.error("[WorkspacePage] Error fetching projects:", projectError);
  }

  let projects: ProjectSummary[] = [];

  if (projectRows?.length) {
    const counts = await Promise.all(
      projectRows.map(async (project: any) => {
        const [{ count: taskCount }, { count: completedCount }, { count: memberCount }] =
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
          ]);

        const progress = taskCount && taskCount > 0 ? Math.round(((completedCount ?? 0) / taskCount) * 100) : 0;

        return {
          id: project.id,
          title: project.title,
          description: project.description,
          status: project.status,
          taskCount: taskCount ?? 0,
          memberCount: memberCount ?? 0,
          progress,
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Không gian dự án</h1>
          <p className="text-sm text-muted-foreground">
            Xem tất cả dự án đang hoạt động, công việc và thành viên đội ngũ.
          </p>
        </div>
        {permissions.canCreateProject && (
          <div className="flex gap-2">
            <Link href="/dashboard/workspace/new">
              <Button>Dự án mới</Button>
            </Link>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Tìm kiếm dự án..."
          defaultValue={q}
          className="max-w-md"
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {projects.length > 0 ? (
          projects.map((project) => (
            <Card
              key={project.id}
              className="border-0 bg-white shadow-sm ring-1 ring-black/5 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                  <Badge variant={statusBadgeVariant(project.status)}>
                    {(project.status && statusLabels[project.status.toLowerCase()]) || project.status || "Đang hoạt động"}
                  </Badge>
                </div>
                <CardDescription>{project.description ?? "Không có mô tả"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Tiến độ</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-muted px-3 py-2 text-sm">
                    <p className="text-muted-foreground text-xs">Công việc</p>
                    <p className="font-semibold">{project.taskCount}</p>
                  </div>
                  <div className="rounded-xl bg-muted px-3 py-2 text-sm">
                    <p className="text-muted-foreground text-xs">Thành viên</p>
                    <p className="font-semibold">{project.memberCount}</p>
                  </div>
                </div>
                <Link
                  href={`/dashboard/workspace/${project.id}`}
                  className="inline-flex items-center rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition hover:border-primary hover:text-primary"
                >
                  Xem dự án
                </Link>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5 col-span-full">
            <CardContent className="space-y-6 py-8">
              <p className="text-sm text-muted-foreground">
                {q ? "Không tìm thấy dự án nào khớp với tìm kiếm." : "Chưa có dự án."}
              </p>
              {!q && (
                <Link href="/dashboard/workspace/new">
                  <Button>Tạo dự án đầu tiên</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
