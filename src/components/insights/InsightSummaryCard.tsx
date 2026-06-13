import Link from "next/link";
import { Calendar, Lightbulb, Sparkles, Tag, Target } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AIInsight } from "@/types/ai-insight";

const urgencyClasses: Record<AIInsight["urgency"], string> = {
  low: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-rose-100 text-rose-800",
};

interface InsightSummaryCardProps {
  problemId: string;
  title: string;
  generatedAt: string | null;
  insight: AIInsight;
}

export function InsightSummaryCard({
  problemId,
  title,
  generatedAt,
  insight,
}: InsightSummaryCardProps) {
  const topSuggestion = insight.suggestions[0] ?? "No suggestions available.";
  const formattedDate = generatedAt
    ? new Date(generatedAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "Unknown";

  return (
    <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-lg leading-snug">{title}</CardTitle>
            <CardDescription className="flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              Generated {formattedDate}
            </CardDescription>
          </div>
          <Badge className={urgencyClasses[insight.urgency]}>
            {insight.urgency.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Target className="size-3.5" />
            Root Cause
          </div>
          <p className="text-sm leading-6 text-foreground">{insight.rootCause}</p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Lightbulb className="size-3.5" />
            Top Suggestion
          </div>
          <p className="text-sm leading-6 text-foreground">{topSuggestion}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Tag className="size-3.5" />
            Tags
          </div>
          <div className="flex flex-wrap gap-2">
            {insight.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="rounded-full">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <Link
          href={`/dashboard/problems/${problemId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:text-primary/80"
        >
          <Sparkles className="size-4" />
          View full insight
        </Link>
      </CardContent>
    </Card>
  );
}
