import { ProblemBoard } from "@/components/problems/problem-board";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getGroupById, getGroupMembershipState } from "@/lib/groups/server";

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
      </div>
      <ProblemBoard />
    </div>
  );
}