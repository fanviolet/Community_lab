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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Plus, Search, Mail, Calendar, Award } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
} from "@/lib/rbac";
import { getTeamMembers, getTeamAnalytics } from "./actions";
import { TeamMemberCard } from "./team-member-card";

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; search?: string }>;
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

  if (!hasPermission(ctx, "team.view")) {
    redirect("/dashboard");
  }

  const canInvite = hasPermission(ctx, "team.invite");
  const canChangeRole = hasPermission(ctx, "team.role.change");
  const canRemove = hasPermission(ctx, "team.remove");
  const canViewAnalytics = hasPermission(ctx, "team.analytics.view");

  const [members, analytics] = await Promise.all([
    getTeamMembers(),
    canViewAnalytics ? getTeamAnalytics() : null,
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Danh bạ nhóm
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Xem và quản lý thành viên nhóm.
          </p>
        </div>
        <div className="flex gap-2">
          {canInvite && (
            <Button asChild>
              <Link href="/dashboard/team/invite">
                <Plus className="mr-2 h-4 w-4" />
                Mời thành viên
              </Link>
            </Button>
          )}
          {canViewAnalytics && (
            <Button variant="outline" asChild>
              <Link href="/dashboard/team/analytics">
                <Award className="mr-2 h-4 w-4" />
                Phân tích
              </Link>
            </Button>
          )}
        </div>
      </div>

      {canViewAnalytics && analytics && (
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Tổng thành viên
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.total_members}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Thành viên hoạt động
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.active_members}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Tổng kỹ năng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total_skills}</div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Đóng góp</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.total_contributions}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Lọc thành viên</CardTitle>
          <CardDescription>
            Tìm kiếm và lọc theo vai trò hoặc từ khóa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm thành viên..."
                  className="pl-10"
                  name="search"
                  defaultValue={resolvedSearchParams.search}
                />
              </div>
            </div>
            <Select name="role" defaultValue={resolvedSearchParams.role}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Quản trị viên</SelectItem>
                <SelectItem value="leader">Trưởng nhóm</SelectItem>
                <SelectItem value="builder">Người xây dựng</SelectItem>
                <SelectItem value="expert">Chuyên gia</SelectItem>
                <SelectItem value="mentor">Người cố vấn</SelectItem>
                <SelectItem value="member">Thành viên</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">Áp dụng</Button>
          </div>
        </CardContent>
      </Card>

      {members.length === 0 ? (
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Không tìm thấy thành viên nhóm nào
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              {canInvite
                ? "Mời thành viên nhóm để bắt đầu."
                : "Chờ thành viên nhóm được thêm vào."}
            </p>
            {canInvite && (
              <Button asChild>
                <Link href="/dashboard/team/invite">
                  <Plus className="mr-2 h-4 w-4" />
                  Mời thành viên
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <TeamMemberCard
              key={member.id}
              member={member}
              canChangeRole={canChangeRole}
              canRemove={canRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
