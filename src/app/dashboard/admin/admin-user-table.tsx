"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
  full_name: string | null;
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
      alert("Failed to update role. You may not have permission.");
    }
  };

  const handleSuspend = async (userId: string) => {
    try {
      await suspendUser(userId);
      alert("User suspended successfully");
    } catch (error) {
      console.error("Failed to suspend user:", error);
      alert("Failed to suspend user.");
    }
  };

  const handleUnsuspend = async (userId: string) => {
    try {
      await unsuspendUser(userId);
      alert("User unsuspended successfully");
    } catch (error) {
      console.error("Failed to unsuspend user:", error);
      alert("Failed to unsuspend user.");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteUser(userId);
      setUsersState(usersState.filter((u) => u.id !== userId));
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert("Failed to delete user.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <div className="grid grid-cols-12 gap-4 border-b bg-muted/50 p-4 text-xs font-medium text-muted-foreground">
          <div className="col-span-4">User</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-3">Joined</div>
          <div className="col-span-3 text-right">Actions</div>
        </div>
        {usersState.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No users found
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
                    {user.full_name?.charAt(0).toUpperCase() ?? user.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{user.full_name ?? "No name"}</p>
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
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                      Change Role
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => handleRoleChange(user.id, Role.Member)}
                      disabled={user.id === currentUserId}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Member
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleRoleChange(user.id, Role.Expert)}
                      disabled={user.id === currentUserId}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Expert
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleRoleChange(user.id, Role.Mentor)}
                      disabled={user.id === currentUserId}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Mentor
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleRoleChange(user.id, Role.Leader)}
                      disabled={user.id === currentUserId}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Leader
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleRoleChange(user.id, Role.Admin)}
                      disabled={user.id === currentUserId}
                    >
                      <ShieldAlert className="mr-2 h-4 w-4" />
                      Admin
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleSuspend(user.id)}>
                      <UserX className="mr-2 h-4 w-4" />
                      Suspend User
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleUnsuspend(user.id)}>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Unsuspend User
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDelete(user.id)}
                      disabled={user.id === currentUserId}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete User
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
