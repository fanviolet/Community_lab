import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, Workflow } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InsightSummaryCard } from "@/components/insights/InsightSummaryCard";
import { parseAiSummary } from "@/lib/ai-insight-utils";
import { createClient } from "@/lib/supabase/server";
import { buildRBACContext } from "@/lib/rbac-server";
import { hasPermission } from "@/lib/rbac";

export default async function InsightsPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Supabase is not configured. Add environment variables to{" "}
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

  const rbacCtx = await buildRBACContext();
  if (!hasPermission(rbacCtx, "insight.view")) {
    redirect("/dashboard");
  }

  const { data: problems } = await supabase
    .from("problems")
    .select("id,title,ai_summary,ai_generated_at")
    .not("ai_summary", "is", null)
    .order("ai_generated_at", { ascending: false, nullsFirst: false });

  const insightCards =
    problems
      ?.map((problem) => {
        const insight = parseAiSummary(problem.ai_summary);
        if (!insight) {
          return null;
        }

        return {
          problemId: problem.id,
          title: problem.title,
          generatedAt: problem.ai_generated_at,
          insight,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null) ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Insights</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            AI-generated analysis of community problems
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/insights/report-generator">
            <Button variant="outline" size="sm">
              <BarChart3 className="mr-2 size-4" />
              Report Generator
            </Button>
          </Link>
          <Link href="/dashboard/insights/workflow-generator">
            <Button variant="outline" size="sm">
              <Workflow className="mr-2 size-4" />
              Workflow Generator
            </Button>
          </Link>
        </div>
      </div>

      {insightCards.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {insightCards.map((card) => (
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
        <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            No AI insights have been generated yet. Open a community problem and
            generate an insight, or use the tools above to create reports and workflows.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link href="/dashboard/problems">
              <Button variant="outline" size="sm">
                Browse Problems
              </Button>
            </Link>
            <Link href="/dashboard/insights/report-generator">
              <Button size="sm">
                <BarChart3 className="mr-2 size-4" />
                Generate Report
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
