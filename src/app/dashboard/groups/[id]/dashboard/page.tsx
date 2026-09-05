import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FolderKanban, Lightbulb, MessageSquare, Search, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAuthSession } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import {
  getGroupById,
  getGroupMembershipState,
  isGroupLeader,
} from "@/lib/groups/server";

export default async function GroupDashboardPage({
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

  const supabase = await createClient();
  let projectCount = 0;
  let problemCount = 0;
  let pitchCount = 0;
  let discussionCount = 0;

  if (isMember) {
    const [projectsResult, problemsResult, pitchesResult, discussionsResult] = await Promise.all([
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("group_id", groupId),
      supabase
        .from("problems")
        .select("id", { count: "exact", head: true })
        .eq("group_id", groupId),
      supabase
        .from("pitches")
        .select("id", { count: "exact", head: true })
        .eq("group_id", groupId),
      supabase
        .from("discussion_channels")
        .select("id", { count: "exact", head: true })
        .eq("group_id", groupId),
    ]);
    projectCount = projectsResult.count ?? 0;
    problemCount = problemsResult.count ?? 0;
    pitchCount = pitchesResult.count ?? 0;
    discussionCount = discussionsResult.count ?? 0;
  }

  if (!isMember) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/groups">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Groups
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {membershipState === "pending"
                ? "Your join request is pending approval."
                : "You need to join this group to access its dashboard."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/groups">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Groups
          </Button>
        </Link>
      </div>

      <div className="rounded-2xl border border-border/50 bg-gradient-to-r from-primary/10 to-primary/5 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{group.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{group.description}</p>
          </div>
          {isLeader && (
            <span className="px-3 py-1 text-xs font-medium bg-primary/20 text-primary rounded-full">
              Leader
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Problems</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{problemCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pitches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pitchCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Discussions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{discussionCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href={`/dashboard/groups/${groupId}/projects`} className="block">
          <Card className="transition-colors hover:border-primary/40">
            <CardHeader>
              <FolderKanban className="size-5 text-primary" />
              <CardTitle className="text-base">Projects</CardTitle>
            </CardHeader>
          </Card>
        </Link>

        <Link href={`/dashboard/groups/${groupId}/problems`} className="block">
          <Card className="transition-colors hover:border-primary/40">
            <CardHeader>
              <Search className="size-5 text-primary" />
              <CardTitle className="text-base">Problems</CardTitle>
            </CardHeader>
          </Card>
        </Link>

        <Link href={`/dashboard/groups/${groupId}/discussions`} className="block">
          <Card className="transition-colors hover:border-primary/40">
            <CardHeader>
              <MessageSquare className="size-5 text-primary" />
              <CardTitle className="text-base">Discussions</CardTitle>
            </CardHeader>
          </Card>
        </Link>

        <Link href={`/dashboard/groups/${groupId}/pitches`} className="block">
          <Card className="transition-colors hover:border-primary/40">
            <CardHeader>
              <Lightbulb className="size-5 text-primary" />
              <CardTitle className="text-base">Pitches</CardTitle>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}