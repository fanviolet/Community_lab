import { Clock, FolderKanban, Lightbulb, Search, TrendingUp, AlertTriangle } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";

import { DashboardKPICard } from "@/components/dashboard/DashboardKPICard";
import { CommunityPipeline } from "@/components/dashboard/CommunityPipeline";
import { ProposalCard } from "@/components/dashboard/ProposalCard";
import { AlertCenter } from "@/components/dashboard/AlertCenter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  // Fetch all metrics in parallel
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
    { count: activeProjects },
    { count: overdueTasks },
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
    supabase.from("pitches").select("*", { count: "exact", head: true }),
    supabase
      .from("pitches")
      .select("*", { count: "exact", head: true })
      .eq("status", "draft"),
    supabase
      .from("pitches")
      .select("*", { count: "exact", head: true })
      .eq("status", "submitted"),
    supabase
      .from("pitches")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved"),
    supabase.from("projects").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("tasks").select("*", { count: "exact", head: true }).lt("end_date", todayStart.toISOString()).eq("status", "pending"),
  ]);

  // Fetch high priority proposals
  const { data: highPriorityProposals } = await supabase
    .from("pitches")
    .select("id, title, status, created_at, created_by, ai_score")
    .eq("status", "submitted")
    .order("ai_score", { ascending: false })
    .limit(4);

  // Fetch highest voted problems
  const { data: topProblems } = await supabase
    .from("problems")
    .select("id, title, category, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  // Fetch projects needing attention
  const { data: projectsNeedingAttention } = await supabase
    .from("projects")
    .select("id, title, status")
    .eq("status", "active")
    .limit(3);

  // Get greeting based on time
  const hour = new Date().getHours();
  const getGreeting = () => {
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  const kpiStats = [
    {
      label: "Active Problems",
      value: problemCount ?? 0,
      change: `+${newProblemsThisWeek ?? 0} this week`,
      icon: Search,
      color: "text-blue-600 bg-blue-50",
      trend: "up" as const,
    },
    {
      label: "Running Projects",
      value: activeProjects ?? 0,
      change: "currently active",
      icon: FolderKanban,
      color: "text-emerald-600 bg-emerald-50",
      trend: "neutral" as const,
    },
    {
      label: "Overdue Tasks",
      value: overdueTasks ?? 0,
      change: "needs attention",
      icon: Clock,
      color: "text-rose-600 bg-rose-50",
      trend: "down" as const,
    },
    {
      label: "Pending Proposals",
      value: pendingProposals ?? 0,
      change: "awaiting review",
      icon: Lightbulb,
      color: "text-amber-600 bg-amber-50",
      trend: "neutral" as const,
    },
  ];

  const pipelineStages = [
    { name: "Problem", count: problemCount ?? 0, color: "text-blue-600" },
    { name: "Discussion", count: commentCount ?? 0, color: "text-violet-600" },
    { name: "Proposal", count: pendingProposals ?? 0, color: "text-amber-600" },
    { name: "AI Analysis", count: 0, color: "text-emerald-600" },
    { name: "Voting", count: voteCount ?? 0, color: "text-rose-600" },
    { name: "Expert Review", count: 0, color: "text-indigo-600" },
    { name: "Approval", count: approvedProposals ?? 0, color: "text-teal-600" },
    { name: "Project", count: activeProjects ?? 0, color: "text-cyan-600" },
  ];

  const alerts = [
    ...(overdueTasks ? [{
      id: "overdue-1",
      type: "overdue_task" as const,
      message: `${overdueTasks} tasks are overdue`,
      severity: "high" as const,
    }] : []),
    ...(pendingProposals && pendingProposals > 5 ? [{
      id: "proposal-1",
      type: "deadline_near" as const,
      message: `${pendingProposals} proposals awaiting review`,
      severity: "medium" as const,
    }] : []),
  ];


  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="rounded-2xl border border-border/50 bg-gradient-to-r from-primary/10 to-primary/5 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {getGreeting()}, {user.email?.split("@")[0] || "User"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Here's what's happening in your community lab today.
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-white">
              {activeProjects ?? 0} Active Projects
            </Badge>
            <Badge variant="outline" className="bg-white">
              {pendingProposals ?? 0} Pending Proposals
            </Badge>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiStats.map((stat) => (
          <DashboardKPICard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Pipeline & Priority Items */}
        <div className="space-y-6 lg:col-span-2">
          <CommunityPipeline stages={pipelineStages} />

          {/* Priority Items */}
          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Priority Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Top Proposals */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Lightbulb className="size-4 text-amber-500" />
                  Top Proposals
                </h3>
                {highPriorityProposals && highPriorityProposals.length > 0 ? (
                  <div className="space-y-2">
                    {highPriorityProposals.slice(0, 3).map((proposal: any) => (
                      <Link
                        key={proposal.id}
                        href={`/dashboard/pitch/${proposal.id}`}
                        className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground line-clamp-1">
                            {proposal.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            AI Score: {proposal.ai_score || 0}%
                          </p>
                        </div>
                        <TrendingUp className="size-4 text-emerald-500" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No proposals yet</p>
                )}
              </div>

              {/* Highest Voted Problems */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Search className="size-4 text-blue-500" />
                  Highest Voted Problems
                </h3>
                {topProblems && topProblems.length > 0 ? (
                  <div className="space-y-2">
                    {topProblems.slice(0, 3).map((problem: any) => (
                      <Link
                        key={problem.id}
                        href={`/dashboard/problems/${problem.id}`}
                        className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground line-clamp-1">
                            {problem.title}
                          </p>
                          <p className="text-xs text-muted-foreground">{problem.category}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          New
                        </Badge>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No problems yet</p>
                )}
              </div>

              {/* Projects Needing Attention */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <AlertTriangle className="size-4 text-rose-500" />
                  Projects Needing Attention
                </h3>
                {projectsNeedingAttention && projectsNeedingAttention.length > 0 ? (
                  <div className="space-y-2">
                    {projectsNeedingAttention.map((project: any) => (
                      <Link
                        key={project.id}
                        href={`/dashboard/workspace/${project.id}`}
                        className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground line-clamp-1">
                            {project.title}
                          </p>
                          <p className="text-xs text-muted-foreground">{project.status}</p>
                        </div>
                        <Badge variant="outline" className="text-xs text-rose-600 border-rose-200">
                          Active
                        </Badge>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">All projects are on track</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Alert Center */}
        <div>
          <AlertCenter alerts={alerts} />
        </div>
      </div>
    </div>
  );
}
