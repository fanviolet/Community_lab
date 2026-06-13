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
          <h1 className="text-2xl font-semibold tracking-tight">Progress Tracking</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mentorship.mentor?.full_name} · {mentorship.project?.title}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openIssues}</div>
            <p className="text-xs text-muted-foreground">Active problems</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Issues</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedIssues}</div>
            <p className="text-xs text-muted-foreground">Completed tasks</p>
          </CardContent>
        </Card>
      </div>

      {canCreateProgress && (
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Add New Issue</CardTitle>
            <CardDescription>
              Track a new issue or task for this mentorship.
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
                  <Label htmlFor="issue">Issue Description *</Label>
                  <Textarea
                    id="issue"
                    name="issue"
                    required
                    rows={3}
                    placeholder="Describe the issue or task"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select name="priority" defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    name="due_date"
                    type="date"
                  />
                </div>
              </div>
              <Button type="submit">
                <Plus className="mr-2 h-4 w-4" />
                Add Issue
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Progress Issues</CardTitle>
          <CardDescription>
            All tracked issues and their status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {progress.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground text-center">
                No issues tracked yet.
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
