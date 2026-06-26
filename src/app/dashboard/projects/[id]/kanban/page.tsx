import { redirect } from "next/navigation";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
} from "@/lib/rbac";
import { getTasks, getProjectMetrics } from "../../actions";
import { KanbanBoard } from "./kanban-board";

export default async function KanbanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = parseRole(profile?.role);
  const ctx = createAuthenticatedContext(role, user.id);

  if (!hasPermission(ctx, "task.view")) {
    redirect("/dashboard/projects");
  }

  const canCreateTask = hasPermission(ctx, "task.create");

  const { id: projectId } = await params;

  const [tasks, metrics] = await Promise.all([
    getTasks(projectId),
    getProjectMetrics(projectId),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Kanban Board</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {metrics.total_tasks} tasks · {metrics.completion_percentage.toFixed(0)}% complete
            </p>
          </div>
        </div>
        {canCreateTask && (
          <Button asChild>
            <Link href={`/dashboard/projects/${projectId}/new-task`}>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Todo</CardTitle>
            <CardDescription>{tasks.filter((t) => t.status === "todo").length} tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasks.filter((t) => t.status === "todo").map((task) => (
              <KanbanCard key={task.id} task={task} projectId={projectId} />
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <CardDescription>{tasks.filter((t) => t.status === "in_progress").length} tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasks.filter((t) => t.status === "in_progress").map((task) => (
              <KanbanCard key={task.id} task={task} projectId={projectId} />
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Review</CardTitle>
            <CardDescription>{tasks.filter((t) => t.status === "review").length} tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasks.filter((t) => t.status === "review").map((task) => (
              <KanbanCard key={task.id} task={task} projectId={projectId} />
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Done</CardTitle>
            <CardDescription>{tasks.filter((t) => t.status === "done").length} tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasks.filter((t) => t.status === "done").map((task) => (
              <KanbanCard key={task.id} task={task} projectId={projectId} />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KanbanCard({ task, projectId }: { task: any; projectId: string }) {
  return (
    <Card className="border-0 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
      <CardContent className="p-4">
        <h3 className="text-sm font-medium mb-2">{task.title}</h3>
        {task.assignee && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{task.assignee.display_name || task.assignee.email}</span>
          </div>
        )}
        {task.priority && (
          <Badge variant="outline" className="text-xs mt-2 capitalize">
            {task.priority}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
