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
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
} from "@/lib/rbac";
import { getMentorProfileByUserId } from "../actions";
import { MentorProfileForm } from "./mentor-profile-form";

export default async function MentorProfilePage() {
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

  if (!hasPermission(ctx, "mentor.profile.create")) {
    redirect("/dashboard/mentoring");
  }

  const existingProfile = await getMentorProfileByUserId(user.id);

  if (existingProfile) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/mentoring">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Mentor Profile</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              You already have a mentor profile.
            </p>
          </div>
        </div>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-sm text-muted-foreground text-center mb-4">
              Your mentor profile is already set up. You can edit it from the dashboard.
            </p>
            <Button asChild>
              <Link href="/dashboard/mentoring">
                Back to Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/mentoring">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create Mentor Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Share your expertise and become a mentor.
          </p>
        </div>
      </div>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Mentor Profile</CardTitle>
          <CardDescription>
            Fill in your expertise and availability to help guide students.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MentorProfileForm />
        </CardContent>
      </Card>
    </div>
  );
}
