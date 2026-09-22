import Link from "next/link";
import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getAuthSession } from "@/lib/auth/server";
import { getGroupById, getGroupMembershipState } from "@/lib/groups/server";
import { FolderKanban } from "lucide-react";
import { HelpButton } from "@/app/dashboard/groups/[id]/archive/help-button";

interface ProjectRow {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  created_at: string | null;
}

export default async function GroupProjectsArchivePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: groupId } = await params;
  const { user } = await getAuthSession();

  if (!user) {
    redirect("/login");
  }

  const group = await getGroupById(groupId);
  if (!group) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6">
        <h1 className="text-2xl font-semibold text-destructive">Không tìm thấy cộng đồng</h1>
      </div>
    );
  }

  const membershipState = await getGroupMembershipState(groupId, user.id);
  const isMember = membershipState === "member";

  if (!isMember) {
    redirect(`/dashboard/groups/${groupId}`);
  }

  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Supabase chưa được cấu hình. Thêm biến môi trường vào{' '}
        <code className="font-mono">.env.local</code>
      </div>
    );
  }

  const { data: rows, error } = await supabase
    .from("projects")
    .select("id,title,description,status,created_at")
    .eq("group_id", groupId)
    .eq("status", "archived")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-3xl border border-destructive/20 bg-destructive/10 p-6">
        <h1 className="text-2xl font-semibold text-destructive">Không thể tải kho lưu trữ dự án</h1>
        <p className="mt-2 text-sm text-destructive/80">{error.message}</p>
      </div>
    );
  }

  const projects = (rows ?? []) as ProjectRow[];

  async function getCounts(projectId: string) {
    const [{ count: taskCount }, { count: memberCount }] = await Promise.all([
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId),
      supabase
        .from("project_members")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId),
    ]);

    return {
      taskCount: taskCount ?? 0,
      memberCount: memberCount ?? 0,
    };
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Kho lưu trữ dự án</h1>
            <p className="text-sm text-muted-foreground">Các dự án đã lưu trữ trong {group.name}</p>
          </div>
          <HelpButton />
        </div>
        <Link
          href={`/dashboard/groups/${groupId}/projects`}
          className="inline-flex h-10 items-center rounded-lg bg-background px-4 text-sm font-medium text-foreground border border-border transition hover:bg-muted"
        >
          Quay lại danh sách dự án
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {projects.length === 0 ? (
          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderKanban className="size-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">Không tìm thấy dự án đã lưu trữ.</p>
            </CardContent>
          </Card>
        ) : (
          await Promise.all(
            projects.map(async (project) => {
              const counts = await getCounts(project.id);

              return (
                <Card
                  key={project.id}
                  className="border-0 bg-white shadow-sm ring-1 ring-black/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <CardDescription>{project.description ?? "Không có mô tả"}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-muted px-3 py-2 text-sm">
                        <p className="text-muted-foreground text-xs">Đã lưu trữ</p>
                        <p className="font-semibold text-foreground">
                          {project.created_at ? new Date(project.created_at).toLocaleDateString() : "—"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-muted px-3 py-2 text-sm">
                        <p className="text-muted-foreground text-xs">Thành viên</p>
                        <p className="font-semibold text-foreground">{counts.memberCount}</p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-muted px-3 py-2 text-sm">
                        <p className="text-muted-foreground text-xs">Nhiệm vụ</p>
                        <p className="font-semibold text-foreground">{counts.taskCount}</p>
                      </div>
                      <div className="flex items-center justify-end">
                        <Link
                          href={`/dashboard/workspace/${project.id}`}
                          className="inline-flex items-center rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
                        >
                          Xem dự án
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }),
          )
        )}
      </div>
    </div>
  );
}
