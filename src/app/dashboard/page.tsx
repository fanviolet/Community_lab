import { Brain, FolderKanban, MessageSquare, Search } from "lucide-react";
import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/supabase-env";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Supabase chưa được cấu hình. Thêm biến môi trường vào{" "}
        <code className="font-mono">.env.local</code>
      </div>
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Tính mốc thời gian
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Fetch tất cả số liệu song song
  const [
    { count: problemCount },
    { count: commentCount },
    { count: voteCount },
    { count: newProblemsThisWeek },
    { count: commentsToday },
    { count: totalProposals },
    { count: draftProposals },
    { count: pendingProposals },
    { count: approvedProposals },
  ] = await Promise.all([
    supabase.from("problems").select("*", { count: "exact", head: true }),
    supabase
      .from("problem_comments")
      .select("*", { count: "exact", head: true }),
    supabase.from("problem_votes").select("*", { count: "exact", head: true }),
    supabase
      .from("problems")
      .select("*", { count: "exact", head: true })
      .gte("created_at", oneWeekAgo.toISOString()),
    supabase
      .from("problem_comments")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString()),
    supabase.from("proposals").select("*", { count: "exact", head: true }),
    supabase
      .from("proposals")
      .select("*", { count: "exact", head: true })
      .eq("status", "draft"),
    supabase
      .from("proposals")
      .select("*", { count: "exact", head: true })
      .eq("status", "submitted"),
    supabase
      .from("proposals")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved"),
  ]);

  // Fetch 3 problems mới nhất
  const { data: recentProblems } = await supabase
    .from("problems")
    .select("id, title, created_at")
    .order("created_at", { ascending: false })
    .limit(3);

  const stats = [
    {
      label: "Vấn đề hoạt động",
      value: problemCount ?? 0,
      change: `+${newProblemsThisWeek ?? 0} tuần này`,
      icon: Search,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Thảo luận mới",
      value: commentCount ?? 0,
      change: `+${commentsToday ?? 0} hôm nay`,
      icon: MessageSquare,
      color: "text-violet-600 bg-violet-50",
    },
    {
      label: "Tổng số bình chọn",
      value: voteCount ?? 0,
      change: "trên tất cả vấn đề",
      icon: Brain,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Dự án hoạt động",
      value: 0,
      change: "sắp ra mắt",
      icon: FolderKanban,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Tổng số đề xuất",
      value: totalProposals ?? 0,
      change: "trên tất cả người dùng",
      icon: FolderKanban,
      color: "text-slate-600 bg-slate-50",
    },
    {
      label: "Đề xuất nháp",
      value: draftProposals ?? 0,
      change: "chưa gửi",
      icon: FolderKanban,
      color: "text-gray-600 bg-gray-50",
    },
    {
      label: "Đang chờ xem xét",
      value: pendingProposals ?? 0,
      change: "đang chờ xem xét",
      icon: FolderKanban,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Đề xuất đã duyệt",
      value: approvedProposals ?? 0,
      change: "sẵn sàng thực hiện",
      icon: FolderKanban,
      color: "text-emerald-600 bg-emerald-50",
    },
  ];

  const quickActions = [
    { label: "Gửi vấn đề", href: "/dashboard/problems/new" },
    { label: "Xem vấn đề", href: "/dashboard/problems" },
    { label: "Tạo thông tin AI", href: "#" },
    { label: "Mở không gian làm việc", href: "/dashboard/workspace" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Xin chào, {user.email}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Đây là những gì đang diễn ra trong phòng thí nghiệm cộng đồng của bạn.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className="border-0 bg-white shadow-sm ring-1 ring-black/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <div>
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className="mt-1 text-3xl font-bold tabular-nums">
                  {stat.value}
                </CardTitle>
              </div>
              <div
                className={`flex size-10 items-center justify-center rounded-xl ${stat.color}`}
              >
                <stat.icon className="size-5" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom row */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
            <CardDescription>
              Vấn đề mới nhất từ cộng đồng của bạn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentProblems && recentProblems.length > 0 ? (
              recentProblems.map((problem) => (
                <div
                  key={problem.id}
                  className="rounded-lg border border-border/50 bg-muted/30 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted/50"
                >
                  <span className="font-medium">Vấn đề mới: </span>
                  {problem.title}
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(problem.created_at).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Chưa có hoạt động nào. Hãy là người đầu tiên đăng vấn đề!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Hành động nhanh</CardTitle>
            <CardDescription>Bắt đầu nhiệm vụ tiếp theo của bạn</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {quickActions.map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="rounded-xl border border-border/60 bg-white px-4 py-3 text-left text-sm font-medium text-foreground transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
              >
                {action.label}
              </a>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
