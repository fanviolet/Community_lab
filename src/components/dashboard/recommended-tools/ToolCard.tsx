"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RecommendedTool } from "@/types/recommended-tools";
import { getToolRedirectUrl } from "./lib/redirect";
import { cn } from "@/lib/utils";

const CATEGORY_STYLES: Record<string, string> = {
  AI: "bg-purple-100 text-purple-700",
  Development: "bg-blue-100 text-blue-700",
  Hosting: "bg-emerald-100 text-emerald-700",
  Deployment: "bg-cyan-100 text-cyan-700",
  Database: "bg-slate-100 text-slate-700",
  Design: "bg-pink-100 text-pink-700",
  Productivity: "bg-amber-100 text-amber-700",
  Learning: "bg-indigo-100 text-indigo-700",
};

function getLabels(tool: RecommendedTool) {
  const labels: string[] = [];

  if (tool.is_sponsored) labels.push("Sponsored");
  if (tool.priority >= 85) labels.push("Recommended");
  if (tool.click_count >= 1000) labels.push("Popular");

  const createdAt = new Date(tool.created_at);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  if (createdAt >= thirtyDaysAgo) labels.push("New");

  return labels.slice(0, 2);
}

export function ToolCard({ tool }: { tool: RecommendedTool }) {
  const labels = getLabels(tool);

  const categoryStyle =
    CATEGORY_STYLES[tool.category] ?? "bg-muted text-muted-foreground";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/30">
          {tool.logo_url ? (
            <Image
              src={tool.logo_url}
              alt={tool.name}
              width={32}
              height={32}
              className="size-8 rounded-lg object-contain"
            />
          ) : (
            <div className="text-xs font-semibold text-muted-foreground">
              {tool.name.slice(0, 2)}
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">
              {tool.name}
            </h3>
            <Badge className={cn("text-[11px]", categoryStyle)}>
              {tool.category}
            </Badge>
            {labels.map((label) => (
              <Badge key={label} variant="outline" className="text-[11px]">
                {label}
              </Badge>
            ))}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {tool.description}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {tool.is_sponsored && tool.sponsor_name
            ? `Partner: ${tool.sponsor_name}`
            : ""}
        </div>
        <Button asChild size="sm" className="h-9 px-4">
          <Link href={getToolRedirectUrl(tool.slug)}>
            Try Now
            <span className="ml-1">→</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
