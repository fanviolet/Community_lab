import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BarChart3,
  Brain,
  Sparkles,
  Workflow,
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

export default async function InsightsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Supabase chưa được cấu hình. Thêm biến môi trường vào{" "}
        <code className="font-mono">.env.local</code>
      </div>
    );
  }

  const { user } = await getAuthSession();

  if (!user) {
    redirect("/login");
  }

  const rbacCtx = await buildRBACContext();
  if (!hasPermission(rbacCtx, "insight.view")) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  const { data: problems } = await supabase
    .from("problems")
    .select("id,title,ai_summary,ai_generated_at,category,priority")
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
      <div className="rounded-2xl border border-border/50 bg-gradient-to-r from-primary/10 to-primary/5 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/20">
              <Brain className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Hỗ trợ ra quyết định bằng AI
              </h1>
              <p className="text-sm text-muted-foreground">
                Thông tin chuyên sâu do AI hỗ trợ để định hướng quyết định của
                cộng đồng
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-white">
              {insightCards.length} phân tích
            </Badge>
            <Badge variant="outline" className="bg-white">
              {highPriorityInsights.length} ưu tiên cao
            </Badge>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <Link href="/dashboard/insights/report-generator">
          <Button variant="outline" size="sm">
            <BarChart3 className="mr-2 size-4" />
            Tạo báo cáo
          </Button>
        </Link>
        <Link href="/dashboard/insights/workflow-generator">
          <Button variant="outline" size="sm">
            <Workflow className="mr-2 size-4" />
            Tạo quy trình
          </Button>
        </Link>
      </div>

      {/* Decision Support Summary */}
      {insightCards.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tổng số phân tích
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {insightCards.length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ưu tiên cao
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

          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Có thể hành động
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

          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tuần này
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
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <AlertCircle className="size-5 text-rose-500" />
              Khuyến nghị ưu tiên
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
                        "Xem lại phân tích AI"}
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
            Chưa có phân tích AI nào
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Mở một vấn đề cộng đồng để tạo phân tích, hoặc dùng các công cụ trên
            để tạo báo cáo và quy trình.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/dashboard/problems">
              <Button variant="outline" size="sm">
                Xem vấn đề
              </Button>
            </Link>
            <Link href="/dashboard/insights/report-generator">
              <Button size="sm">
                <BarChart3 className="mr-2 size-4" />
                Tạo báo cáo
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
