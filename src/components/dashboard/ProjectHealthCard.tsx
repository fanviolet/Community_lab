import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle2, AlertTriangle, TrendingDown } from "lucide-react";
import Link from "next/link";

interface HealthIndicator {
  type: "missing_leader" | "overdue_tasks" | "stalled_progress";
  label: string;
  icon: typeof AlertTriangle;
  color: string;
}

interface ProjectHealthCardProps {
  id: string;
  title: string;
  status: string;
  progress: number;
  memberCount: number;
  taskCount: number;
  healthIndicators: HealthIndicator[];
}

export function ProjectHealthCard({
  id,
  title,
  status,
  progress,
  memberCount,
  taskCount,
  healthIndicators,
}: ProjectHealthCardProps) {
  const statusColors: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    planning: "bg-blue-100 text-blue-700",
    completed: "bg-slate-100 text-slate-700",
    on_hold: "bg-amber-100 text-amber-700",
  };

  const statusLabels: Record<string, string> = {
    active: "Đang hoạt động",
    planning: "Lập kế hoạch",
    completed: "Hoàn thành",
    on_hold: "Tạm dừng",
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "bg-emerald-500";
    if (progress >= 50) return "bg-blue-500";
    if (progress >= 25) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <Link href={`/dashboard/workspace/${id}`}>
      <Card className="h-full border-0 bg-white shadow-sm ring-1 ring-black/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-2 text-base font-semibold">{title}</CardTitle>
            <Badge className={statusColors[status] || statusColors.planning}>
              {statusLabels[status] || status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Tiến độ</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getProgressColor(progress)}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Users className="size-3.5" />
              <span>{memberCount} thành viên</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5" />
              <span>{taskCount} nhiệm vụ</span>
            </div>
          </div>

          {healthIndicators.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/50">
              {healthIndicators.map((indicator) => (
                <div key={indicator.type} className="flex items-center gap-2 text-xs">
                  <indicator.icon className={`size-3.5 ${indicator.color}`} />
                  <span className="text-muted-foreground">{indicator.label}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
