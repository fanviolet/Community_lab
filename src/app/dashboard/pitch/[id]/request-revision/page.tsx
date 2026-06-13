import { redirect } from "next/navigation";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
} from "@/lib/rbac";
import { reviewPitch } from "../../actions";

export default async function RequestRevisionPage({
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

  if (!hasPermission(ctx, "pitch.reject")) {
    redirect("/dashboard/pitch");
  }

  const { id: pitchId } = await params;

  async function handleRequestRevision(formData: FormData) {
    "use server";
    const reviewNotes = formData.get("reviewNotes") as string;
    if (!reviewNotes) {
      throw new Error("Review notes are required for revision request");
    }
    await reviewPitch(pitchId, "revision_required", reviewNotes);
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
          <h1 className="text-2xl font-semibold tracking-tight">Request Revision</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Request changes to this pitch.
          </p>
        </div>
      </div>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Revision Request</CardTitle>
          <CardDescription>
            Specify what needs to be revised in the pitch.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-4 p-4 bg-yellow-50 rounded-lg">
            <AlertCircle className="h-6 w-6 text-yellow-600 mt-1" />
            <div>
              <h3 className="font-medium">Revision Guidelines:</h3>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>• Be specific about what needs to be changed</li>
                <li>• Prioritize the most important revisions</li>
                <li>• Provide clear guidance on expectations</li>
                <li>• Set realistic deadlines if applicable</li>
              </ul>
            </div>
          </div>

          <form action={handleRequestRevision}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reviewNotes">Revision Notes *</Label>
                <Textarea
                  id="reviewNotes"
                  name="reviewNotes"
                  placeholder="Describe what needs to be revised and provide specific guidance..."
                  rows={6}
                  required
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" variant="outline" className="bg-yellow-600 hover:bg-yellow-700 text-white">
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Request Revision
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
