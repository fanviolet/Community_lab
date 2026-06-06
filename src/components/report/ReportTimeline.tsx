import { CheckCircle2 } from "lucide-react";

import type { ReportAchievement } from "@/app/dashboard/insights/report-generator/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ReportTimelineProps {
  achievements: ReportAchievement[];
}

function formatDate(value: string | null) {
  if (!value) return "No date";
  return new Date(value).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ReportTimeline({ achievements }: ReportTimelineProps) {
  return (
    <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
      <CardHeader>
        <CardTitle>Key Achievements</CardTitle>
        <CardDescription>Completed work and milestone evidence</CardDescription>
      </CardHeader>
      <CardContent>
        {achievements.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No completed achievements were found for this reporting period.
          </p>
        ) : (
          <div className="space-y-4">
            {achievements.map((item, index) => (
              <div key={item.id} className="relative flex gap-3">
                {index < achievements.length - 1 ? (
                  <div className="absolute left-4 top-8 bottom-0 w-px bg-border" />
                ) : null}
                <div className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="size-4" />
                </div>
                <div className="pb-4">
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(item.date)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
