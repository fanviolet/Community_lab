"use client";

import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePathname } from "next/navigation";

interface GuideStep {
  title: string;
  content: string;
  targetSelector?: string; // CSS selector for highlighting element
}

interface GuideConfig {
  [key: string]: GuideStep[];
}

const guideConfigs: GuideConfig = {
  "/dashboard/groups/archive": [
    {
      title: "Kho lưu trữ cộng đồng",
      content: "Đây là nơi lưu trữ các cộng đồng đã được lưu trữ. Bạn có thể xem danh sách và truy cập các cộng đồng đã lưu trữ tại đây.",
    },
    {
      title: "Xem thông tin cộng đồng",
      content: "Mỗi thẻ hiển thị tên, mô tả, số lượng thành viên và dự án của cộng đồng đã lưu trữ.",
    },
    {
      title: "Truy cập cộng đồng",
      content: "Nhấn vào nút 'Xem cộng đồng' để truy cập chi tiết và xem nội dung của cộng đồng đã lưu trữ.",
    },
    {
      title: "Quay lại danh sách",
      content: "Sử dụng nút 'Quay lại danh sách cộng đồng' để trở về trang danh sách cộng đồng hoạt động.",
    },
  ],
  "/dashboard/groups": [
    {
      title: "Danh sách cộng đồng",
      content: "Tại đây bạn có thể xem tất cả các cộng đồng mà bạn đã tham gia và khám phá các cộng đồng công khai mới.",
    },
    {
      title: "My Groups",
      content: "Phần này hiển thị các cộng đồng mà bạn đang là thành viên. Nhấn vào để truy cập.",
    },
    {
      title: "Discover Groups",
      content: "Khám phá các cộng đồng công khai mới và gửi yêu cầu tham gia.",
    },
    {
      title: "Tạo cộng đồng mới",
      content: "Nhấn nút tạo cộng đồng để bắt đầu cộng đồng của riêng bạn.",
    },
  ],
  "/dashboard/groups/[id]": [
    {
      title: "Chi tiết cộng đồng",
      content: "Xem thông tin chi tiết về cộng đồng, bao gồm thống kê dự án, vấn đề và thành viên.",
    },
    {
      title: "Tham gia cộng đồng",
      content: "Nếu chưa là thành viên, bạn có thể gửi yêu cầu tham gia tại đây.",
    },
    {
      title: "Quản lý cộng đồng",
      content: "Nếu là Leader, bạn có thể chỉnh sửa thông tin, quản lý thành viên và lưu trữ cộng đồng.",
    },
  ],
  "/dashboard": [
    {
      title: "Bảng điều khiển",
      content: "Tổng quan về hoạt động và thống kê của bạn trong hệ thống CPL.",
    },
    {
      title: "Truy cập nhanh",
      content: "Sử dụng sidebar để điều hướng nhanh đến các chức năng chính.",
    },
  ],
};

export function UserGuide() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenGuide, setHasSeenGuide] = useState(false);

  // Match pathname to guide config
  const getGuideSteps = (): GuideStep[] => {
    // Try exact match first
    if (guideConfigs[pathname]) {
      return guideConfigs[pathname];
    }

    // Try pattern matching for dynamic routes
    for (const [key, steps] of Object.entries(guideConfigs)) {
      if (key.includes("[id]") && pathname.match(/\/groups\/[^/]+$/)) {
        return steps;
      }
    }

    return [];
  };

  const steps = getGuideSteps();

  useEffect(() => {
    // Check if user has seen guide for this page
    const storageKey = `guide_seen_${pathname}`;
    const seen = localStorage.getItem(storageKey);
    setHasSeenGuide(!!seen);

    // Show guide automatically on first visit
    if (!seen && steps.length > 0) {
      setTimeout(() => setIsOpen(true), 1000);
    }
  }, [pathname, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setCurrentStep(0);
    localStorage.setItem(`guide_seen_${pathname}`, "true");
    setHasSeenGuide(true);
  };

  const handleReset = () => {
    localStorage.removeItem(`guide_seen_${pathname}`);
    setHasSeenGuide(false);
    setCurrentStep(0);
    setIsOpen(true);
  };

  if (steps.length === 0) {
    return null;
  }

  const currentStepData = steps[currentStep];

  return (
    <>
      {/* Guide Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 size-12 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
        title={hasSeenGuide ? "Xem lại hướng dẫn" : "Hướng dẫn"}
      >
        <HelpCircle className="size-5" />
      </Button>

      {/* Guide Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg">
                {currentStepData.title}
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="size-6"
              >
                <X className="size-4" />
              </Button>
            </div>
            <DialogDescription className="text-base mt-2">
              {currentStepData.content}
            </DialogDescription>
          </DialogHeader>

          {/* Progress indicator */}
          <div className="flex items-center gap-2 mt-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  index === currentStep
                    ? "bg-primary"
                    : index < currentStep
                    ? "bg-primary/50"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="size-4 mr-1" />
                Quay lại
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
              >
                {currentStep === steps.length - 1 ? "Hoàn tất" : "Tiếp"}
                {currentStep < steps.length - 1 && (
                  <ChevronRight className="size-4 ml-1" />
                )}
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
            >
              Bỏ qua
            </Button>
          </div>

          {/* Step counter */}
          <div className="text-center text-sm text-muted-foreground mt-2">
            Bước {currentStep + 1} / {steps.length}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
