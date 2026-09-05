import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getAuthSession } from "@/lib/auth/server";
import { getGroupById } from "@/lib/groups/server";
import { notFound } from "next/navigation";

export default async function NewPitchPage({
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
        <Link href={`/dashboard/groups/${groupId}/pitches`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pitches
          </Button>
        </Link>
      </div>
      <h1 className="text-3xl font-bold">Tạo đề xuất mới</h1>
      <p className="text-gray-500 mb-8">
        Tạo một đề xuất mới cho nhóm {group.name}.
      </p>
      <div className="rounded-xl border border-border/50 bg-gradient-to-r from-primary/10 to-primary/5 p-6 shadow-sm">
        <p className="text-muted-foreground mb-4">
          Chọn loại đề xuất để bắt đầu:
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Button asChild className="h-24 flex-col gap-2">
            <Link href={`/dashboard/pitch/new?group=${groupId}`}>
              <Plus className="h-6 w-6" />
              <span>Đề xuất thường</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}