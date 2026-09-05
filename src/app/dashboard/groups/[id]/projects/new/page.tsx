import { redirect } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getAuthSession } from "@/lib/auth/server";
import { getGroupById } from "@/lib/groups/server";
import { notFound } from "next/navigation";

export default async function NewProjectPage({
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

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/groups/${groupId}/projects`}>
          <Button variant="ghost" size="sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to Projects
          </Button>
        </Link>
      </div>
      <h1 className="text-3xl font-bold">Tạo dự án mới</h1>
      <p className="text-gray-500 mb-8">
        Tạo một dự án mới cho nhóm {group.name}.
      </p>
      <div className="rounded-xl border border-border/50 bg-gradient-to-r from-primary/10 to-primary/5 p-6 shadow-sm">
        <p className="text-muted-foreground mb-4">
          Truy cập workspace để tạo dự án mới:
        </p>
        <Button asChild>
          <Link href={`/dashboard/workspace/new?group=${groupId}`}>
            Tạo dự án mới
          </Link>
        </Button>
      </div>
    </div>
  );
}