import { redirect } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
} from "@/lib/rbac";
import { getPitchById, getPitchContent } from "../../actions";
import { EditPitchForm } from "./edit-pitch-form";

export default async function EditPitchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = parseRole(profile?.role);
  const ctx = createAuthenticatedContext(role, user.id);

  if (!hasPermission(ctx, "pitch.view")) {
    redirect("/dashboard/pitch");
  }

  const { id: pitchId } = await params;
  const [pitch, content] = await Promise.all([
    getPitchById(pitchId),
    getPitchContent(pitchId),
  ]);

  if (!pitch) {
    redirect("/dashboard/pitch");
  }

  const isOwner = pitch.created_by === user.id;
  const isAdmin = role === "admin";

  // Check permissions: only owner or admin can edit
  if (!isOwner && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Truy cập bị từ chối</h3>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Bạn không có quyền sửa đề xuất này.
        </p>
        <Button asChild>
          <Link href={`/dashboard/pitch/${pitchId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại đề xuất
          </Link>
        </Button>
      </div>
    );
  }

  // Only allow editing if pitch is in draft status (for owners) or any status (for admins)
  if (!isAdmin && pitch.status !== "draft") {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Không thể sửa</h3>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Đề xuất này không còn ở trạng thái bản nháp và không thể sửa.
        </p>
        <Button asChild>
          <Link href={`/dashboard/pitch/${pitchId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại đề xuất
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/pitch/${pitchId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Sửa đề xuất</h1>
            <p className="text-sm text-muted-foreground">
              Cập nhật chi tiết đề xuất của bạn
            </p>
          </div>
        </div>
      </div>

      <EditPitchForm
        pitch={pitch}
        content={content}
        userId={user.id}
        isAdmin={isAdmin}
      />
    </div>
  );
}
