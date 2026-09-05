import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FolderKanban, Lightbulb, MessageSquare, Search, Users, Building2 } from "lucide-react";

import { GroupJoinButton } from "@/components/groups/GroupJoinButton";
import { JoinRequestsPanel } from "@/components/groups/JoinRequestsPanel";
import { LeaveGroupButton } from "@/components/groups/LeaveGroupButton";
import { EditGroupDialog } from "@/components/groups/EditGroupDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPendingJoinRequests } from "@/app/dashboard/groups/actions";
import { getAuthSession } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import {
  getGroupById,
  getGroupMembershipState,
  isGroupLeader,
} from "@/lib/groups/server";

export default async function GroupDetailPage({
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
  const pendingRequests = isLeader
    ? await getPendingJoinRequests(groupId)
    : [];

  const supabase = await createClient();
  let projectCount = 0;
  let problemCount = 0;
  let memberCount = 0;

  if (isMember) {
    const [projectsResult, problemsResult, membersResult] = await Promise.all([
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("group_id", groupId),
      supabase
        .from("problems")
        .select("id", { count: "exact", head: true })
        .eq("group_id", groupId),
      supabase
        .from("group_members")
        .select("id", { count: "exact", head: true })
        .eq("group_id", groupId),
    ]);
    projectCount = projectsResult.count ?? 0;
    problemCount = problemsResult.count ?? 0;
    memberCount = membersResult.count ?? 0;
  }

  return (
    <div className="space-y-6">
      {/* Compact Group Header */}
      <div className="border border-border/60 rounded-lg bg-card p-5">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="size-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-semibold text-foreground">{group.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {group.description || "No description provided."}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isMember && (
                  <Badge variant={isLeader ? "default" : "secondary"} className="shrink-0">
                    {isLeader ? "Leader" : "Member"}
                  </Badge>
                )}
                <GroupJoinButton
                  groupId={groupId}
                  membershipState={membershipState}
                />
              </div>
            </div>

            {/* Stats and Actions */}
            {isMember && (
              <div className="mt-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <FolderKanban className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{projectCount} Projects</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Search className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{problemCount} Problems</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="size-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{memberCount} Members</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!isLeader && (
                    <LeaveGroupButton groupId={groupId} />
                  )}
                  {isLeader && (
                    <>
                      <EditGroupDialog
                        groupId={groupId}
                        initialName={group.name}
                        initialSlug={group.slug}
                        initialDescription={group.description}
                        initialIsPublic={group.is_public}
                      />
                      <Link href={`/dashboard/groups/${groupId}/members`}>
                        <Button variant="outline" size="sm">
                          Manage Members
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Join Requests Panel for Leaders */}
      {isLeader && pendingRequests.length > 0 && (
        <JoinRequestsPanel requests={pendingRequests} />
      )}

      {/* Non-member state */}
      {!isMember && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            {membershipState === "pending" ? (
              <div className="space-y-3">
                <div className="flex justify-center">
                  <div className="size-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <svg className="size-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-sm font-medium">Request Pending</h3>
                <p className="text-sm text-muted-foreground">
                  Your join request is pending approval. You will gain access to internal resources once approved.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Request to join this group to access problems, discussions, pitches, and projects.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty state for members with no content */}
      {isMember && projectCount === 0 && problemCount === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FolderKanban className="mx-auto size-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No projects yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Start the first project for this community.
            </p>
            <Link href={`/dashboard/groups/${groupId}/projects/new`}>
              <Button size="sm">Create Project</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
