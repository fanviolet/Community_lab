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
      label: "Active Problems",
      value: problemCount ?? 0,
      change: `+${newProblemsThisWeek ?? 0} this week`,
      icon: Search,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "New Discussions",
      value: commentCount ?? 0,
      change: `+${commentsToday ?? 0} today`,
      icon: MessageSquare,
      color: "text-violet-600 bg-violet-50",
    },
    {
      label: "Total Votes",
      value: voteCount ?? 0,
      change: "across all problems",
      icon: Brain,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Active Projects",
      value: 0,
      change: "coming soon",
      icon: FolderKanban,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Total Proposals",
      value: totalProposals ?? 0,
      change: "across all users",
      icon: FolderKanban,
      color: "text-slate-600 bg-slate-50",
    },
    {
      label: "Draft Proposals",
      value: draftProposals ?? 0,
      change: "not yet submitted",
      icon: FolderKanban,
      color: "text-gray-600 bg-gray-50",
    },
    {
      label: "Pending Reviews",
      value: pendingProposals ?? 0,
      change: "awaiting review",
      icon: FolderKanban,
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Approved Proposals",
      value: approvedProposals ?? 0,
      change: "ready to implement",
      icon: FolderKanban,
      color: "text-emerald-600 bg-emerald-50",
    },
  ];

  const quickActions = [
    { label: "Submit a problem", href: "/dashboard/problems/new" },
    { label: "Browse problems", href: "/dashboard/problems" },
    { label: "Generate AI insight", href: "#" },
    { label: "Open workspace", href: "/dashboard/workspace" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome, {user.email}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening across your community lab.
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
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest problems from your community
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentProblems && recentProblems.length > 0 ? (
              recentProblems.map((problem) => (
                <div
                  key={problem.id}
                  className="rounded-lg border border-border/50 bg-muted/30 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted/50"
                >
                  <span className="font-medium">New problem: </span>
                  {problem.title}
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(problem.created_at).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No activity yet. Be the first to post a problem!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Jump into your next task</CardDescription>
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
