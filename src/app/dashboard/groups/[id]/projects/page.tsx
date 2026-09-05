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
import { KanbanSquare, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
} from "@/lib/rbac";
import { getProjects } from "@/app/dashboard/projects/actions";
import { getGroupById, getGroupMembershipState } from "@/lib/groups/server";
import { notFound } from "next/navigation";

export default async function GroupProjectsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: groupId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const group = await getGroupById(groupId);
  if (!group) {
    notFound();
  }

  const membershipState = await getGroupMembershipState(groupId, user.id);
  const isMember = membershipState === "member";

  // Non-members should be redirected to the public group page
  if (!isMember) {
    redirect(`/dashboard/groups/${groupId}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = parseRole(profile?.role);
  const ctx = createAuthenticatedContext(role, user.id);
  const canCreateTask = hasPermission(ctx, "task.create");

  const projects = await getProjects(groupId);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Dự án - {group.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Quản lý các dự án trong nhóm
          </p>
        </div>
        {canCreateTask && (
          <Link href={`/dashboard/groups/${groupId}/projects/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Dự án mới
            </Button>
          </Link>
        )}
      </div>

      {projects.length === 0 ? (
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <KanbanSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Không tìm thấy dự án nào
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              {canCreateTask
                ? "Tạo dự án để bắt đầu quản lý nhiệm vụ và cột mốc."
                : "Chờ dự án được tạo."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="border-0 bg-white shadow-sm ring-1 ring-black/5">
              <CardHeader>
                <CardTitle className="text-lg">{project.title}</CardTitle>
                <CardDescription>{project.status}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/dashboard/workspace/${project.id}`}>
                      <KanbanSquare className="mr-2 h-4 w-4" />
                      Kanban
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/dashboard/projects/${project.id}/tasks`}>
                      Tasks
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}