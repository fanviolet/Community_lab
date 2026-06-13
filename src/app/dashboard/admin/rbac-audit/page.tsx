import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
        <h1 className="text-2xl font-semibold tracking-tight">RBAC Audit</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View current role, permissions, and access levels.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Current Role</CardTitle>
            <CardDescription>Your system role and authentication status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">User ID</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">{user.id}</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Email</span>
              <span className="text-sm text-muted-foreground">{user.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Role</span>
              <Badge variant={role === Role.Admin ? "default" : "secondary"} className="capitalize">
                {role}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Authenticated</span>
              <Badge variant={ctx.isAuthenticated ? "default" : "outline"}>
                {ctx.isAuthenticated ? "Yes" : "No"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Project Memberships</CardTitle>
            <CardDescription>Projects you belong to and your role in each</CardDescription>
          </CardHeader>
          <CardContent>
            {projectMemberships.length === 0 ? (
              <p className="text-sm text-muted-foreground">No project memberships</p>
            ) : (
              <div className="space-y-2">
                {projectMemberships.map((membership: any) => (
                  <div
                    key={membership.project_id}
                    className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{membership.projects?.title || "Unknown Project"}</p>
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
          <CardTitle>Permission Matrix</CardTitle>
          <CardDescription>
            All permissions and your current access level for each
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
                  {granted ? "Granted" : "Denied"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Visible Modules</CardTitle>
          <CardDescription>Navigation items visible to your role</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { label: "Dashboard", permission: "community.view" },
              { label: "Problem Board", permission: "problem.view" },
              { label: "Discussion", permission: "comment.view" },
              { label: "AI Insights", permission: "insight.view" },
              { label: "Pitch", permission: "pitch.view" },
              { label: "My Projects", permission: "workspace.view" },
              { label: "Expert Analysis", permission: "insight.expert_mode" },
              { label: "Mentoring", permission: "task.assign" },
              { label: "Project Management", permission: "project.create" },
              { label: "Team Management", permission: "member.manage" },
              { label: "Pitch Review", permission: "pitch.approve" },
              { label: "Admin Panel", permission: "admin.panel.view" },
              { label: "User Management", permission: "user.role.change" },
              { label: "System Settings", permission: "admin.panel.view" },
              { label: "Archive", permission: "workspace.progress.view" },
            ].map((module) => (
              <div
                key={module.label}
                className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-4 py-3"
              >
                <span className="text-sm font-medium">{module.label}</span>
                <Badge variant={hasPermission(ctx, module.permission as Permission) ? "default" : "outline"}>
                  {hasPermission(ctx, module.permission as Permission) ? "Visible" : "Hidden"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
