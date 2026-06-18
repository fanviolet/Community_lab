import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
} from "@/lib/rbac";
import { CreatePitchForm } from "./create-pitch-form";
import { getProblems } from "../actions";

export default async function NewPitchPage() {
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

  if (!hasPermission(ctx, "pitch.create")) {
    redirect("/dashboard/pitch");
  }

  const problems = await getProblems();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tạo đề xuất mới</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gửi đề xuất dự án để xem xét.
        </p>
      </div>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Biểu mẫu đề xuất đa bước</CardTitle>
        </CardHeader>
        <CardContent>
          <CreatePitchForm userId={user.id} problems={problems} />
        </CardContent>
      </Card>
    </div>
  );
}
