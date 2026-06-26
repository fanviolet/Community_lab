"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { t } from "@/hooks/useTranslation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Shield, ShieldAlert, Trash2, UserCheck, UserX } from "lucide-react";
import { Role } from "@/lib/rbac";
import { RoleBadge } from "@/components/common/role-badge";
import {
  updateUserRole,
  suspendUser,
  unsuspendUser,
  deleteUser,
} from "./actions";

interface User {
  id: string;
  email: string;
  display_name: string | null;
  role: string;
  created_at: string;
  avatar_url: string | null;
}

interface AdminUserTableProps {
  users: User[];
  currentUserId: string;
}

function formatDate(date: string): string {
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

export function AdminUserTable({ users, currentUserId }: AdminUserTableProps) {
  const [usersState, setUsersState] = useState(users);

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      await updateUserRole(userId, newRole);
      setUsersState(
        usersState.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (error) {
      console.error("Failed to update role:", error);
      alert(t("admin.roleUpdateFailed"));
    }
  };

  const handleSuspend = async (userId: string) => {
    try {
      await suspendUser(userId);
      alert("Đã tạm ngưng người dùng thành công");
    } catch (error) {
      console.error("Failed to suspend user:", error);
      alert(t("admin.suspendFailed"));
    }
  };

  const handleUnsuspend = async (userId: string) => {
    try {
      await unsuspendUser(userId);
      alert("Đã kích hoạt lại người dùng thành công");
    } catch (error) {
      console.error("Failed to unsuspend user:", error);
      alert(t("admin.unsuspendFailed"));
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác.")) {
      return;
    }

    try {
      await deleteUser(userId);
      setUsersState(usersState.filter((u) => u.id !== userId));
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert(t("admin.deleteFailed"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <div className="grid grid-cols-12 gap-4 border-b bg-muted/50 p-4 text-xs font-medium text-muted-foreground">
          <div className="col-span-4">{t("common.name")}</div>
          <div className="col-span-2">{t("common.role")}</div>
          <div className="col-span-3">{t("common.date")}</div>
          <div className="col-span-3 text-right">{t("common.actions")}</div>
        </div>
        {usersState.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            {t("empty.noData")}
          </div>
        ) : (
          usersState.map((user) => (
            <div
              key={user.id}
              className="grid grid-cols-12 gap-4 border-b p-4 items-center hover:bg-muted/30 transition-colors"
            >
              <div className="col-span-4 flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar_url ?? undefined} />
                  <AvatarFallback>
                    {user.display_name?.charAt(0).toUpperCase() ?? user.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{user.display_name ?? t("admin.noName")}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="col-span-2">
                <RoleBadge role={user.role} />
              </div>
              <div className="col-span-3 text-xs text-muted-foreground">
                {formatDate(user.created_at)}
              </div>
              <div className="col-span-3 flex justify-end gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{t("common.actions")}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                      {t("common.role")}
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => handleRoleChange(user.id, Role.Member)}
                      disabled={user.id === currentUserId}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      {t("roles.member")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleRoleChange(user.id, Role.Expert)}
                      disabled={user.id === currentUserId}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      {t("roles.expert")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleRoleChange(user.id, Role.Mentor)}
                      disabled={user.id === currentUserId}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      {t("roles.mentor")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleRoleChange(user.id, Role.Leader)}
                      disabled={user.id === currentUserId}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      {t("roles.leader")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleRoleChange(user.id, Role.Admin)}
                      disabled={user.id === currentUserId}
                    >
                      <ShieldAlert className="mr-2 h-4 w-4" />
                      {t("roles.admin")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleSuspend(user.id)}>
                      <UserX className="mr-2 h-4 w-4" />
                      {t("admin.suspendFailed").replace("Không thể ", "Tạm ngưng ")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleUnsuspend(user.id)}>
                      <UserCheck className="mr-2 h-4 w-4" />
                      {t("admin.unsuspendFailed").replace("Không thể ", "Kích hoạt ")}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDelete(user.id)}
                      disabled={user.id === currentUserId}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t("common.delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
