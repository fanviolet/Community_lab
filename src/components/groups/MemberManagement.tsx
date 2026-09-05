"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, UserMinus, Shield, Crown, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { searchUsers, addGroupMember, removeGroupMember } from "@/app/dashboard/groups/actions";

interface Member {
  id: string;
  group_id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile: {
    id: string;
    display_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

interface MemberManagementProps {
  groupId: string;
  members: Member[];
  currentUserId: string;
}

export function MemberManagement({ groupId, members, currentUserId }: MemberManagementProps) {
  const [pending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const router = useRouter();

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      const results = await searchUsers(query);
      // Filter out existing members
      const existingMemberIds = new Set(members.map((m) => m.user_id));
      setSearchResults(results.filter((r) => !existingMemberIds.has(r.id)));
    } else {
      setSearchResults([]);
    }
  };

  const handleAddMember = (userId: string, userName: string) => {
    startTransition(async () => {
      const result = await addGroupMember(groupId, userId);
      if (result.success) {
        toast.success(`${userName} has been added to the group`);
        setIsAddDialogOpen(false);
        setSearchQuery("");
        setSearchResults([]);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to add member. Please try again.");
      }
    });
  };

  const handleRemoveMember = (userId: string, userName: string) => {
    startTransition(async () => {
      const result = await removeGroupMember(groupId, userId);
      if (result.success) {
        toast.success(`${userName} has been removed from the group`);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to remove member. Please try again.");
      }
    });
  };

  const leaders = members.filter((m) => m.role === "leader");
  const regularMembers = members.filter((m) => m.role === "member");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Members</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Member</DialogTitle>
              <DialogDescription>
                Search for users to add to this group
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchResults.length > 0 && (
                <div className="max-h-60 space-y-2 overflow-y-auto">
                  {searchResults.map((user) => {
                    const userName = user.display_name || user.email || "Unknown";
                    return (
                      <div
                        key={user.id}
                        className="flex items-center justify-between rounded-lg border border-border/60 p-3"
                      >
                        <div>
                          <p className="text-sm font-medium">{userName}</p>
                          <p className="text-xs text-muted-foreground">{user.email || "No email"}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddMember(user.id, userName)}
                          disabled={pending}
                        >
                          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
              {searchQuery.length >= 2 && searchResults.length === 0 && (
                <p className="text-sm text-muted-foreground">No users found</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {leaders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Leaders</h3>
          {leaders.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-lg border border-border/60 p-3 bg-primary/5"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/20">
                  <Crown className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {member.profile?.display_name || member.profile?.email || "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">{member.profile?.email || "No email"}</p>
                </div>
              </div>
              <Badge variant="secondary" className="gap-1">
                <Shield className="size-3" />
                Leader
              </Badge>
            </div>
          ))}
        </div>
      )}

      {regularMembers.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Members</h3>
          {regularMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-lg border border-border/60 p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <span className="text-sm font-medium text-muted-foreground">
                    {(member.profile?.display_name || member.profile?.email || "U")[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {member.profile?.display_name || member.profile?.email || "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">{member.profile?.email || "No email"}</p>
                </div>
              </div>
              {member.user_id !== currentUserId && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        const userName = member.profile?.display_name || member.profile?.email || "Unknown";
                        handleRemoveMember(member.user_id, userName);
                      }}
                      disabled={pending}
                      className="text-destructive"
                    >
                      Remove from group
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
      )}

      {members.length === 0 && (
        <div className="rounded-lg border border-dashed border-border/60 p-8 text-center">
          <p className="text-sm text-muted-foreground">No members yet</p>
        </div>
      )}
    </div>
  );
}
