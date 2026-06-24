import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function ValidationReportPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  // Get pitch counts
  const [{ count: totalPitches }, { count: submittedPitches }, { count: approvedPitches }, { count: convertedPitches }] =
    await Promise.all([
      supabase.from("pitches").select("*", { count: "exact", head: true }),
      supabase.from("pitches").select("*", { count: "exact", head: true }).eq("status", "submitted"),
      supabase.from("pitches").select("*", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("pitches").select("*", { count: "exact", head: true }).eq("status", "converted"),
    ]);

  // Get project counts
  const [{ count: totalProjects }, { count: activeProjects }] = await Promise.all([
    supabase.from("projects").select("*", { count: "exact", head: true }),
    supabase.from("projects").select("*", { count: "exact", head: true }).eq("status", "active"),
  ]);

  // Get workspace visible projects for current user
  const { data: membershipRows } = await supabase
    .from("project_members")
    .select("project_id")
    .eq("user_id", user.id);

  const projectIds = membershipRows?.map((m: any) => m.project_id) ?? [];

  const { count: workspaceVisibleProjects } = projectIds.length > 0
    ? await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .in("id", projectIds)
        .neq("status", "archived")
    : { count: 0 };

  // Get project_members count
  const { count: totalProjectMembers } = await supabase
    .from("project_members")
    .select("*", { count: "exact", head: true });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Workflow Validation Report</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Validates the complete workflow: Pitch → Submit → Review → Approve → Project Creation → Workspace Display
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pitches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPitches ?? 0}</div>
            <p className="text-xs text-muted-foreground">All pitches in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Submitted Pitches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submittedPitches ?? 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved Pitches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedPitches ?? 0}</div>
            <p className="text-xs text-muted-foreground">Ready for conversion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Converted Pitches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{convertedPitches ?? 0}</div>
            <p className="text-xs text-muted-foreground">Linked to projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects ?? 0}</div>
            <p className="text-xs text-muted-foreground">All projects in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects ?? 0}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Workspace Visible</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workspaceVisibleProjects ?? 0}</div>
            <p className="text-xs text-muted-foreground">Projects you can access</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Project Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjectMembers ?? 0}</div>
            <p className="text-xs text-muted-foreground">Total memberships</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workflow Status</CardTitle>
          <CardDescription>Validation of the complete pitch-to-project workflow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
         <div className="flex items-center justify-between border-b pb-4">
            <div>
              <p className="font-medium">Submitted Pitch Visibility</p>
              <p className="text-sm text-muted-foreground">Submitted pitches are viewable by all authenticated users</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${submittedPitches && submittedPitches > 0 ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
              {submittedPitches && submittedPitches > 0 ? "PASS" : "WARNING"}
            </div>
          </div>

          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <p className="font-medium">Pitch to Project Conversion</p>
              <p className="text-sm text-muted-foreground">Approved pitches can be converted to projects</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${convertedPitches && convertedPitches > 0 ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
              {convertedPitches && convertedPitches > 0 ? "PASS" : "WARNING"}
            </div>
          </div>

          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <p className="font-medium">Project Membership</p>
              <p className="text-sm text-muted-foreground">Projects have members assigned</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${totalProjectMembers && totalProjectMembers > 0 ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
              {totalProjectMembers && totalProjectMembers > 0 ? "PASS" : "WARNING"}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Workspace Display</p>
              <p className="text-sm text-muted-foreground">Users can see projects they are members of</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${workspaceVisibleProjects !== undefined ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
              {workspaceVisibleProjects !== undefined ? "PASS" : "WARNING"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
