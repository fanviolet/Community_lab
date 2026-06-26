import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type {
  PitchWithRelations,
  PitchFeedbackWithReviewer,
} from "@/types/pitch-management";

interface PitchOverviewProps {
  pitch: PitchWithRelations;
  feedback: PitchFeedbackWithReviewer[];
}

export function PitchOverview({ pitch, feedback }: PitchOverviewProps) {
  const statusLabels: Record<string, string> = {
    draft: "Bản nháp",
    submitted: "Đã gửi",
    under_review: "Đang xem xét",
    revision_required: "Cần chỉnh sửa",
    approved: "Đã duyệt",
    rejected: "Bị từ chối",
    converted: "Đã chuyển đổi",
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Chi tiết đề xuất</CardTitle>
          <CardDescription>Tổng quan về đề xuất</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pitch.description && (
            <div>
              <h3 className="text-sm font-medium mb-2">Mô tả</h3>
              <p className="text-sm text-muted-foreground">
                {pitch.description}
              </p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium mb-2">Trạng thái</h3>
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
                {statusLabels[pitch.status] || pitch.status.replace("_", " ")}
              </Badge>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Điểm AI</h3>
              {pitch.ai_score ? (
                <Badge variant="outline">{pitch.ai_score.toFixed(1)}/10</Badge>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Chưa được chấm điểm
                </span>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Đã gửi</h3>
              <p className="text-sm text-muted-foreground">
                {pitch.submitted_at
                  ? new Date(pitch.submitted_at).toLocaleString()
                  : "Chưa gửi"}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Đã đánh giá</h3>
              <p className="text-sm text-muted-foreground">
                {pitch.reviewed_at
                  ? new Date(pitch.reviewed_at).toLocaleString()
                  : "Chưa đánh giá"}
              </p>
            </div>
          </div>

          {pitch.review_notes && (
            <div>
              <h3 className="text-sm font-medium mb-2">Ghi chú đánh giá</h3>
              <p className="text-sm text-muted-foreground">
                {pitch.review_notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {feedback.length > 0 && (
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Phản hồi</CardTitle>
            <CardDescription>Phản hồi đánh giá từ người duyệt</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {feedback.map((item) => (
              <div
                key={item.id}
                className="space-y-2 pb-4 border-b last:border-0"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={item.reviewer?.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {item.reviewer?.display_name?.charAt(0) ||
                        item.reviewer?.email.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {item.reviewer?.display_name || item.reviewer?.email}
                  </span>
                  <Badge variant="outline" className="capitalize text-xs">
                    {item.feedback_type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {item.feedback_text}
                </p>
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
