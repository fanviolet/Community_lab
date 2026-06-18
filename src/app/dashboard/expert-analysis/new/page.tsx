import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
} from "@/lib/rbac";
import { getProblems, getProjects } from "../actions";
import { CreateAnalysisForm } from "./create-analysis-form";

export default async function NewAnalysisPage() {
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

  if (!hasPermission(ctx, "analysis.create")) {
    redirect("/dashboard/expert-analysis");
  }

  const [problems, projects] = await Promise.all([getProblems(), getProjects()]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Phân tích mới</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tạo phân tích chuyên gia mới cho vấn đề hoặc dự án.
        </p>
      </div>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Chi tiết phân tích</CardTitle>
          <CardDescription>
            Điền chi tiết phân tích bên dưới. Tất cả các trường đánh dấu * là bắt buộc.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateAnalysisForm problems={problems ?? []} projects={projects ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
