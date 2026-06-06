"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface Metric {
  kpi: string;
  measurementMethod: string;
  targetValue: string;
}

interface WorkflowMetricsProps {
  metrics: Metric[];
}

export default function WorkflowMetrics({ metrics }: WorkflowMetricsProps) {
  return (
    <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
      <CardHeader>
        <CardTitle>Success Metrics</CardTitle>
        <CardDescription>Key performance indicators to track project success</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="rounded-lg border border-border/60 bg-muted p-4 space-y-3"
            >
              <div className="space-y-1">
                <h3 className="font-semibold text-sm">{metric.kpi}</h3>
                <p className="text-xs text-muted-foreground">{metric.measurementMethod}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Target</span>
                  <span className="font-medium">{metric.targetValue}</span>
                </div>
                <Progress value={0} className="h-2" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
