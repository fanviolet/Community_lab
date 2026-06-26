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
import { Search, Filter, Users, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
} from "@/lib/rbac";
import { getUsers, getUserCount } from "./actions";
import type { UserWithStatistics } from "@/types/user-management";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; role?: string; status?: string }>;
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

  if (!hasPermission(ctx, "users.view")) {
    redirect("/dashboard");
  }

  const users = await getUsers({
    search: resolvedSearchParams.search,
    role: resolvedSearchParams.role as any,
    status: resolvedSearchParams.status as any,
    limit: 50,
  });

  const totalCount = await getUserCount({
    search: resolvedSearchParams.search,
    role: resolvedSearchParams.role as any,
    status: resolvedSearchParams.status as any,
  });

  const canEdit = hasPermission(ctx, "users.edit");
  const canChangeRole = hasPermission(ctx, "users.role.change");
  const canChangeStatus = hasPermission(ctx, "users.status.change");
  const canDelete = hasPermission(ctx, "users.delete");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Quản lý người dùng
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý người dùng, vai trò và quyền hạn.
          </p>
        </div>
        {canEdit && (
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Mời người dùng
          </Button>
        )}
      </div>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Lọc người dùng</CardTitle>
          <CardDescription>
            Tìm kiếm và lọc người dùng theo tên, vai trò hoặc trạng thái.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên hoặc email..."
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
                <SelectItem value="guest">Khách</SelectItem>
                <SelectItem value="member">Thành viên</SelectItem>
                <SelectItem value="builder">Người xây dựng</SelectItem>
                <SelectItem value="expert">Chuyên gia</SelectItem>
                <SelectItem value="mentor">Người cố vấn</SelectItem>
                <SelectItem value="leader">Trưởng nhóm</SelectItem>
                <SelectItem value="admin">Quản trị viên</SelectItem>
              </SelectContent>
            </Select>
            <Select name="status" defaultValue={resolvedSearchParams.status}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="suspended">Tạm khóa</SelectItem>
                <SelectItem value="deactivated">Vô hiệu hóa</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">
              <Filter className="mr-2 h-4 w-4" />
              Áp dụng
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{totalCount} người dùng</p>
      </div>

      {users.length === 0 ? (
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Không tìm thấy người dùng nào
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              Điều chỉnh bộ lọc hoặc mời người dùng mới để bắt đầu.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardContent className="p-0">
            <div className="divide-y">
              {users.map((user) => (
                <div key={user.id} className="flex items-center gap-4 p-4">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={user.avatar_url ?? undefined} />
                    <AvatarFallback>
                      {user.display_name?.charAt(0) || user.email.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">
                        {user.display_name || user.email}
                      </span>
                      <Badge variant="outline" className="capitalize text-xs">
                        {{
                          guest: "Khách",
                          member: "Thành viên",
                          builder: "Người xây dựng",
                          expert: "Chuyên gia",
                          mentor: "Người cố vấn",
                          leader: "Trưởng nhóm",
                          admin: "Quản trị viên",
                        }[user.role] || user.role}
                      </Badge>
                      <Badge
                        variant={
                          user.status === "active"
                            ? "default"
                            : user.status === "suspended"
                              ? "outline"
                              : "secondary"
                        }
                        className="capitalize text-xs"
                      >
                        {{
                          active: "Hoạt động",
                          suspended: "Tạm khóa",
                          deactivated: "Vô hiệu hóa",
                        }[user.status] || user.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {user.statistics?.projects_joined || 0} dự án
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.statistics?.tasks_completed || 0} nhiệm vụ
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/users/${user.id}`}>Xem</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
