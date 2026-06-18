import { redirect } from "next/navigation";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
} from "@/lib/rbac";
import { getAnalyses } from "./actions";
import { AnalysisDashboard } from "./analysis-dashboard";

interface SearchParams {
  type?: string;
  status?: string;
  search?: string;
}

export default async function ExpertAnalysisPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

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

  if (!hasPermission(ctx, "analysis.view")) {
    redirect("/dashboard");
  }

  const canCreate = hasPermission(ctx, "analysis.create");

  const analyses = await getAnalyses({
    analysis_type: params.type,
    status: params.status,
    search: params.search,
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Phân tích chuyên gia</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Phân tích vấn đề cộng đồng và đề xuất dự án.
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/dashboard/expert-analysis/new">
              <Plus className="mr-2 h-4 w-4" />
              Tạo phân tích mới
            </Link>
          </Button>
        )}
      </div>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Lọc phân tích</CardTitle>
          <CardDescription>
            Tìm kiếm và lọc phân tích chuyên gia theo loại, trạng thái hoặc từ khóa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm phân tích..."
                  className="pl-10"
                  name="search"
                  defaultValue={params.search}
                />
              </div>
            </div>
            <Select name="type" defaultValue={params.type}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Loại phân tích" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="problem">Problem</SelectItem>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="proposal">Proposal</SelectItem>
                <SelectItem value="trend">Trend</SelectItem>
              </SelectContent>
            </Select>
            <Select name="status" defaultValue={params.status}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">Áp dụng</Button>
          </div>
        </CardContent>
      </Card>

      {analyses.length === 0 ? (
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Không tìm thấy phân tích nào</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              {canCreate
                ? "Tạo phân tích chuyên gia đầu tiên của bạn để bắt đầu."
                : "Chờ chuyên gia tạo phân tích."}
            </p>
            {canCreate && (
              <Button asChild>
                <Link href="/dashboard/expert-analysis/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo phân tích
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <AnalysisDashboard analyses={analyses} canCreate={canCreate} />
      )}
    </div>
  );
}
