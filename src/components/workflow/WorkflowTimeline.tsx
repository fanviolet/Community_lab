"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Phase {
  name: string;
  objective: string;
  deliverables: string[];
  suggestedTasks: string[];
  estimatedDuration: string;
  responsibleRoles: string[];
  order: number;
}

interface WorkflowTimelineProps {
  phases: Phase[];
}

export default function WorkflowTimeline({ phases }: WorkflowTimelineProps) {
  const sortedPhases = [...phases].sort((a, b) => a.order - b.order);

  return (
    <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
      <CardHeader>
        <CardTitle>Các giai đoạn dự án</CardTitle>
        <CardDescription>
          Lộ trình có cấu trúc cho việc triển khai dự án
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedPhases.map((phase, index) => (
            <div key={phase.name} className="relative pl-8 pb-8 last:pb-0">
              {index < sortedPhases.length - 1 && (
                <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
              )}
              <div className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-semibold">
                {phase.order}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">{phase.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {phase.estimatedDuration}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {phase.objective}
                </p>
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Kết quả đầu ra:
                  </p>
                  <ul className="text-xs text-muted-foreground list-disc list-inside">
                    {phase.deliverables.map((deliverable, idx) => (
                      <li key={idx}>{deliverable}</li>
                    ))}
                  </ul>
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Vai trò chịu trách nhiệm:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {phase.responsibleRoles.map((role, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
