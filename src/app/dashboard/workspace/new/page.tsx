import Link from "next/link";
import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProjectForm from "@/components/workspace/ProjectForm";
import { buildRBACContext } from "@/lib/rbac-server";
import { hasPermission } from "@/lib/rbac";

export default async function NewProjectPage() {
  const ctx = await buildRBACContext();

  if (!hasPermission(ctx, "project.create")) {
    redirect("/dashboard/workspace");
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create New Project</h1>
          <p className="text-sm text-muted-foreground">
            Start a new project and invite your team members.
          </p>
        </div>
        <Link
          href="/dashboard/workspace"
          className="inline-flex items-center rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition hover:border-primary hover:text-primary"
        >
          Back to workspace
        </Link>
      </div>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm />
        </CardContent>
      </Card>
    </div>
  );
}
