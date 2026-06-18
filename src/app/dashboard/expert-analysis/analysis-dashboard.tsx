"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Edit, Eye } from "lucide-react";
import type { ExpertAnalysisWithRelations } from "@/types/expert-analysis";

interface AnalysisDashboardProps {
  analyses: ExpertAnalysisWithRelations[];
  canCreate: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "secondary",
  submitted: "default",
  reviewed: "outline",
  published: "approved",
  archived: "muted",
};

const TYPE_LABELS: Record<string, string> = {
  problem: "Problem",
  project: "Project",
  proposal: "Proposal",
  trend: "Trend",
};

export function AnalysisDashboard({ analyses, canCreate }: AnalysisDashboardProps) {
  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa phân tích này?")) {
      return;
    }

    try {
      const response = await fetch(`/api/expert-analysis/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Không thể xóa phân tích");
      }

      window.location.reload();
    } catch (error) {
      console.error("Failed to delete analysis:", error);
      alert("Không thể xóa phân tích.");
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {analyses.map((analysis) => (
        <Card key={analysis.id} className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg line-clamp-2">{analysis.title}</CardTitle>
                <CardDescription className="mt-1">
                  {analysis.author?.full_name || "Unknown"}
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/expert-analysis/${analysis.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Xem
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/expert-analysis/${analysis.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Chỉnh sửa
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDelete(analysis.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Xóa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {TYPE_LABELS[analysis.analysis_type] || analysis.analysis_type}
                </Badge>
                <Badge variant={STATUS_COLORS[analysis.status] as any} className="capitalize">
                  {analysis.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {analysis.summary}
              </p>
              {analysis.scorecard && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Điểm: {analysis.scorecard.overall_score.toFixed(1)}/10</span>
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                {new Date(analysis.created_at).toLocaleDateString()}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
