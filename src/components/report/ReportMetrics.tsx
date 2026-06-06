import { Activity, CheckCircle2, Clock, Users } from "lucide-react";

import type { ReportMetricsData } from "@/app/dashboard/insights/report-generator/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ReportMetricsProps {
  metrics: ReportMetricsData;
}

const chartRows = [
  { key: "completedTasks", label: "Completed" },
  { key: "delayedTasks", label: "Delayed" },
] as const;

export default function ReportMetrics({ metrics }: ReportMetricsProps) {
  const cards = [
    {
      label: "Total Tasks",
      value: metrics.totalTasks,
      icon: Activity,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Completed",
      value: metrics.completedTasks,
      icon: CheckCircle2,
      color: "bg-emerald-100 text-emerald-600",
    },
    {
      label: "Active Members",
      value: metrics.activeMembers,
      icon: Users,
      color: "bg-violet-100 text-violet-600",
    },
    {
      label: "Delayed Tasks",
      value: metrics.delayedTasks,
      icon: Clock,
      color: "bg-amber-100 text-amber-600",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((item) => (
          <Card key={item.label} className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex size-11 items-center justify-center rounded-lg ${item.color}`}>
                <item.icon className="size-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="text-2xl font-semibold">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Progress Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Completion Rate</span>
              <span className="font-medium">{metrics.completionRate}%</span>
            </div>
            <Progress value={metrics.completionRate} className="h-3" />
          </div>

          <div className="space-y-3">
            {chartRows.map((row) => {
              const value = metrics[row.key];
              const percentage =
                metrics.totalTasks > 0 ? Math.round((value / metrics.totalTasks) * 100) : 0;

              return (
                <div key={row.key} className="grid grid-cols-[110px_1fr_42px] items-center gap-3">
                  <span className="text-sm text-muted-foreground">{row.label}</span>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="text-right text-sm font-medium">{value}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
