import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, UserX, FileText } from "lucide-react";

interface Alert {
  id: string;
  type: "overdue_task" | "no_leader" | "deadline_near" | "missing_ai";
  message: string;
  severity: "high" | "medium" | "low";
  link?: string;
}

interface AlertCenterProps {
  alerts: Alert[];
}

export function AlertCenter({ alerts }: AlertCenterProps) {
  const alertConfig: Record<
    Alert["type"],
    { icon: typeof AlertTriangle; color: string; label: string }
  > = {
    overdue_task: {
      icon: Clock,
      color: "text-rose-600 bg-rose-100",
      label: "Overdue",
    },
    no_leader: {
      icon: UserX,
      color: "text-amber-600 bg-amber-100",
      label: "No Leader",
    },
    deadline_near: {
      icon: Clock,
      color: "text-amber-600 bg-amber-100",
      label: "Deadline",
    },
    missing_ai: {
      icon: FileText,
      color: "text-blue-600 bg-blue-100",
      label: "Missing AI",
    },
  };

  const severityColors: Record<string, string> = {
    high: "border-l-rose-500",
    medium: "border-l-amber-500",
    low: "border-l-blue-500",
  };

  if (alerts.length === 0) {
    return (
      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Early Warning Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100">
              <FileText className="size-6 text-emerald-600" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              No alerts at this time. Everything is running smoothly!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Early Warning Panel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => {
            const config = alertConfig[alert.type];
            const Icon = config.icon;
            
            return (
              <div
                key={alert.id}
                className={`flex items-start gap-3 rounded-lg border-l-4 border-border/50 bg-muted/30 p-3 transition-colors hover:bg-muted/50 ${severityColors[alert.severity]}`}
              >
                <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${config.color}`}>
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {config.label}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        alert.severity === "high"
                          ? "text-rose-600 border-rose-200"
                          : alert.severity === "medium"
                          ? "text-amber-600 border-amber-200"
                          : "text-blue-600 border-blue-200"
                      }`}
                    >
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground">{alert.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
