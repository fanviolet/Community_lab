"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import WorkspaceMemberPicker from "@/components/WorkspaceMemberPicker";
import MemberDisplay from "@/components/MemberDisplay";
import {
  createTask,
  updateTask,
  deleteTask,
  toggleTaskComplete,
} from "@/app/dashboard/workspace/actions";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  assigned_to: string | null;
  assigned_user: string | null;
  assignee?: {
    id: string;
    display_name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
  } | null;
  due_date: string | null;
  created_at: string | null;
}

interface TaskManagementProps {
  projectId: string;
  tasks: Task[];
  currentUserId: string;
  isLeader: boolean;
}

const statusLabels: Record<string, string> = {
  todo: "Cần làm",
  in_progress: "Đang thực hiện",
  completed: "Hoàn thành",
  done: "Hoàn thành",
  complete: "Hoàn thành",
};

const priorityLabels: Record<string, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
};

function statusLabel(status: string | null) {
  if (!status) return "Cần làm";
  const key = status.toLowerCase();
  return statusLabels[key] || status;
}

function isCompleteStatus(status: string | null) {
  return ["completed", "done", "complete"].includes(
    status?.toLowerCase() ?? "",
  );
}

function statusBadgeVariant(status: string | null) {
  if (isCompleteStatus(status)) return "approved";
  if (status?.toLowerCase().includes("progress")) return "pending";
  return "outline";
}

function priorityBadgeVariant(priority: string | null) {
  switch (priority?.toLowerCase()) {
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

function priorityLabel(priority: string | null) {
  if (!priority) return "Trung bình";
  const key = priority.toLowerCase();
  return (
    priorityLabels[key] || priority.charAt(0).toUpperCase() + priority.slice(1)
  );
}

function formatDate(value: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

export default function TaskManagement({
  projectId,
  tasks,
  currentUserId,
  isLeader,
}: TaskManagementProps) {
  const [isPending, startTransition] = useTransition();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateTask = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    const form = event.currentTarget;
    startTransition(async () => {
      const result = await createTask(formData);
      if (!result.success) {
        setError(result.error ?? "Không thể tạo công việc");
        return;
      }
      setShowCreateForm(false);
      form?.reset();
    });
  };

  const handleUpdateTask = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await updateTask(formData);
      if (!result.success) {
        setError(result.error ?? "Không thể cập nhật công việc");
        return;
      }
      setEditingTask(null);
    });
  };

  const handleDeleteTask = (taskId: string) => {
    if (!confirm("Bạn có chắc muốn xóa công việc này?")) return;
    setError(null);
    const formData = new FormData();
    formData.append("taskId", taskId);
    formData.append("projectId", projectId);
    startTransition(async () => {
      const result = await deleteTask(formData);
      if (!result.success) {
        setError(result.error ?? "Không thể xóa công việc");
      }
    });
  };

  const handleToggleComplete = (task: Task) => {
    setError(null);
    const formData = new FormData();
    formData.append("taskId", task.id);
    formData.append("projectId", projectId);
    formData.append("currentStatus", task.status ?? "todo");
    startTransition(async () => {
      const result = await toggleTaskComplete(formData);
      if (!result.success) {
        setError(result.error ?? "Không thể cập nhật công việc");
      }
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? "Hủy" : "Tạo công việc"}
        </Button>
      </div>

      {showCreateForm && (
        <form
          onSubmit={handleCreateTask}
          className="space-y-4 rounded-lg border border-border/60 bg-muted p-4"
        >
          <input type="hidden" name="projectId" value={projectId} />
          <div className="space-y-2">
            <label className="text-sm font-medium">Tiêu đề</label>
            <Input
              name="title"
              placeholder="Nhập tiêu đề công việc..."
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Mô tả</label>
            <Textarea
              name="description"
              placeholder="Mô tả công việc..."
              rows={3}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Giao cho</label>
              {/* WorkspaceMemberPicker sets hidden input 'assigned_to' (email) */}
              <WorkspaceMemberPicker workspaceId={projectId} value={""} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Hạn chót</label>
              <Input name="dueDate" type="date" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ưu tiên</label>
              <select
                name="priority"
                defaultValue="medium"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateForm(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Đang tạo..." : "Tạo công việc"}
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div
              key={task.id}
              className="rounded-lg border border-border/60 bg-muted p-4"
            >
              {editingTask?.id === task.id ? (
                <form onSubmit={handleUpdateTask} className="space-y-3">
                  <input type="hidden" name="taskId" value={task.id} />
                  <input type="hidden" name="projectId" value={projectId} />
                  <Input name="title" defaultValue={task.title} required />
                  <Textarea
                    name="description"
                    defaultValue={task.description ?? ""}
                    rows={2}
                  />
                  <WorkspaceMemberPicker
                    workspaceId={projectId}
                    value={
                      task.assignee?.email ||
                      (task.assigned_user && task.assigned_user.includes("@")
                        ? task.assigned_user
                        : "")
                    }
                  />
                  <Input
                    name="dueDate"
                    type="date"
                    defaultValue={
                      task.due_date ? task.due_date.slice(0, 10) : ""
                    }
                  />
                  <select
                    name="status"
                    defaultValue={task.status ?? "todo"}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <option value="todo">Cần làm</option>
                    <option value="in_progress">Đang thực hiện</option>
                    <option value="completed">Hoàn thành</option>
                  </select>
                  <select
                    name="priority"
                    defaultValue={task.priority ?? "medium"}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <option value="low">Thấp</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                  </select>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={isPending}>
                      {isPending ? "Đang lưu..." : "Lưu"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingTask(null)}
                    >
                      Hủy
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className={`font-semibold ${isCompleteStatus(task.status) ? "line-through text-muted-foreground" : ""}`}
                      >
                        {task.title}
                      </h3>
                      <Badge
                        variant={statusBadgeVariant(task.status)}
                        className="text-xs"
                      >
                        {statusLabel(task.status)}
                      </Badge>
                      <Badge
                        variant={priorityBadgeVariant(task.priority)}
                        className="text-xs"
                      >
                        {priorityLabel(task.priority)}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {task.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="mr-2">Giao cho:</span>
                        <MemberDisplay
                          workspaceId={projectId}
                          userId={task.assigned_to}
                          fallback={task.assigned_user || "Chưa giao"}
                        />
                      </div>
                      <span>Hạn chót: {formatDate(task.due_date)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(isLeader || task.assigned_to === currentUserId) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleComplete(task)}
                        disabled={isPending}
                      >
                        {isCompleteStatus(task.status) ? "↩" : "✓"}
                      </Button>
                    )}
                    {(isLeader || task.assigned_to === currentUserId) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingTask(task)}
                        disabled={isPending}
                      >
                        Sửa
                      </Button>
                    )}
                    {isLeader && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTask(task.id)}
                        disabled={isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        Xóa
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-border/60 bg-muted p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Chưa có công việc. Tạo công việc đầu tiên để bắt đầu.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
