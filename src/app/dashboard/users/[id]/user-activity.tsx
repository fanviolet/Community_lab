"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Clock } from "lucide-react";

interface UserActivityProps {
  activity: any[];
}

export function UserActivity({ activity }: UserActivityProps) {
  return (
    <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>
          Track user actions and system events
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No activity recorded yet.
          </p>
        ) : (
          <div className="space-y-4">
            {activity.map((log) => (
              <div key={log.id} className="flex items-start gap-4 p-3 bg-muted/30 rounded-lg">
                <Clock className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium capitalize">
                      {log.action.replace("_", " ")}
                    </span>
                    {log.entity_type && (
                      <Badge variant="outline" className="text-xs">
                        {log.entity_type}
                      </Badge>
                    )}
                  </div>
                  {log.entity_id && (
                    <p className="text-xs text-muted-foreground">
                      Entity: {log.entity_id}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(log.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
