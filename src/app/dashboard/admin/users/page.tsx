import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
} from "@/lib/rbac";

export default async function AdminUsersPage() {
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

  if (!hasPermission(ctx, "user.role.change")) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Quản lý người dùng</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quản lý vai trò và quyền hạn của người dùng.
        </p>
      </div>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Đang chuyển hướng đến Bảng điều khiển Quản trị viên</CardTitle>
          <CardDescription>
            Quản lý người dùng có sẵn trong Bảng điều khiển Quản trị viên chính.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Vui lòng sử dụng Bảng điều khiển Quản trị viên chính tại <a href="/dashboard/admin" className="text-blue-600 hover:underline">/dashboard/admin</a> để quản lý người dùng.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
