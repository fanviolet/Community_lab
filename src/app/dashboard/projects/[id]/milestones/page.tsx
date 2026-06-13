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
import { ArrowLeft, Plus, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
} from "@/lib/rbac";
import { getMilestones, getProjectMetrics } from "../../actions";

export default async function MilestonesPage({
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

  if (!hasPermission(ctx, "milestone.view")) {
    redirect("/dashboard/projects");
  }

  const canCreateMilestone = hasPermission(ctx, "milestone.create");

  const { id: projectId } = await params;

  const [milestones, metrics] = await Promise.all([
    getMilestones(projectId),
    getProjectMetrics(projectId),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Milestones</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {metrics.active_milestones} active · {metrics.completed_milestones} completed
            </p>
          </div>
        </div>
        {canCreateMilestone && (
          <Button asChild>
            <Link href={`/dashboard/projects/${projectId}/new-milestone`}>
              <Plus className="mr-2 h-4 w-4" />
              New Milestone
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.active_milestones}</div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completed_milestones}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>All Milestones</CardTitle>
          <CardDescription>
            Track project milestones and deadlines
          </CardDescription>
        </CardHeader>
        <CardContent>
          {milestones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground text-center">
                No milestones yet. Create your first milestone to track project progress.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {milestones.map((milestone) => (
                <Card key={milestone.id} className="border-0 bg-muted/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{milestone.title}</CardTitle>
                        {milestone.description && (
                          <CardDescription className="mt-1">
                            {milestone.description}
                          </CardDescription>
                        )}
                      </div>
                      <Badge
                        variant={
                          milestone.status === "completed"
                            ? "approved"
                            : milestone.status === "delayed"
                            ? "rejected"
                            : milestone.status === "in_progress"
                            ? "default"
                            : "secondary"
                        }
                        className="capitalize"
                      >
                        {milestone.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Target: {new Date(milestone.target_date).toLocaleDateString()}</span>
                      </div>
                      {milestone.completed_at && (
                        <span>Completed: {new Date(milestone.completed_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
