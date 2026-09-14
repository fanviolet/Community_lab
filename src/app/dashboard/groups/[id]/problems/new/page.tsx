import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import ProblemForm from "@/components/problem-form";
import { buildRBACContext } from "@/lib/rbac-server";
import { hasPermission } from "@/lib/rbac";
import { getAuthSession } from "@/lib/auth/server";
import { getGroupById, getGroupMembershipState } from "@/lib/groups/server";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

export default async function NewGroupProblemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: groupId } = await params;
  const ctx = await buildRBACContext();

  if (!hasPermission(ctx, "problem.create")) {
    redirect(`/dashboard/groups/${groupId}/problems`);
  }

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

  if (!isMember) {
    redirect(`/dashboard/groups/${groupId}`);
  }

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/groups/${groupId}/problems`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Problems
          </Button>
        </Link>
      </div>
      <h1 className="text-3xl font-bold mb-2">Tạo vấn đề mới</h1>
      <p className="text-gray-500 mb-8">
        Chia sẻ một vấn đề ảnh hưởng đến cộng đồng {group.name}.
      </p>

      <ProblemForm groupId={groupId} />
    </div>
  );
}
