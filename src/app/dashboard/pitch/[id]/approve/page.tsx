import { redirect } from "next/navigation";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
} from "@/lib/rbac";
import { reviewPitch } from "../../actions";

export default async function ApprovePitchPage({
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

  if (!hasPermission(ctx, "pitch.approve")) {
    redirect("/dashboard/pitch");
  }

  const { id: pitchId } = await params;

  async function handleApprove(formData: FormData) {
    "use server";
    const reviewNotes = formData.get("reviewNotes") as string;
    await reviewPitch(pitchId, "approved", reviewNotes);
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
          <h1 className="text-2xl font-semibold tracking-tight">Approve Pitch</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Approve this pitch for implementation.
          </p>
        </div>
      </div>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Approval Review</CardTitle>
          <CardDescription>
            Add any notes for the approval decision.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
            <div>
              <h3 className="font-medium">Approval Checklist:</h3>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>• Problem statement is clear and well-defined</li>
                <li>• Solution is feasible and innovative</li>
                <li>• Impact and metrics are realistic</li>
                <li>• Implementation plan is detailed</li>
                <li>• Team has required skills</li>
              </ul>
            </div>
          </div>

          <form action={handleApprove}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reviewNotes">Review Notes (Optional)</Label>
                <Textarea
                  id="reviewNotes"
                  name="reviewNotes"
                  placeholder="Add any notes about this approval..."
                  rows={4}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve Pitch
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/dashboard/pitch/${pitchId}`}>Cancel</Link>
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
