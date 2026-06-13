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
  searchParams: SearchParams;
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

  if (!hasPermission(ctx, "analysis.view")) {
    redirect("/dashboard");
  }

  const canCreate = hasPermission(ctx, "analysis.create");

  const analyses = await getAnalyses({
    analysis_type: searchParams.type,
    status: searchParams.status,
    search: searchParams.search,
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Expert Analysis</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Analyze community problems and project proposals.
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/dashboard/expert-analysis/new">
              <Plus className="mr-2 h-4 w-4" />
              New Analysis
            </Link>
          </Button>
        )}
      </div>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Filter Analyses</CardTitle>
          <CardDescription>
            Search and filter expert analyses by type, status, or keywords.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search analyses..."
                  className="pl-10"
                  name="search"
                  defaultValue={searchParams.search}
                />
              </div>
            </div>
            <Select name="type" defaultValue={searchParams.type}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Analysis Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="problem">Problem</SelectItem>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="proposal">Proposal</SelectItem>
                <SelectItem value="trend">Trend</SelectItem>
              </SelectContent>
            </Select>
            <Select name="status" defaultValue={searchParams.status}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">Apply</Button>
          </div>
        </CardContent>
      </Card>

      {analyses.length === 0 ? (
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No analyses found</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              {canCreate
                ? "Create your first expert analysis to get started."
                : "Wait for experts to create analyses."}
            </p>
            {canCreate && (
              <Button asChild>
                <Link href="/dashboard/expert-analysis/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Analysis
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
