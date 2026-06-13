import { AlertTriangle } from "lucide-react";

import type { ReportChallenge } from "@/app/dashboard/insights/report-generator/report-types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ReportChallengesProps {
  challenges: ReportChallenge[];
}

function severityVariant(severity: ReportChallenge["severity"]) {
  if (severity === "high") return "rejected";
  if (severity === "medium") return "pending";
  return "secondary";
}

export default function ReportChallenges({ challenges }: ReportChallengesProps) {
  return (
    <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
      <CardHeader>
        <CardTitle>Challenges</CardTitle>
        <CardDescription>Risks, delays, and participation bottlenecks</CardDescription>
      </CardHeader>
      <CardContent>
        {challenges.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No major challenges were detected for this reporting period.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {challenges.map((challenge) => (
              <div key={challenge.id} className="rounded-lg border border-border/60 bg-muted p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                    <div>
                      <p className="font-medium">{challenge.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{challenge.description}</p>
                    </div>
                  </div>
                  <Badge variant={severityVariant(challenge.severity)}>{challenge.severity}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
