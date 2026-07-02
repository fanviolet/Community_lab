"use client";

import { cn } from "@/lib/utils";

interface DotIndicatorProps {
  count: number;
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function DotIndicator({ count, activeIndex, onSelect }: DotIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onSelect(index)}
          className={cn(
            "h-2 w-2 rounded-full transition-all",
            activeIndex === index ? "bg-primary" : "bg-muted-foreground/30",
          )}
          aria-label={`Go to recommendation ${index + 1}`}
        />
      ))}
    </div>
  );
}
