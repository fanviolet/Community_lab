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
import { ArrowLeft, Award, Users, TrendingUp, Clock, Target } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
} from "@/lib/rbac";
import { getTeamAnalytics } from "../actions";

export default async function TeamAnalyticsPage() {
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

  if (!hasPermission(ctx, "team.analytics.view")) {
    redirect("/dashboard/team");
  }

  const analytics = await getTeamAnalytics();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/team">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Phân tích nhóm</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Hiệu suất nhóm và số liệu tham gia.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Tổng thành viên
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_members}</div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Thành viên hoạt động
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.active_members}</div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4" />
              Tổng kỹ năng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_skills}</div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Đóng góp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total_contributions}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Phân bố vai trò</CardTitle>
            <CardDescription>
              Cơ cấu nhóm theo vai trò
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(analytics.role_distribution).map(([role, count]) => (
              <div key={role} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize">{role}</span>
                  <span className="font-medium">{count}</span>
                </div>
                <Progress
                  value={analytics.total_members > 0 ? (count / analytics.total_members) * 100 : 0}
                  className="h-2"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Số liệu tham gia</CardTitle>
            <CardDescription>
              Mức độ tương tác và hoạt động của nhóm
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Tỷ lệ tham gia</span>
                <span className="font-medium">{analytics.participation_rate.toFixed(1)}%</span>
              </div>
              <Progress value={analytics.participation_rate} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Điểm ảnh hưởng trung bình</span>
                <span className="font-medium">{analytics.average_impact_score.toFixed(2)}/10</span>
              </div>
              <Progress value={analytics.average_impact_score * 10} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Lời mời chờ</span>
                <span className="font-medium">{analytics.pending_invitations}</span>
              </div>
              <Progress
                value={analytics.total_members > 0 ? (analytics.pending_invitations / (analytics.total_members + analytics.pending_invitations)) * 100 : 0}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
