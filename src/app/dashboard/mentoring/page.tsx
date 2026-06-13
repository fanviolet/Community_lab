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
import { Users, MessageSquare, CheckCircle, TrendingUp, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
} from "@/lib/rbac";
import { getMentorProfiles, getMentorshipRequests } from "./actions";

export default async function MentoringPage() {
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

  if (!hasPermission(ctx, "mentor.view")) {
    redirect("/dashboard");
  }

  const canCreateRequest = hasPermission(ctx, "mentorship.request.create");
  const canCreateProfile = hasPermission(ctx, "mentor.profile.create");

  const [mentors, requests] = await Promise.all([
    getMentorProfiles(),
    getMentorshipRequests({ requested_by: user.id }),
  ]);

  const pendingRequests = requests.filter((r) => r.status === "pending").length;
  const activeRequests = requests.filter((r) => r.status === "accepted").length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mentoring Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect with mentors and manage mentorship programs.
          </p>
        </div>
        {canCreateRequest && (
          <Button asChild>
            <Link href="/dashboard/mentoring/request">
              <Plus className="mr-2 h-4 w-4" />
              Request Mentorship
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Mentors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mentors.length}</div>
            <p className="text-xs text-muted-foreground">
              Ready to help
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting response
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Mentorships</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRequests}</div>
            <p className="text-xs text-muted-foreground">
              In progress
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Profile</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {canCreateProfile ? "Setup" : "Complete"}
            </div>
            <p className="text-xs text-muted-foreground">
              Mentor status
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Mentor Directory</CardTitle>
            <CardDescription>
              Browse available mentors and their expertise.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/mentoring/directory">
                <Users className="mr-2 h-4 w-4" />
                View All Mentors
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Your Mentorships</CardTitle>
            <CardDescription>
              Manage your mentorship requests and sessions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline">
              <Link href="/dashboard/mentoring/my-mentorships">
                <MessageSquare className="mr-2 h-4 w-4" />
                View Mentorships
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {canCreateProfile && (
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Become a Mentor</CardTitle>
            <CardDescription>
              Share your expertise and help guide the next generation of innovators.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/mentoring/profile">
                <Plus className="mr-2 h-4 w-4" />
                Create Mentor Profile
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
