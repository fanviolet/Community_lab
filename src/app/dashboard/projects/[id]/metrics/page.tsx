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
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
} from "@/lib/rbac";
import { getProjectMetrics } from "../../actions";

export default async function MetricsPage({
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

  if (!hasPermission(ctx, "project.metrics.view")) {
    redirect("/dashboard/projects");
  }

  const { id: projectId } = await params;
  const metrics = await getProjectMetrics(projectId);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Chỉ số dự án
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Theo dõi hiệu suất và tiến độ dự án
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoàn thành</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.completion_percentage.toFixed(0)}%
            </div>
            <Progress value={metrics.completion_percentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Nhiệm vụ đang thực hiện
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.in_progress_tasks}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.total_tasks} tổng số nhiệm vụ
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã hoàn thành</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completed_tasks}</div>
            <p className="text-xs text-muted-foreground">
              Nhiệm vụ đã hoàn thành
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quá hạn</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {metrics.overdue_tasks}
            </div>
            <p className="text-xs text-muted-foreground">Cần chú ý</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Theo dõi thời gian</CardTitle>
            <CardDescription>Số giờ ước tính so với thực tế</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Giờ ước tính</span>
                <span className="font-medium">
                  {metrics.total_estimated_hours}h
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Giờ thực tế</span>
                <span className="font-medium">
                  {metrics.total_actual_hours}h
                </span>
              </div>
              {metrics.total_estimated_hours > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span>Hiệu quả</span>
                  <span className="font-medium">
                    {(
                      (metrics.total_estimated_hours /
                        (metrics.total_actual_hours || 1)) *
                      100
                    ).toFixed(0)}
                    %
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Tiến độ cột mốc</CardTitle>
            <CardDescription>Trạng thái hoàn thành cột mốc</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Cột mốc đang hoạt động</span>
                <span className="font-medium">{metrics.active_milestones}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Cột mốc đã hoàn thành</span>
                <span className="font-medium">
                  {metrics.completed_milestones}
                </span>
              </div>
              {metrics.active_milestones + metrics.completed_milestones > 0 && (
                <div className="flex items-center justify-between text-sm mt-2">
                  <span>Tỷ lệ hoàn thành cột mốc</span>
                  <span className="font-medium">
                    {(
                      (metrics.completed_milestones /
                        (metrics.active_milestones +
                          metrics.completed_milestones)) *
                      100
                    ).toFixed(0)}
                    %
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
