"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, User } from "lucide-react";
import type { ProjectTaskWithRelations } from "@/types/project-management";

interface TaskListProps {
  tasks: ProjectTaskWithRelations[];
}

const STATUS_COLORS: Record<string, string> = {
  todo: "secondary",
  in_progress: "default",
  review: "outline",
  done: "approved",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "secondary",
  medium: "default",
  high: "outline",
  urgent: "destructive",
};

export function TaskList({ tasks }: TaskListProps) {
  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <Card key={task.id} className="border-0 bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-medium">{task.title}</h3>
                  <Badge variant={STATUS_COLORS[task.status] as any} className="text-xs capitalize">
                    {task.status.replace("_", " ")}
                  </Badge>
                  <Badge variant={PRIORITY_COLORS[task.priority] as any} className="text-xs capitalize">
                    {task.priority}
                  </Badge>
                </div>
                {task.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {task.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {task.assignee && (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={task.assignee.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs">
                          {task.assignee.display_name?.charAt(0) || task.assignee.email.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{task.assignee.display_name || task.assignee.email}</span>
                    </div>
                  )}
                  {task.due_date && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(task.due_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {task.estimated_hours && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{task.estimated_hours}h estimated</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
