import { ProblemBoard } from "@/components/problems/problem-board";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getGroupById, getGroupMembershipState } from "@/lib/groups/server";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/components/rbac/PermissionGuard";

export default async function GroupProblemsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: groupId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const group = await getGroupById(groupId);
  if (!group) {
    notFound();
  }

  const membershipState = await getGroupMembershipState(groupId, user.id);
  const isMember = membershipState === "member";

  // Non-members should be redirected to the public group page
  if (!isMember) {
    redirect(`/dashboard/groups/${groupId}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Vấn đề - {group.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Quản lý các vấn đề trong nhóm
          </p>
        </div>
        <PermissionGuard permission="problem.create">
          <Link href={`/dashboard/groups/${groupId}/problems/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Vấn đề mới
            </Button>
          </Link>
        </PermissionGuard>
      </div>
      <ProblemBoard />
    </div>
  );
}