"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CarouselControlsProps {
  onPrev: () => void;
  onNext: () => void;
  disabled?: boolean;
}

export function CarouselControls({ onPrev, onNext, disabled }: CarouselControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={onPrev}
        disabled={disabled}
        aria-label="Previous recommendation"
      >
        <ChevronLeft className="size-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={onNext}
        disabled={disabled}
        aria-label="Next recommendation"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
