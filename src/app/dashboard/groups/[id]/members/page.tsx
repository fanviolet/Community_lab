import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Plus, Shield, UserMinus, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAuthSession } from "@/lib/auth/server";
import {
  getGroupById,
  getGroupMembershipState,
  isGroupLeader,
} from "@/lib/groups/server";
import { getGroupMembers } from "../../actions";
import { MemberManagement } from "@/components/groups/MemberManagement";

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

export default async function GroupMembersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: groupId } = await params;
  const { user } = await getAuthSession();

  if (!user) {
    redirect("/login");
  }

  const group = await getGroupById(groupId);
  if (!group) {
    notFound();
  }

  const membershipState = await getGroupMembershipState(groupId, user.id);
  const isMember = membershipState === "member";
  const isLeader = isMember && (await isGroupLeader(groupId, user.id));

  // Non-members should be redirected to the public group page
  if (!isMember) {
    redirect(`/dashboard/groups/${groupId}`);
  }

  const members = await getGroupMembers(groupId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/groups/${groupId}/dashboard`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="rounded-2xl border border-border/50 bg-gradient-to-r from-primary/10 to-primary/5 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{group.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Manage group members</p>
          </div>
          <Badge variant="outline">{members.length} members</Badge>
        </div>
      </div>

      {isLeader ? (
        <MemberManagement groupId={groupId} members={members} currentUserId={user.id} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Group Members</CardTitle>
            <CardDescription>
              Only group leaders can manage members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {members.map((member: any) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                      <User className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {member.profile?.display_name || member.profile?.email || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.profile?.email || "No email"}
                      </p>
                    </div>
                  </div>
                  {member.role === "leader" && (
                    <Badge variant="secondary" className="gap-1">
                      <Shield className="size-3" />
                      Leader
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
