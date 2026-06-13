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
import { ArrowLeft, Edit, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
} from "@/lib/rbac";
import { getAnalysisById, deleteAnalysis } from "../actions";
import { AnalysisDetail } from "./analysis-detail";

export default async function AnalysisDetailPage({
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

  if (!hasPermission(ctx, "analysis.view")) {
    redirect("/dashboard/expert-analysis");
  }

  const { id: analysisId } = await params;
  const analysis = await getAnalysisById(analysisId);

  if (!analysis) {
    redirect("/dashboard/expert-analysis");
  }

  const canEdit = hasPermission(ctx, "analysis.edit.own") && analysis.created_by === user.id;
  const canDelete = hasPermission(ctx, "analysis.delete.own") && analysis.created_by === user.id;
  const canEditAny = hasPermission(ctx, "analysis.edit.any");
  const canDeleteAny = hasPermission(ctx, "analysis.delete.any");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/expert-analysis">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{analysis.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              By {analysis.author?.full_name || "Unknown"} ·{" "}
              {new Date(analysis.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {(canEdit || canEditAny) && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/expert-analysis/${analysis.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          )}
          {(canDelete || canDeleteAny) && (
            <Button
              variant="destructive"
              onClick={async () => {
                if (confirm("Are you sure you want to delete this analysis?")) {
                  await deleteAnalysis(analysis.id);
                  redirect("/dashboard/expert-analysis");
                }
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Badge variant="outline" className="capitalize">
          {analysis.analysis_type}
        </Badge>
        <Badge variant={analysis.status === "published" ? "approved" : "secondary"} className="capitalize">
          {analysis.status}
        </Badge>
        {analysis.ai_generated && (
          <Badge variant="outline">AI Generated</Badge>
        )}
      </div>

      <AnalysisDetail analysis={analysis} canEdit={canEdit || canEditAny} />
    </div>
  );
}
