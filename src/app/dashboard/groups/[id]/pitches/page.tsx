import { redirect, notFound } from "next/navigation";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
} from "@/lib/rbac";
import { getPitches } from "@/app/dashboard/pitch/actions";
import { getGroupById, getGroupMembershipState } from "@/lib/groups/server";
import { ProposalCard } from "@/components/dashboard/ProposalCard";

export default async function GroupPitchesPage({
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = parseRole(profile?.role);
  const ctx = createAuthenticatedContext(role, user.id);

  const canCreate = hasPermission(ctx, "pitch.create");

  const pitches = await getPitches({ group_id: groupId });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Đề xuất - {group.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Quản lý các đề xuất trong nhóm
          </p>
        </div>
        {canCreate && (
          <Link href={`/dashboard/groups/${groupId}/pitches/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Đề xuất mới
            </Button>
          </Link>
        )}
      </div>

      {pitches.length === 0 ? (
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Không tìm thấy đề xuất nào
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              {canCreate
                ? "Tạo đề xuất đầu tiên để bắt đầu."
                : "Chờ đề xuất được tạo."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pitches.map((pitch: any) => (
            <ProposalCard
              key={pitch.id}
              id={pitch.id}
              title={pitch.title}
              status={pitch.status}
              author={pitch.created_by || "Không rõ"}
              date={pitch.created_at}
              voteCount={0}
              aiScore={pitch.ai_score || 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}