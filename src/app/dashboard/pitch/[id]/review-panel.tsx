"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Play, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { startPitchReview, rejectPitch } from "../actions";
import { ApproveButton } from "./approve-button";
import { SubmitButton } from "./submit-button";

interface ReviewPanelProps {
  pitchId: string;
  status: string;
  submittedAt: string | null;
  creatorName: string | null;
  creatorEmail: string | null;
  hasAIAnalysis: boolean;
  projectId: string | null;
  isCreator?: boolean;
}

export function ReviewPanel({
  pitchId,
  status,
  submittedAt,
  creatorName,
  creatorEmail,
  hasAIAnalysis,
  projectId,
  isCreator = false,
}: ReviewPanelProps) {
  const router = useRouter();
  const [isStartingReview, setIsStartingReview] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const handleStartReview = async () => {
    setIsStartingReview(true);
    try {
      await startPitchReview(pitchId);
      toast.success("Đã bắt đầu xem xét đề xuất");
      router.refresh();
    } catch (error) {
      console.error("Error starting review:", error);
      toast.error("Không thể bắt đầu xem xét", {
        description: error instanceof Error ? error.message : "Đã xảy ra lỗi",
      });
    } finally {
      setIsStartingReview(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }

    setIsRejecting(true);
    try {
      await rejectPitch(pitchId, rejectReason);
      toast.success("Đã từ chối đề xuất");
      setRejectDialogOpen(false);
      setRejectReason("");
      router.refresh();
    } catch (error) {
      console.error("Error rejecting pitch:", error);
      toast.error("Không thể từ chối đề xuất", {
        description: error instanceof Error ? error.message : "Đã xảy ra lỗi",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const getStatusBadge = () => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      draft: { label: "Bản nháp", variant: "secondary" },
      submitted: { label: "Đã gửi", variant: "default" },
      under_review: { label: "Đang xem xét", variant: "outline" },
      revision_required: { label: "Cần chỉnh sửa", variant: "secondary" },
      approved: { label: "Đã phê duyệt", variant: "default" },
      rejected: { label: "Đã từ chối", variant: "secondary" },
      converted: { label: "Đã chuyển đổi", variant: "default" },
    };

    const config = statusMap[status] || { label: status, variant: "secondary" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Card className="border-0 bg-gradient-to-br from-blue-50 to-purple-50 ring-1 ring-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Panel Xem Xét</CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription>
          Quản lý quy trình xem xét và phê duyệt đề xuất
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Người tạo</p>
            <p className="font-medium">{creatorName || creatorEmail || "Unknown"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Ngày gửi</p>
            <p className="font-medium">
              {submittedAt ? new Date(submittedAt).toLocaleDateString("vi-VN") : "Chưa gửi"}
            </p>
          </div>
        </div>

        {hasAIAnalysis && (
          <div className="p-3 bg-white rounded-lg ring-1 ring-black/5">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium">Phân tích AI đã sẵn sàng</span>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          {isCreator && (status === "draft" || status === "rejected") && (
            <SubmitButton pitchId={pitchId} />
          )}

          {status === "submitted" && (
            <Button
              onClick={handleStartReview}
              disabled={isStartingReview}
              size="sm"
            >
              <Play className="mr-2 h-4 w-4" />
              {isStartingReview ? "Đang xử lý..." : "Bắt đầu xem xét"}
            </Button>
          )}

          {(status === "under_review" || status === "submitted") && !projectId && (
            <ApproveButton pitchId={pitchId} disabled={!!projectId} isCreator={isCreator} />
          )}

          {(status === "under_review" || status === "submitted") && (
            <Button
              variant="destructive"
              onClick={() => setRejectDialogOpen(true)}
              size="sm"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Từ chối
            </Button>
          )}

          {projectId && (
            <Button variant="outline" size="sm" asChild>
              <a href={`/dashboard/workspace/${projectId}`}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Mở Workspace
              </a>
            </Button>
          )}
        </div>
      </CardContent>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối đề xuất</DialogTitle>
            <DialogDescription>
              Vui lòng cung cấp lý do từ chối để người tạo có thể chỉnh sửa đề xuất.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Lý do từ chối</Label>
              <Textarea
                id="reject-reason"
                placeholder="Nhập lý do từ chối..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectReason("");
              }}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting}
            >
              {isRejecting ? "Đang xử lý..." : "Xác nhận từ chối"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
