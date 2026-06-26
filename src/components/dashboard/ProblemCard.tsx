import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ThumbsUp, Clock, Sparkles } from "lucide-react";
import Link from "next/link";

interface ProblemCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  voteCount: number;
  commentCount: number;
  aiAnalysisStatus: "analyzed" | "pending" | "none";
  createdAt: string;
  compact?: boolean;
}

export function ProblemCard({
  id,
  title,
  description,
  category,
  voteCount,
  commentCount,
  aiAnalysisStatus,
  createdAt,
  compact = false,
}: ProblemCardProps) {
  const categoryColors: Record<string, string> = {
    Education: "bg-blue-100 text-blue-700",
    Environment: "bg-emerald-100 text-emerald-700",
    Community: "bg-violet-100 text-violet-700",
    Health: "bg-rose-100 text-rose-700",
    Technology: "bg-amber-100 text-amber-700",
  };

  const aiStatusColors: Record<string, string> = {
    analyzed: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    none: "bg-slate-100 text-slate-700",
  };

  const categoryLabels: Record<string, string> = {
    Education: "Giáo dục",
    Environment: "Môi trường",
    Community: "Cộng đồng",
    Health: "Sức khỏe",
    Technology: "Công nghệ",
  };

  const aiStatusLabels: Record<string, string> = {
    analyzed: "Đã phân tích",
    pending: "Đang chờ",
    none: "Chưa có",
  };

  if (compact) {
    return (
      <Link href={`/dashboard/problems/${id}`}>
        <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-white p-4 transition-colors hover:bg-muted/50">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={categoryColors[category] || categoryColors.Community} variant="secondary">
                {categoryLabels[category] || category}
              </Badge>
              <Badge className={aiStatusColors[aiAnalysisStatus]} variant="secondary">
                <Sparkles className="mr-1 size-3" />
                {aiStatusLabels[aiAnalysisStatus] || aiAnalysisStatus}
              </Badge>
            </div>
            <h3 className="text-sm font-semibold text-foreground truncate">{title}</h3>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <ThumbsUp className="size-3.5" />
              <span>{voteCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageSquare className="size-3.5" />
              <span>{commentCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5" />
              <span>{new Date(createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/dashboard/problems/${id}`}>
      <Card className="h-full border-0 bg-white shadow-sm ring-1 ring-black/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <Badge className={categoryColors[category] || categoryColors.Community}>
              {categoryLabels[category] || category}
            </Badge>
            <Badge className={aiStatusColors[aiAnalysisStatus]} variant="secondary">
              <Sparkles className="mr-1 size-3" />
              {aiStatusLabels[aiAnalysisStatus] || aiAnalysisStatus}
            </Badge>
          </div>
          <CardTitle className="line-clamp-2 text-base font-semibold pt-2">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <ThumbsUp className="size-3.5" />
              <span>{voteCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageSquare className="size-3.5" />
              <span>{commentCount}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5" />
              <span>{new Date(createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
