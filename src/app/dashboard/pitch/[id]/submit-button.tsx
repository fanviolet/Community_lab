"use client";

import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { submitPitch } from "../actions";
import { toast } from "sonner";

interface SubmitButtonProps {
  pitchId: string;
}

export function SubmitButton({ pitchId }: SubmitButtonProps) {
  const handleSubmit = async () => {
    try {
      await submitPitch(pitchId);
      toast.success("Đề xuất của bạn đã được gửi xét duyệt.");
    } catch (error) {
      console.error("Error submitting pitch:", error);
      toast.error("Không thể gửi đề xuất", {
        description: error instanceof Error ? error.message : "Đã xảy ra lỗi",
      });
    }
  };

  return (
    <Button onClick={handleSubmit}>
      <Send className="mr-2 h-4 w-4" />
      Submit
    </Button>
  );
}
