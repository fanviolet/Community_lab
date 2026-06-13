import { redirect } from "next/navigation";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
} from "@/lib/rbac";
import { submitPitch } from "../../actions";

export default async function SubmitPitchPage({
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

  if (!hasPermission(ctx, "pitch.submit")) {
    redirect("/dashboard/pitch");
  }

  const { id: pitchId } = await params;

  async function handleSubmit() {
    "use server";
    await submitPitch(pitchId);
    redirect(`/dashboard/pitch/${pitchId}`);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/dashboard/pitch/${pitchId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Submit Pitch</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Submit your pitch for review.
          </p>
        </div>
      </div>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Confirm Submission</CardTitle>
          <CardDescription>
            Once submitted, your pitch will be reviewed by the team.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
            <CheckCircle className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-medium">Before submitting, ensure:</h3>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>• All required fields are completed</li>
                <li>• Your proposal is clear and concise</li>
                <li>• You've included relevant metrics and impact analysis</li>
                <li>• The solution addresses the stated problem</li>
              </ul>
            </div>
          </div>

          <form action={handleSubmit}>
            <div className="flex gap-4">
              <Button type="submit">
                <Send className="mr-2 h-4 w-4" />
                Submit Pitch
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/dashboard/pitch/${pitchId}`}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
