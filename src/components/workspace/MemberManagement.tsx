"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  addMember,
  removeMember,
  updateMemberRole,
} from "@/app/dashboard/workspace/actions";

interface Member {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  avatar_url: string | null;
  created_at: string | null;
}

interface MemberManagementProps {
  projectId: string;
  members: Member[];
  currentUserId: string;
  isLeader: boolean;
}

function getInitials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function formatDate(value: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

export default function MemberManagement({
  projectId,
  members,
  currentUserId,
  isLeader,
}: MemberManagementProps) {
  const [isPending, startTransition] = useTransition();
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<{ memberId: string; role: string } | null>(null);

  const handleAddMember = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    const form = event.currentTarget; // ← lưu lại trước
    startTransition(async () => {
      const result = await addMember(formData);
      if (!result.success) {
        setError(result.error ?? "Failed to add member");
        return;
      }
      setShowAddForm(false);
      form?.reset(); // ← dùng biến đã lưu
    });
  };

  const handleRemoveMember = (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    setError(null);
    const formData = new FormData();
    formData.append("projectId", projectId);
    formData.append("memberId", memberId);
    startTransition(async () => {
      const result = await removeMember(formData);
      if (!result.success) {
        setError(result.error ?? "Failed to remove member");
      }
    });
  };

  const handleUpdateRole = (memberId: string, newRole: string) => {
    setError(null);
    const formData = new FormData();
    formData.append("projectId", projectId);
    formData.append("memberId", memberId);
    formData.append("role", newRole);
    startTransition(async () => {
      const result = await updateMemberRole(formData);
      if (!result.success) {
        setError(result.error ?? "Failed to update role");
        return;
      }
      setEditingRole(null);
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {isLeader && (
        <div className="flex justify-end">
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? "Cancel" : "Add Member"}
          </Button>
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleAddMember} className="space-y-4 rounded-lg border border-border/60 bg-muted p-4">
          <input type="hidden" name="projectId" value={projectId} />
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input name="email" type="email" placeholder="Enter user email..." required />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding..." : "Add Member"}
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {members.length > 0 ? (
          members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-lg border border-border/60 bg-muted p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.name || "User"}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    getInitials(member.name)
                  )}
                </div>
                <div>
                  <p className="font-medium">{member.name || member.email || "Unknown"}</p>
                  <p className="text-sm text-muted-foreground">{member.email || "No email"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {editingRole?.memberId === member.id ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={editingRole.role === "leader" ? "default" : "outline"}
                      onClick={() => handleUpdateRole(member.id, "leader")}
                      disabled={isPending}
                    >
                      Leader
                    </Button>
                    <Button
                      size="sm"
                      variant={editingRole.role === "member" ? "default" : "outline"}
                      onClick={() => handleUpdateRole(member.id, "member")}
                      disabled={isPending}
                    >
                      Member
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingRole(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <Badge variant={member.role === "leader" ? "approved" : "outline"}>
                      {member.role || "member"}
                    </Badge>
                    {isLeader && member.user_id !== currentUserId && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingRole({ memberId: member.id, role: member.role || "member" })}
                        >
                          Change Role
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={isPending}
                          className="text-destructive hover:text-destructive"
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-border/60 bg-muted p-8 text-center">
            <p className="text-sm text-muted-foreground">No members yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
