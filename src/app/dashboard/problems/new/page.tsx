import { redirect } from "next/navigation";
import Link from "next/link";

import ProblemForm from "@/components/problem-form";
import { buildRBACContext } from "@/lib/rbac-server";
import { hasPermission } from "@/lib/rbac";
import { getAuthSession } from "@/lib/auth/server";
import { resolveActiveGroupId } from "@/lib/groups/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default async function NewProblemPage() {
  const ctx = await buildRBACContext();

  if (!hasPermission(ctx, "problem.create")) {
    redirect("/dashboard/problems");
  }

  const { user } = await getAuthSession();
  const groupId = user ? await resolveActiveGroupId(user.id) : null;

  if (!groupId) {
    return (
      <div className="max-w-3xl mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>No Active Group</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <Users className="mx-auto size-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-6">
              You need to join a community before creating problems.
            </p>
            <Button asChild>
              <Link href="/dashboard/groups">Explore Communities</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-2">Tạo vấn đề mới</h1>

      <p className="text-gray-500 mb-8">
        Chia sẻ một vấn đề ảnh hưởng đến cộng đồng của bạn.
      </p>

      <ProblemForm groupId={groupId} />
    </div>
  );
}
