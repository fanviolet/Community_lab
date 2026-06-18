import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RoleBadge } from "@/components/common/role-badge";
import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
  Role,
  getPermissionsForRole,
  type Permission,
} from "@/lib/rbac";
import { getUserProjectMemberships } from "../actions";

const ALL_PERMISSIONS: Permission[] = [
  "problem.view",
  "problem.create",
  "problem.edit.own",
  "problem.edit.any",
  "problem.delete.own",
  "problem.delete.any",
  "problem.categories.manage",
  "problem.search",
  "comment.view",
  "comment.create",
  "vote.create",
  "comment.delete.others",
  "discussion.ai_summary",
  "insight.view",
  "insight.generate",
  "insight.regenerate",
  "insight.expert_mode",
  "pitch.view",
  "pitch.create",
  "pitch.edit.own",
  "pitch.approve",
  "pitch.reject",
  "pitch.feedback",
  "workspace.view",
  "task.create",
  "task.assign",
  "task.update.own",
  "workspace.progress.view",
  "project.create",
  "project.delete",
  "project.edit",
  "project.archive",
  "member.manage",
  "workflow.generate",
  "report.generate",
  "community.view",
  "profile.edit.own",
  "notifications.view",
  "user.role.change",
  "admin.panel.view",
  "user.delete",
];

export default async function RBACAuditPage() {
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

  if (!hasPermission(ctx, "admin.panel.view")) {
    redirect("/dashboard");
  }

  const userPermissions = getPermissionsForRole(role);
  const projectMemberships = await getUserProjectMemberships(user.id);

  const permissionChecks = ALL_PERMISSIONS.map((permission) => ({
    permission,
    granted: hasPermission(ctx, permission),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Kiểm tra RBAC</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Xem vai trò hiện tại, quyền hạn và mức độ truy cập.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Vai trò hiện tại</CardTitle>
            <CardDescription>Vai trò hệ thống và trạng thái xác thực của bạn</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">ID người dùng</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">{user.id}</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Email</span>
              <span className="text-sm text-muted-foreground">{user.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Vai trò</span>
              <RoleBadge role={role} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Đã xác thực</span>
              <Badge variant={ctx.isAuthenticated ? "default" : "outline"}>
                {ctx.isAuthenticated ? "Có" : "Không"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Thành viên dự án</CardTitle>
            <CardDescription>Các dự án bạn tham gia và vai trò của bạn trong từng dự án</CardDescription>
          </CardHeader>
          <CardContent>
            {projectMemberships.length === 0 ? (
              <p className="text-sm text-muted-foreground">Không có thành viên dự án</p>
            ) : (
              <div className="space-y-2">
                {projectMemberships.map((membership: any) => (
                  <div
                    key={membership.project_id}
                    className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{membership.projects?.title || "Dự án không xác định"}</p>
                      <p className="text-xs text-muted-foreground capitalize">{membership.projects?.status}</p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {membership.role}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Ma trận quyền hạn</CardTitle>
          <CardDescription>
            Tất cả quyền hạn và mức độ truy cập hiện tại của bạn cho từng quyền
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {permissionChecks.map(({ permission, granted }) => (
              <div
                key={permission}
                className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-4 py-3"
              >
                <code className="text-sm font-mono">{permission}</code>
                <Badge variant={granted ? "default" : "outline"}>
                  {granted ? "Được cấp" : "Từ chối"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Mô-đun hiển thị</CardTitle>
          <CardDescription>Các mục điều hướng hiển thị cho vai trò của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { label: "Bảng điều khiển", permission: "community.view" },
              { label: "Bảng vấn đề", permission: "problem.view" },
              { label: "Thảo luận", permission: "comment.view" },
              { label: "Thông tin AI", permission: "insight.view" },
              { label: "Đề xuất", permission: "pitch.view" },
              { label: "Dự án của tôi", permission: "workspace.view" },
              { label: "Phân tích chuyên gia", permission: "insight.expert_mode" },
              { label: "Hướng dẫn", permission: "task.assign" },
              { label: "Quản lý dự án", permission: "project.create" },
              { label: "Quản lý đội nhóm", permission: "member.manage" },
              { label: "Xem xét đề xuất", permission: "pitch.approve" },
              { label: "Bảng điều khiển Quản trị viên", permission: "admin.panel.view" },
              { label: "Quản lý người dùng", permission: "user.role.change" },
              { label: "Cài đặt Hệ thống", permission: "admin.panel.view" },
              { label: "Lưu trữ", permission: "workspace.progress.view" },
            ].map((module) => (
              <div
                key={module.label}
                className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-4 py-3"
              >
                <span className="text-sm font-medium">{module.label}</span>
                <Badge variant={hasPermission(ctx, module.permission as Permission) ? "default" : "outline"}>
                  {hasPermission(ctx, module.permission as Permission) ? "Hiển thị" : "Ẩn"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
