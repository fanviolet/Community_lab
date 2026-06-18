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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Plus, Search, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
} from "@/lib/rbac";
import { getPitches, getPitchMetrics } from "./actions";
import { PitchCard } from "./pitch-card";

export default async function PitchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
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
    redirect("/dashboard");
  }

  const canCreate = hasPermission(ctx, "pitch.create");

  const [pitches, metrics] = await Promise.all([
    getPitches({
      status: resolvedSearchParams.status,
      created_by: role === "member" ? user.id : undefined,
    }),
    getPitchMetrics(role === "member" ? { created_by: user.id } : undefined),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Đề xuất dự án</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tạo và quản lý đề xuất dự án.
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/dashboard/pitch/new">
              <Plus className="mr-2 h-4 w-4" />
              Đề xuất mới
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tổng bản nháp</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.drafts}</div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Đã gửi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.submitted}</div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Đã duyệt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.approved}</div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Bị từ chối</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.rejected}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Lọc đề xuất</CardTitle>
          <CardDescription>
            Tìm kiếm và lọc theo trạng thái hoặc từ khóa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm đề xuất..."
                  className="pl-10"
                  name="search"
                  defaultValue={resolvedSearchParams.search}
                />
              </div>
            </div>
            <Select name="status" defaultValue={resolvedSearchParams.status}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Bản nháp</SelectItem>
                <SelectItem value="submitted">Đã gửi</SelectItem>
                <SelectItem value="under_review">Đang xét duyệt</SelectItem>
                <SelectItem value="revision_required">Cần chỉnh sửa</SelectItem>
                <SelectItem value="approved">Đã duyệt</SelectItem>
                <SelectItem value="rejected">Bị từ chối</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">Áp dụng</Button>
          </div>
        </CardContent>
      </Card>

      {pitches.length === 0 ? (
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Không tìm thấy đề xuất</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              {canCreate
                ? "Tạo đề xuất đầu tiên của bạn để bắt đầu."
                : "Chờ đề xuất được tạo."}
            </p>
            {canCreate && (
              <Button asChild>
                <Link href="/dashboard/pitch/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo đề xuất
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pitches.map((pitch) => (
            <PitchCard key={pitch.id} pitch={pitch} />
          ))}
        </div>
      )}
    </div>
  );
}
