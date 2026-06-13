import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { PitchWithRelations, PitchFeedbackWithReviewer } from "@/types/pitch-management";

interface PitchOverviewProps {
  pitch: PitchWithRelations;
  feedback: PitchFeedbackWithReviewer[];
}

export function PitchOverview({ pitch, feedback }: PitchOverviewProps) {
  return (
    <div className="space-y-6">
      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Pitch Details</CardTitle>
          <CardDescription>Overview of the pitch</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pitch.description && (
            <div>
              <h3 className="text-sm font-medium mb-2">Description</h3>
              <p className="text-sm text-muted-foreground">{pitch.description}</p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium mb-2">Status</h3>
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
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">AI Score</h3>
              {pitch.ai_score ? (
                <Badge variant="outline">{pitch.ai_score.toFixed(1)}/10</Badge>
              ) : (
                <span className="text-sm text-muted-foreground">Not scored</span>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Submitted</h3>
              <p className="text-sm text-muted-foreground">
                {pitch.submitted_at
                  ? new Date(pitch.submitted_at).toLocaleString()
                  : "Not submitted"}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Reviewed</h3>
              <p className="text-sm text-muted-foreground">
                {pitch.reviewed_at
                  ? new Date(pitch.reviewed_at).toLocaleString()
                  : "Not reviewed"}
              </p>
            </div>
          </div>

          {pitch.review_notes && (
            <div>
              <h3 className="text-sm font-medium mb-2">Review Notes</h3>
              <p className="text-sm text-muted-foreground">{pitch.review_notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {feedback.length > 0 && (
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Feedback</CardTitle>
            <CardDescription>Review feedback from reviewers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {feedback.map((item) => (
              <div key={item.id} className="space-y-2 pb-4 border-b last:border-0">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={item.reviewer?.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {item.reviewer?.full_name?.charAt(0) || item.reviewer?.email.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {item.reviewer?.full_name || item.reviewer?.email}
                  </span>
                  <Badge variant="outline" className="capitalize text-xs">
                    {item.feedback_type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{item.feedback_text}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
