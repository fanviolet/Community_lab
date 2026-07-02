"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { RecommendedTool } from "@/types/recommended-tools";
import { ToolCard } from "./ToolCard";
import { CarouselControls } from "./CarouselControls";
import { DotIndicator } from "./DotIndicator";
import { preloadLogo, trackImpressionOnce } from "./lib/tracking";

const AUTO_SLIDE_MS = 8000;

interface CarouselProps {
  tools: RecommendedTool[];
}

export function Carousel({ tools }: CarouselProps) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const toolCount = tools.length;
  const hasMultiple = toolCount > 1;

  const safeIndex = useMemo(() => {
    if (toolCount === 0) return 0;
    return Math.min(index, toolCount - 1);
  }, [index, toolCount]);

  const goNext = useCallback(() => {
    if (!hasMultiple) return;
    setIndex((prev) => (prev + 1) % toolCount);
  }, [hasMultiple, toolCount]);

  const goPrev = useCallback(() => {
    if (!hasMultiple) return;
    setIndex((prev) => (prev - 1 + toolCount) % toolCount);
  }, [hasMultiple, toolCount]);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.4 },
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || toolCount === 0) return;
    const current = tools[safeIndex];
    if (!current) return;
    trackImpressionOnce(current.slug);
  }, [isVisible, safeIndex, toolCount, tools]);

  useEffect(() => {
    if (!hasMultiple) return;
    const nextIndex = (safeIndex + 1) % toolCount;
    preloadLogo(tools[nextIndex]?.logo_url);
  }, [hasMultiple, safeIndex, toolCount, tools]);

  useEffect(() => {
    if (!hasMultiple || isPaused) return;
    const timer = setInterval(goNext, AUTO_SLIDE_MS);
    return () => clearInterval(timer);
  }, [goNext, hasMultiple, isPaused]);

  useEffect(() => {
    if (index !== safeIndex) {
      setIndex(safeIndex);
    }
  }, [index, safeIndex]);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="space-y-4"
    >
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${safeIndex * 100}%)` }}
        >
          {tools.map((tool) => (
            <div key={tool.id} className="w-full shrink-0">
              <ToolCard tool={tool} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <DotIndicator count={toolCount} activeIndex={safeIndex} onSelect={setIndex} />
        <CarouselControls onPrev={goPrev} onNext={goNext} disabled={!hasMultiple} />
      </div>
    </div>
  );
}
