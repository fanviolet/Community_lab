"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, User } from "lucide-react";
import type { MentoringSessionWithCreator } from "@/types/mentoring";

interface SessionListProps {
  sessions: MentoringSessionWithCreator[];
}

export function SessionList({ sessions }: SessionListProps) {
  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <Card key={session.id} className="border-0 bg-muted/30">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-base">{session.topic}</CardTitle>
              <Badge variant="outline" className="text-xs">
                {new Date(session.session_date).toLocaleDateString()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {new Date(session.session_date).toLocaleString()}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              {session.created_by_user?.display_name || session.created_by_user?.email}
            </div>
            {session.notes && (
              <p className="text-sm text-muted-foreground mt-2">{session.notes}</p>
            )}
            {session.action_items && session.action_items.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium mb-1">Hạng mục hành động:</p>
                <ul className="text-xs text-muted-foreground list-disc list-inside">
                  {session.action_items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
