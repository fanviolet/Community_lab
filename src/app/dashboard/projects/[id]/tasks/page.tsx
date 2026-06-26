import { redirect } from "next/navigation";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
} from "@/lib/rbac";
import { getTasks, getProjectMetrics } from "../../actions";
import { TaskList } from "./task-list";

export default async function TasksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = parseRole(profile?.role);
  const ctx = createAuthenticatedContext(role, user.id);

  if (!hasPermission(ctx, "task.view")) {
    redirect("/dashboard/projects");
  }

  const canCreateTask = hasPermission(ctx, "task.create");

  const { id: projectId } = await params;

  const [tasks, metrics] = await Promise.all([
    getTasks(projectId),
    getProjectMetrics(projectId),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Nhiệm vụ</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {metrics.total_tasks} tổng · {metrics.completed_tasks} đã hoàn
              thành
            </p>
          </div>
        </div>
        {canCreateTask && (
          <Button asChild>
            <Link href={`/dashboard/projects/${projectId}/new-task`}>
              <Plus className="mr-2 h-4 w-4" />
              Tạo nhiệm vụ mới
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tổng nhiệm vụ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_tasks}</div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Đang thực hiện
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.in_progress_tasks}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Đã hoàn thành</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completed_tasks}</div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quá hạn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics.overdue_tasks}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Tất cả nhiệm vụ</CardTitle>
          <CardDescription>
            Quản lý và theo dõi tất cả nhiệm vụ của dự án
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Tìm nhiệm vụ..." className="pl-10" />
          </div>
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-muted-foreground text-center">
                Chưa có nhiệm vụ nào. Tạo nhiệm vụ đầu tiên để bắt đầu.
              </p>
            </div>
          ) : (
            <TaskList tasks={tasks} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
