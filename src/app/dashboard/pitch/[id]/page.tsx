import { redirect } from "next/navigation";
import Link from "next/link";


import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Edit, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
} from "@/lib/rbac";
import { getPitchById, getPitchContent, getPitchHistory, getPitchFeedback } from "../actions";
import { PitchOverview } from "./pitch-overview";
import { PitchProposal } from "./pitch-proposal";
import { PitchAIAnalysis } from "./pitch-ai-analysis";
import { PitchHistory } from "./pitch-history";
import { ApproveButton } from "./approve-button";
import { ReviewPanel } from "./review-panel";
import { SubmitButton } from "./submit-button";

export default async function PitchDetailPage({
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

  if (!hasPermission(ctx, "pitch.view")) {
    redirect("/dashboard/pitch");
  }

  const canEdit = hasPermission(ctx, "pitch.edit.own");
  const canSubmit = hasPermission(ctx, "pitch.submit");
  const canStartReview = hasPermission(ctx, "pitch.start_review");
  const canApprove = hasPermission(ctx, "pitch.approve");
  const canReject = hasPermission(ctx, "pitch.reject");
  const canConvert = hasPermission(ctx, "pitch.convert");


  const { id: pitchId } = await params;
  const [pitch, content, history, feedback] = await Promise.all([
    getPitchById(pitchId),
    getPitchContent(pitchId),
    getPitchHistory(pitchId),
    getPitchFeedback(pitchId),
  ]);

  if (!pitch) {
    redirect("/dashboard/pitch");
  }

  const isOwner = pitch.created_by === user.id;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/pitch">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{pitch.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={
                  pitch.status === "approved"
                    ? "approved"
                    : pitch.status === "rejected"
                    ? "rejected"
                    : pitch.status === "revision_required"
                    ? "revise"
                    : pitch.status === "submitted"
                    ? "default"
                    : "secondary"
                }
                className="capitalize"
              >
                {pitch.status.replace("_", " ")}
              </Badge>
              {pitch.ai_score && (
                <Badge variant="outline" className="capitalize">
                  AI Score: {pitch.ai_score.toFixed(1)}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {isOwner && pitch.status === "draft" && canEdit && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/pitch/${pitch.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          )}
          {isOwner && pitch.status === "draft" && canSubmit && (
            <SubmitButton pitchId={pitch.id} />
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {pitch.creator && (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={pitch.creator.avatar_url ?? undefined} />
              <AvatarFallback>
                {pitch.creator.full_name?.charAt(0) || pitch.creator.email.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{pitch.creator.full_name || pitch.creator.email}</p>
              <p className="text-xs text-muted-foreground">
                Created {new Date(pitch.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
        {pitch.problem && (
          <div>
            <p className="text-xs text-muted-foreground">Related Problem</p>
            <p className="text-sm font-medium">{pitch.problem.title}</p>
          </div>
        )}
      </div>

      {/* Review Panel - Only visible to Leader/Admin */}
      {(canStartReview || canConvert) && (
        <ReviewPanel
          pitchId={pitch.id}
          status={pitch.status}
          submittedAt={pitch.submitted_at}
          creatorName={pitch.creator?.full_name || null}
          creatorEmail={pitch.creator?.email || null}
          hasAIAnalysis={!!content}
          projectId={pitch.project_id}
          isCreator={isOwner}
        />
      )}

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="proposal">Proposal</TabsTrigger>
          <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <PitchOverview pitch={pitch} feedback={feedback} />
        </TabsContent>

        <TabsContent value="proposal" className="space-y-6">
          <PitchProposal content={content} />
        </TabsContent>

        <TabsContent value="ai-analysis" className="space-y-6">
          <PitchAIAnalysis pitchId={pitch.id} />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <PitchHistory history={history} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
