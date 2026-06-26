"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Task {
  title: string;
  description: string;
  phase: string;
  duration: string;
  priority: string;
}

interface WorkflowKanbanProps {
  tasks: Task[];
  phases: string[];
}

function priorityBadgeVariant(priority: string) {
  switch (priority.toLowerCase()) {
    case "high":
      return "revise";
    case "medium":
      return "pending";
    case "low":
      return "secondary";
    default:
      return "outline";
  }
}

export default function WorkflowKanban({ tasks, phases }: WorkflowKanbanProps) {
  const groupedTasks = phases.reduce(
    (acc, phase) => {
      acc[phase] = tasks.filter((task) => task.phase === phase);
      return acc;
    },
    {} as Record<string, Task[]>,
  );

  return (
    <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
      <CardHeader>
        <CardTitle>Nhiệm vụ đề xuất</CardTitle>
        <CardDescription>
          Được sắp xếp theo giai đoạn dự án và mức độ ưu tiên
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {phases.map((phase) => (
            <div key={phase} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">{phase}</h3>
                <Badge variant="outline" className="text-xs">
                  {groupedTasks[phase]?.length || 0}
                </Badge>
              </div>
              <div className="space-y-2">
                {(groupedTasks[phase] || []).map((task, index) => (
                  <div
                    key={`${phase}-${index}`}
                    className="rounded-lg border border-border/60 bg-muted p-3"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm font-medium line-clamp-2">
                        {task.title}
                      </h4>
                      <Badge
                        variant={priorityBadgeVariant(task.priority)}
                        className="text-xs shrink-0"
                      >
                        {task.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {task.description}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      Thời lượng: {task.duration}
                    </div>
                  </div>
                ))}
                {(!groupedTasks[phase] || groupedTasks[phase].length === 0) && (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No tasks for this phase
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
