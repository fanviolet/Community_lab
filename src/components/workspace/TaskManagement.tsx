"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  due_date: string | null;
  created_at: string | null;
}

interface TaskManagementProps {
  projectId: string;
  tasks: Task[];
  currentUserId: string;
  isLeader: boolean;
}

function statusLabel(status: string | null) {
  if (!status) return "To do";
  switch (status.toLowerCase()) {
    case "completed":
    case "done":
    case "complete":
      return "Completed";
    case "in_progress":
    case "in progress":
      return "In Progress";
    case "todo":
      return "To do";
    default:
      return status;
  }
}

function isCompleteStatus(status: string | null) {
  return ["completed", "done", "complete"].includes(status?.toLowerCase() ?? "");
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
  if (!priority) return "Medium";
  return priority.charAt(0).toUpperCase() + priority.slice(1);
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
        setError(result.error ?? "Failed to create task");
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
        setError(result.error ?? "Failed to update task");
        return;
      }
      setEditingTask(null);
    });
  };

  const handleDeleteTask = (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    setError(null);
    const formData = new FormData();
    formData.append("taskId", taskId);
    formData.append("projectId", projectId);
    startTransition(async () => {
      const result = await deleteTask(formData);
      if (!result.success) {
        setError(result.error ?? "Failed to delete task");
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
        setError(result.error ?? "Failed to update task");
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
          {showCreateForm ? "Cancel" : "Create Task"}
        </Button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateTask} className="space-y-4 rounded-lg border border-border/60 bg-muted p-4">
          <input type="hidden" name="projectId" value={projectId} />
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input name="title" placeholder="Enter task title..." required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea name="description" placeholder="Task description..." rows={3} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Assigned to</label>
              <Input name="assignedUser" placeholder="Team member name" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Due date</label>
              <Input name="dueDate" type="date" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <select
                name="priority"
                defaultValue="medium"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Task"}
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
                  <Input name="assignedUser" defaultValue={task.assigned_user ?? ""} placeholder="Assigned user" />
                  <Input name="dueDate" type="date" defaultValue={task.due_date ? task.due_date.slice(0, 10) : ""} />
                  <select
                    name="status"
                    defaultValue={task.status ?? "todo"}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <option value="todo">To do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <select
                    name="priority"
                    defaultValue={task.priority ?? "medium"}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={isPending}>
                      {isPending ? "Saving..." : "Save"}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditingTask(null)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-semibold ${isCompleteStatus(task.status) ? "line-through text-muted-foreground" : ""}`}>
                        {task.title}
                      </h3>
                      <Badge variant={statusBadgeVariant(task.status)} className="text-xs">
                        {statusLabel(task.status)}
                      </Badge>
                      <Badge variant={priorityBadgeVariant(task.priority)} className="text-xs">
                        {priorityLabel(task.priority)}
                      </Badge>
                    </div>
                    {task.description && (
                      <p className="mt-2 text-sm text-muted-foreground">{task.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span>Assigned: {task.assigned_user || "Unassigned"}</span>
                      <span>Due: {formatDate(task.due_date)}</span>
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
                        Edit
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
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-border/60 bg-muted p-8 text-center">
            <p className="text-sm text-muted-foreground">No tasks yet. Create your first task to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
