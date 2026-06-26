import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, ThumbsUp, Eye } from "lucide-react";
import Link from "next/link";

interface ProposalCardProps {
  id: string;
  title: string;
  status: string;
  author: string;
  date: string;
  voteCount: number;
  aiScore: number;
}

export function ProposalCard({
  id,
  title,
  status,
  author,
  date,
  voteCount,
  aiScore,
}: ProposalCardProps) {
  const statusColors: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700",
    submitted: "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-rose-100 text-rose-700",
  };

  const statusLabels: Record<string, string> = {
    draft: "Bản nháp",
    submitted: "Đã gửi",
    approved: "Đã duyệt",
    rejected: "Bị từ chối",
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-600";
    return "text-rose-600";
  };

  return (
    <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 text-base font-semibold">
            {title}
          </CardTitle>
          <Badge className={statusColors[status] || statusColors.draft}>
            {statusLabels[status] || status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Bởi {author}</span>
          <span>{new Date(date).toLocaleDateString()}</span>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <ThumbsUp className="size-4 text-muted-foreground" />
            <span className="font-medium">{voteCount} lượt bình chọn</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`font-semibold ${getScoreColor(aiScore)}`}>
              Điểm AI: {aiScore}%
            </span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Link href={`/dashboard/pitch/${id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <Eye className="mr-2 size-4" />
              Xem
            </Button>
          </Link>
          <Button size="sm" className="flex-1">
            Bình chọn
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
