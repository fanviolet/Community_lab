"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProjectTaskWithRelations } from "@/types/project-management";
import { updateTask } from "../../actions";

interface KanbanBoardProps {
  tasks: ProjectTaskWithRelations[];
  projectId: string;
}

const COLUMNS = [
  { id: "todo", title: "Cần làm", color: "bg-gray-100" },
  { id: "in_progress", title: "Đang thực hiện", color: "bg-blue-100" },
  { id: "review", title: "Đang xem xét", color: "bg-yellow-100" },
  { id: "done", title: "Hoàn thành", color: "bg-green-100" },
];

const PRIORITY_LABELS: Record<string, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
  urgent: "Khẩn cấp",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "secondary",
  medium: "default",
  high: "outline",
  urgent: "destructive",
};

export function KanbanBoard({ tasks, projectId }: KanbanBoardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      await updateTask(taskId, { status: newStatus as any });
      window.location.reload();
    } catch (error) {
      console.error("Failed to update task status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-4">
      {COLUMNS.map((column) => (
        <div key={column.id} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">{column.title}</h3>
            <Badge variant="outline" className="text-xs">
              {tasks.filter((t) => t.status === column.id).length}
            </Badge>
          </div>
          <div className="space-y-3">
            {tasks
              .filter((task) => task.status === column.id)
              .map((task) => (
                <Card
                  key={task.id}
                  className="border-0 bg-white shadow-sm ring-1 ring-black/5"
                >
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h4 className="text-sm font-medium">{task.title}</h4>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      {task.assignee && (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={task.assignee.avatar_url ?? undefined}
                            />
                            <AvatarFallback className="text-xs">
                              {task.assignee.display_name?.charAt(0) ||
                                task.assignee.email.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {task.assignee.display_name || task.assignee.email}
                          </span>
                        </div>
                      )}

                      <Select
                        defaultValue={task.status}
                        onValueChange={(value) =>
                          handleStatusChange(task.id, value)
                        }
                        disabled={isUpdating}
                      >
                        <SelectTrigger className="w-[120px] h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COLUMNS.map((col) => (
                            <SelectItem key={col.id} value={col.id}>
                              {col.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={PRIORITY_COLORS[task.priority] as any}
                        className="text-xs capitalize"
                      >
                        {PRIORITY_LABELS[task.priority] || task.priority}
                      </Badge>
                      {task.due_date && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
