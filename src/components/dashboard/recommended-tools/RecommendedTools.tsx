"use client";

import { Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRecommendedTools } from "./hooks/useRecommendedTools";
import { Carousel } from "./Carousel";

export function RecommendedTools() {
  const { tools, isLoading, error } = useRecommendedTools();

  return (
    <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="size-4 text-amber-500" />
          ✨ AI & Tools For You
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-4 w-2/3 rounded bg-muted" />
            <div className="h-4 w-1/2 rounded bg-muted" />
            <div className="h-9 w-24 rounded bg-muted" />
          </div>
        ) : error ? (
          <p className="text-sm text-muted-foreground">{error}</p>
        ) : tools.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Chưa có gợi ý nào. Vui lòng quay lại sau.
          </p>
        ) : (
          <Carousel tools={tools} />
        )}
      </CardContent>
    </Card>
  );
}
