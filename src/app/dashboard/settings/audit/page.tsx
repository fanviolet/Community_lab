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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Search, Filter, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
} from "@/lib/rbac";
import { getAuditLogs } from "../actions";
import type { AuditLogWithUser } from "@/types/system-settings";

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; entity_type?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
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

  if (!hasPermission(ctx, "audit.logs.view")) {
    redirect("/dashboard/settings");
  }

  const logs = await getAuditLogs({
    action: resolvedSearchParams.action as any,
    entity_type: resolvedSearchParams.entity_type,
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/settings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track system actions and changes.
          </p>
        </div>
      </div>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Filter Logs</CardTitle>
          <CardDescription>
            Search and filter audit logs by action or entity type.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  className="pl-10"
                  name="search"
                />
              </div>
            </div>
            <Select name="action" defaultValue={resolvedSearchParams.action}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="permission_change">Permission Change</SelectItem>
                <SelectItem value="role_change">Role Change</SelectItem>
                <SelectItem value="system_update">System Update</SelectItem>
              </SelectContent>
            </Select>
            <Select name="entity_type" defaultValue={resolvedSearchParams.entity_type}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system_setting">System Setting</SelectItem>
                <SelectItem value="ai_setting">AI Setting</SelectItem>
                <SelectItem value="workflow_setting">Workflow Setting</SelectItem>
                <SelectItem value="notification_setting">Notification Setting</SelectItem>
                <SelectItem value="security_setting">Security Setting</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="role">Role</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">Apply</Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {logs.length === 0 ? (
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Filter className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No audit logs found</h3>
            <p className="text-sm text-muted-foreground text-center">
              Adjust your filters to see more results.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardContent className="p-0">
            <div className="divide-y">
              {logs.map((log: AuditLogWithUser) => (
                <div key={log.id} className="flex items-center gap-4 p-4">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={log.user?.avatar_url ?? undefined} />
                    <AvatarFallback>
                      {log.user?.full_name?.charAt(0) || log.user?.email.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {log.user?.full_name || log.user?.email}
                      </span>
                      <Badge variant="outline" className="capitalize text-xs">
                        {log.action.replace("_", " ")}
                      </Badge>
                      {log.entity_type && (
                        <Badge variant="secondary" className="text-xs">
                          {log.entity_type}
                        </Badge>
                      )}
                    </div>
                    {log.entity_id && (
                      <p className="text-xs text-muted-foreground">
                        Entity: {log.entity_id}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
