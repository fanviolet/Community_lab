import { Lightbulb } from "lucide-react";

import type { ReportRecommendation } from "@/app/dashboard/insights/report-generator/actions";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ReportRecommendationsProps {
  communityImpact: string;
  recommendations: ReportRecommendation[];
}

function priorityVariant(priority: ReportRecommendation["priority"]) {
  if (priority === "high") return "rejected";
  if (priority === "medium") return "pending";
  return "secondary";
}

export default function ReportRecommendations({
  communityImpact,
  recommendations,
}: ReportRecommendationsProps) {
  return (
    <div className="space-y-5">
      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Community Impact</CardTitle>
          <CardDescription>Impact narrative for school and competition review</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">{communityImpact}</p>
        </CardContent>
      </Card>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
          <CardDescription>Concise next actions and priority focus</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {recommendations.map((recommendation) => (
            <div key={recommendation.id} className="rounded-lg border border-border/60 bg-muted p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium">{recommendation.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{recommendation.description}</p>
                  </div>
                </div>
                <Badge variant={priorityVariant(recommendation.priority)}>
                  {recommendation.priority}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
