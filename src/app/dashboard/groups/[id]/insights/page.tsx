import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  Brain,
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { InsightSummaryCard } from "@/components/insights/InsightSummaryCard";
import { parseAiSummary } from "@/lib/ai-insight-utils";
import { isSupabaseConfigured } from "@/lib/supabase-env";
import { createClient } from "@/lib/supabase/server";
import { getAuthSession } from "@/lib/auth/server";
import { buildRBACContext } from "@/lib/rbac-server";
import { hasPermission } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getGroupById, getGroupMembershipState } from "@/lib/groups/server";

export default async function GroupInsightsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Supabase chưa được cấu hình. Thêm biến môi trường vào{" "}
        <code className="font-mono">.env.local</code>
      </div>
    );
  }

  const { id: groupId } = await params;
  const { user } = await getAuthSession();

  if (!user) {
    redirect("/login");
  }

  const group = await getGroupById(groupId);
  if (!group) {
    notFound();
  }

  const membershipState = await getGroupMembershipState(groupId, user.id);
  const isMember = membershipState === "member";

  // Non-members should be redirected to the public group page
  if (!isMember) {
    redirect(`/dashboard/groups/${groupId}`);
  }

  const rbacCtx = await buildRBACContext();
  if (!hasPermission(rbacCtx, "insight.view")) {
    redirect(`/dashboard/groups/${groupId}`);
  }

  const supabase = await createClient();

  const { data: problems } = await supabase
    .from("problems")
    .select("id,title,ai_summary,ai_generated_at,category,priority")
    .eq("group_id", groupId)
    .not("ai_summary", "is", null)
    .order("ai_generated_at", { ascending: false, nullsFirst: false })
    .limit(100);

  const insightCards =
    problems
      ?.map((problem: any) => {
        const insight = parseAiSummary(problem.ai_summary);
        if (!insight) {
          return null;
        }

        return {
          problemId: problem.id,
          title: problem.title,
          generatedAt: problem.ai_generated_at,
          category: problem.category,
          priority: problem.priority,
          insight,
        };
      })
      .filter((item: any): item is NonNullable<typeof item> => item !== null) ??
    [];

  // Calculate decision support metrics
  const highPriorityInsights = insightCards.filter(
    (card: any) => card.priority === "high" || card.priority === "urgent",
  );
  const recentInsights = insightCards.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            AI Insights - {group.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered decision support for this community
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">
            {insightCards.length} analyses
          </Badge>
          <Badge variant="outline">
            {highPriorityInsights.length} high priority
          </Badge>
        </div>
      </div>

      {/* Decision Support Summary */}
      {insightCards.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Analyses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {insightCards.length}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                High Priority
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-foreground">
                  {highPriorityInsights.length}
                </div>
                <AlertCircle className="size-5 text-rose-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Actionable
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-foreground">
                  {
                    insightCards.filter(
                      (c: any) => c.insight.recommendations?.length > 0,
                    ).length
                  }
                </div>
                <CheckCircle className="size-5 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-foreground">
                  {
                    insightCards.filter(
                      (c: any) =>
                        new Date(c.generatedAt) >
                        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    ).length
                  }
                </div>
                <TrendingUp className="size-5 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* High Priority Recommendations */}
      {highPriorityInsights.length > 0 && (
        <Card className="border border-border/60">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <AlertCircle className="size-5 text-rose-500" />
              Priority Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {highPriorityInsights.slice(0, 3).map((card: any) => (
                <Link
                  key={card.problemId}
                  href={`/dashboard/problems/${card.problemId}`}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground line-clamp-1">
                      {card.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {card.insight.recommendations?.[0] ||
                        "View AI analysis"}
                    </p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights Grid */}
      {insightCards.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {insightCards.map((card: any) => (
            <InsightSummaryCard
              key={card.problemId}
              problemId={card.problemId}
              title={card.title}
              generatedAt={card.generatedAt}
              insight={card.insight}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 mx-auto">
            <Sparkles className="size-8 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            No AI analyses yet
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Open a community problem to generate AI analysis, or use the tools to create reports and workflows.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href={`/dashboard/groups/${groupId}/problems`}>
              <Button variant="outline" size="sm">
                View Problems
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}