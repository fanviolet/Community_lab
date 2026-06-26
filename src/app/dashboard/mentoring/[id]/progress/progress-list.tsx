"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Clock, Circle } from "lucide-react";
import type { MentoringProgressWithAssignee } from "@/types/mentoring";

interface ProgressListProps {
  progress: MentoringProgressWithAssignee[];
}

const STATUS_CONFIG = {
  open: { icon: Circle, color: "text-blue-600", bg: "bg-blue-100" },
  in_progress: { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-100" },
  resolved: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
  blocked: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100" },
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "secondary",
  medium: "default",
  high: "outline",
  critical: "destructive",
};

export function ProgressList({ progress }: ProgressListProps) {
  return (
    <div className="space-y-4">
      {progress.map((item) => {
        const config = STATUS_CONFIG[item.status];
        const StatusIcon = config.icon;

        return (
          <Card key={item.id} className="border-0 bg-muted/30">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${config.bg}`}>
                    <StatusIcon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{item.issue}</CardTitle>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant={PRIORITY_COLORS[item.priority] as any} className="capitalize">
                    {item.priority}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {item.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {item.assigned_to_user && (
                  <span>Assigned: {item.assigned_to_user.display_name}</span>
                )}
                {item.due_date && (
                  <span>Due: {new Date(item.due_date).toLocaleDateString()}</span>
                )}
              </div>
              {item.resolved_at && (
                <div className="text-xs text-green-600">
                  Resolved: {new Date(item.resolved_at).toLocaleDateString()}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
