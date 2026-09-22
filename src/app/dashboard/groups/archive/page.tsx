import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getAuthSession } from "@/lib/auth/server";
import { Building2, Users } from "lucide-react";

interface GroupRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_public: boolean;
  status: string | null;
  created_at: string | null;
}

export default async function GroupsArchivePage() {
  const { user } = await getAuthSession();
  if (!user) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Bạn cần đăng nhập để xem kho lưu trữ.
      </div>
    );
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

  // Fetch archived groups that the user is a member of
  // Try with status column first, fallback if migration hasn't run
  let rows, error;
  try {
    const result = await supabase
      .from("groups")
      .select(`
        id,
        name,
        slug,
        description,
        is_public,
        status,
        created_at
      `)
      .eq("status", "archived")
      .order("created_at", { ascending: false });
    rows = result.data;
    error = result.error;
  } catch (e) {
    // If status column doesn't exist, return empty array
    console.log("[GroupsArchivePage] Status column not found, showing empty archive");
    rows = [];
    error = null;
  }

  // If error is about missing column, return empty array
  if (error && error.code === '42703') {
    console.log("[GroupsArchivePage] Status column not found, showing empty archive");
    rows = [];
    error = null;
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-destructive/20 bg-destructive/10 p-6">
        <h1 className="text-2xl font-semibold text-destructive">Không thể tải kho lưu trữ cộng đồng</h1>
        <p className="mt-2 text-sm text-destructive/80">{error.message}</p>
      </div>
    );
  }

  const groups = (rows ?? []) as GroupRow[];

  async function getGroupCounts(groupId: string) {
    const [{ count: memberCount }, { count: projectCount }] = await Promise.all([
      supabase
        .from("group_members")
        .select("id", { count: "exact", head: true })
        .eq("group_id", groupId),
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("group_id", groupId),
    ]);

    return {
      memberCount: memberCount ?? 0,
      projectCount: projectCount ?? 0,
    };
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Kho lưu trữ cộng đồng</h1>
          <p className="text-sm text-muted-foreground">Các cộng đồng đã lưu trữ và thông tin tóm tắt của chúng.</p>
        </div>
        <Link
          href="/dashboard/groups"
          className="inline-flex h-10 items-center rounded-lg bg-background px-4 text-sm font-medium text-foreground border border-border transition hover:bg-muted"
        >
          Quay lại danh sách cộng đồng
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {groups.length === 0 ? (
          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardContent>
              <p className="text-sm text-muted-foreground">Không tìm thấy cộng đồng đã lưu trữ.</p>
            </CardContent>
          </Card>
        ) : (
          await Promise.all(
            groups.map(async (group) => {
              const counts = await getGroupCounts(group.id);

              return (
                <Card
                  key={group.id}
                  className="border-0 bg-white shadow-sm ring-1 ring-black/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Building2 className="size-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {group.description ?? "Không có mô tả"}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-muted px-3 py-2 text-sm">
                        <p className="text-muted-foreground text-xs">Đã lưu trữ</p>
                        <p className="font-semibold text-foreground">
                          {group.created_at ? new Date(group.created_at).toLocaleDateString() : "—"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-muted px-3 py-2 text-sm">
                        <p className="text-muted-foreground text-xs">Thành viên</p>
                        <p className="font-semibold text-foreground">{counts.memberCount}</p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-muted px-3 py-2 text-sm">
                        <p className="text-muted-foreground text-xs">Dự án</p>
                        <p className="font-semibold text-foreground">{counts.projectCount}</p>
                      </div>
                      <div className="flex items-center justify-end">
                        <Link
                          href={`/dashboard/groups/${group.id}`}
                          className="inline-flex items-center rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
                        >
                          Xem cộng đồng
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
