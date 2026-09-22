"use client";

import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function HelpButton() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="size-5">
            <HelpCircle className="size-4 text-muted-foreground" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <p className="font-medium">Kho lưu trữ dự án</p>
            <p className="text-sm">Mục này hiển thị các dự án đã lưu trữ của cộng đồng.</p>
            <p className="text-sm">• Nhấn vào dự án để xem chi tiết</p>
            <p className="text-sm">• Sử dụng nút "Quay lại" để trở về danh sách dự án</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
