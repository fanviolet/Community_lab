import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getGroupById, getGroupMembershipState } from "@/lib/groups/server";
import { GroupNav } from "@/components/groups/GroupNav";

export default async function GroupLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}>) {
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

  return (
    <div className="flex h-full flex-col">
      {/* Show simplified group switcher only for members with multiple groups */}
      {isMember && <GroupNav group={group} />}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}