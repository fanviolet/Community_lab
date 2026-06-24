import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardKPICardProps {
  label: string;
  value: number;
  change: string;
  icon: LucideIcon;
  color: string;
  trend?: "up" | "down" | "neutral";
}

export function DashboardKPICard({
  label,
  value,
  change,
  icon: Icon,
  color,
  trend = "neutral",
}: DashboardKPICardProps) {
  const trendColor = trend === "up" ? "text-emerald-600" : trend === "down" ? "text-rose-600" : "text-muted-foreground";

  return (
    <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <CardTitle className="mt-1 text-3xl font-bold tabular-nums text-foreground">
            {value}
          </CardTitle>
        </div>
        <div className={`flex size-10 items-center justify-center rounded-xl ${color}`}>
          <Icon className="size-5" />
        </div>
      </CardHeader>
      <CardContent>
        <p className={`text-xs ${trendColor}`}>{change}</p>
      </CardContent>
    </Card>
  );
}
