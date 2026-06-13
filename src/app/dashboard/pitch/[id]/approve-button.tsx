"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { approvePitchAndCreateProject } from "../actions";
import { toast } from "sonner";

interface ApproveButtonProps {
  pitchId: string;
  disabled?: boolean;
  isCreator?: boolean;
}

export function ApproveButton({ pitchId, disabled, isCreator = false }: ApproveButtonProps) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const result = await approvePitchAndCreateProject(pitchId);
      toast.success("Pitch đã được phê duyệt và dự án đã được tạo", {
        description: isCreator
          ? "Dự án của bạn đã được tạo thành công"
          : "Bạn sẽ được chuyển đến không gian làm việc dự án",
      });
      // Redirect reviewer to project page
      if (!isCreator) {
        router.push(`/dashboard/workspace/${result.project.id}`);
      } else {
        // Refresh page to show "Open Workspace" button
        router.refresh();
      }
    } catch (error) {
      console.error("Error approving pitch:", error);
      toast.error("Không thể phê duyệt pitch", {
        description: error instanceof Error ? error.message : "Đã xảy ra lỗi",
      });
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <Button
      variant="default"
      onClick={handleApprove}
      disabled={disabled || isApproving}
    >
      <CheckCircle className="mr-2 h-4 w-4" />
      {isApproving ? "Đang xử lý..." : "Phê duyệt & Tạo dự án"}
    </Button>
  );
}
