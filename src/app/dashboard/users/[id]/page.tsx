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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, Activity, Shield, BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
} from "@/lib/rbac";
import { getUserById, getUserActivity } from "../actions";
import { UserDetailProfile } from "./user-detail-profile";
import { UserStatistics } from "./user-statistics";
import { UserActivity } from "./user-activity";
import { RoleManagement } from "./role-management";
import { AccountActions } from "./account-actions";

export default async function UserDetailPage({
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

  if (!hasPermission(ctx, "users.view")) {
    redirect("/dashboard/users");
  }

  const { id: userId } = await params;
  const userData = await getUserById(userId);
  const activity = await getUserActivity(userId);

  const canEdit = hasPermission(ctx, "users.edit");
  const canChangeRole = hasPermission(ctx, "users.role.change");
  const canChangeStatus = hasPermission(ctx, "users.status.change");
  const canDelete = hasPermission(ctx, "users.delete");

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {userData.display_name || userData.email}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            User profile and activity
          </p>
        </div>
      </div>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20 flex-shrink-0">
              <AvatarImage src={userData.avatar_url ?? undefined} />
              <AvatarFallback className="text-2xl">
                {userData.display_name?.charAt(0) || userData.email.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-semibold">
                  {userData.display_name || "No name set"}
                </h2>
                <Badge variant="outline" className="capitalize">
                  {userData.role}
                </Badge>
                <Badge
                  variant={
                    userData.status === "active"
                      ? "default"
                      : userData.status === "suspended"
                        ? "outline"
                        : "secondary"
                  }
                  className="capitalize"
                >
                  {userData.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {userData.email}
              </p>
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Tham gia: </span>
                  {new Date(userData.created_at).toLocaleDateString()}
                </div>
                {userData.user_statistics?.last_activity_at && (
                  <div>
                    <span className="text-muted-foreground">
                      Hoạt động gần đây:{" "}
                    </span>
                    {new Date(
                      userData.user_statistics.last_activity_at,
                    ).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="statistics">
            <BarChart3 className="mr-2 h-4 w-4" />
            Statistics
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="mr-2 h-4 w-4" />
            Activity
          </TabsTrigger>
          {canChangeRole && (
            <TabsTrigger value="role">
              <Shield className="mr-2 h-4 w-4" />
              Role
            </TabsTrigger>
          )}
          {canChangeStatus && (
            <TabsTrigger value="actions">
              <Shield className="mr-2 h-4 w-4" />
              Actions
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <UserDetailProfile user={userData} canEdit={canEdit} />
        </TabsContent>

        <TabsContent value="statistics" className="space-y-6">
          <UserStatistics statistics={userData.user_statistics} />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <UserActivity activity={activity} />
        </TabsContent>

        {canChangeRole && (
          <TabsContent value="role" className="space-y-6">
            <RoleManagement userId={userId} currentRole={userData.role} />
          </TabsContent>
        )}

        {canChangeStatus && (
          <TabsContent value="actions" className="space-y-6">
            <AccountActions
              userId={userId}
              currentStatus={userData.status}
              canDelete={canDelete}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
