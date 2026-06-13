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
import { ArrowLeft, Calendar, Plus, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
} from "@/lib/rbac";
import { getMentorshipRequestById, getMentoringSessions, createMentoringSession } from "../../actions";
import { SessionList } from "./session-list";

export default async function MentoringSessionsPage({
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

  if (!hasPermission(ctx, "mentoring.session.view.own")) {
    redirect("/dashboard/mentoring");
  }

  const { id: mentorshipId } = await params;

  const [mentorship, sessions] = await Promise.all([
    getMentorshipRequestById(mentorshipId),
    getMentoringSessions(mentorshipId),
  ]);

  if (!mentorship) {
    redirect("/dashboard/mentoring/my-mentorships");
  }

  const canCreateSession = hasPermission(ctx, "mentoring.session.create");

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
          <h1 className="text-2xl font-semibold tracking-tight">Mentoring Sessions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mentorship.mentor?.full_name} · {mentorship.project?.title}
          </p>
        </div>
      </div>

      {canCreateSession && (
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Schedule New Session</CardTitle>
            <CardDescription>
              Plan a new mentoring session with your mentor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={async (formData) => {
              "use server";
              const topic = formData.get("topic") as string;
              const session_date = formData.get("session_date") as string;
              const notes = formData.get("notes") as string;

              await createMentoringSession({
                mentorship_request_id: mentorshipId,
                topic,
                session_date,
                notes,
              });
            }} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic *</Label>
                  <Input
                    id="topic"
                    name="topic"
                    required
                    placeholder="Session topic"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session_date">Date & Time *</Label>
                  <Input
                    id="session_date"
                    name="session_date"
                    type="datetime-local"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  placeholder="Session notes or agenda"
                />
              </div>
              <Button type="submit">
                <Plus className="mr-2 h-4 w-4" />
                Schedule Session
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Session History</CardTitle>
          <CardDescription>
            All mentoring sessions for this mentorship.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground text-center">
                No sessions scheduled yet.
              </p>
            </div>
          ) : (
            <SessionList sessions={sessions} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
