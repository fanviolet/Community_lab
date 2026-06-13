import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
  Role,
} from "@/lib/rbac";
import { getUsers } from "./actions";
import { AdminUserTable } from "./admin-user-table";

export default async function AdminPage() {
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

  const users = await getUsers();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin Panel</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage users, roles, and platform settings.
        </p>
      </div>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            View, manage, and modify user roles and permissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminUserTable users={users} currentUserId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
