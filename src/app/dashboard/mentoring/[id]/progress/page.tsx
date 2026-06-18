import { redirect } from "next/navigation";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, AlertTriangle, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
} from "@/lib/rbac";
import { getMentorshipRequestById, getMentoringProgress, createMentoringProgress } from "../../actions";
import { ProgressList } from "./progress-list";

export default async function MentoringProgressPage({
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

  if (!hasPermission(ctx, "mentoring.progress.view.own")) {
    redirect("/dashboard/mentoring");
  }

  const { id: mentorshipId } = await params;

  const [mentorship, progress] = await Promise.all([
    getMentorshipRequestById(mentorshipId),
    getMentoringProgress(mentorshipId),
  ]);

  if (!mentorship) {
    redirect("/dashboard/mentoring/my-mentorships");
  }

  const canCreateProgress = hasPermission(ctx, "mentoring.progress.create");

  const openIssues = progress.filter((p) => p.status === "open").length;
  const resolvedIssues = progress.filter((p) => p.status === "resolved").length;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/mentoring/my-mentorships">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Theo dõi tiến độ</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mentorship.mentor?.full_name} · {mentorship.project?.title}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vấn đề đang mở</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openIssues}</div>
            <p className="text-xs text-muted-foreground">Vấn đề đang hoạt động</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vấn đề đã giải quyết</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedIssues}</div>
            <p className="text-xs text-muted-foreground">Nhiệm vụ đã hoàn thành</p>
          </CardContent>
        </Card>
      </div>

      {canCreateProgress && (
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Thêm vấn đề mới</CardTitle>
            <CardDescription>
              Theo dõi vấn đề hoặc nhiệm vụ mới cho quan hệ cố vấn này.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={async (formData) => {
              "use server";
              const issue = formData.get("issue") as string;
              const priority = formData.get("priority") as string;
              const due_date = formData.get("due_date") as string;

              await createMentoringProgress({
                mentorship_request_id: mentorshipId,
                issue,
                priority: priority as any,
                due_date: due_date || undefined,
              });
            }} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="issue">Mô tả vấn đề *</Label>
                  <Textarea
                    id="issue"
                    name="issue"
                    required
                    rows={3}
                    placeholder="Mô tả vấn đề hoặc nhiệm vụ"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Mức độ ưu tiên</Label>
                  <Select name="priority" defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Thấp</SelectItem>
                      <SelectItem value="medium">Trung bình</SelectItem>
                      <SelectItem value="high">Cao</SelectItem>
                      <SelectItem value="critical">Khẩn cấp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date">Ngày hết hạn</Label>
                  <Input
                    id="due_date"
                    name="due_date"
                    type="date"
                  />
                </div>
              </div>
              <Button type="submit">
                <Plus className="mr-2 h-4 w-4" />
                Thêm vấn đề
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Vấn đề Tiến độ</CardTitle>
          <CardDescription>
            Tất cả các vấn đề được theo dõi và trạng thái của chúng.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {progress.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground text-center">
                Chưa có vấn đề nào được theo dõi.
              </p>
            </div>
          ) : (
            <ProgressList progress={progress} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
