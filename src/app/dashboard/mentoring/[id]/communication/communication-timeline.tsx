"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MentorCommunicationWithUser } from "@/types/mentoring";

interface CommunicationTimelineProps {
  communications: MentorCommunicationWithUser[];
  currentUserId: string;
}

const TYPE_COLORS: Record<string, string> = {
  message: "default",
  note: "secondary",
  update: "outline",
  feedback: "approved",
};

export function CommunicationTimeline({ communications, currentUserId }: CommunicationTimelineProps) {
  return (
    <div className="space-y-4">
      {communications.map((comm) => (
        <div key={comm.id} className="flex gap-4">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={comm.from_user?.avatar_url ?? undefined} />
            <AvatarFallback>
              {comm.from_user?.display_name?.charAt(0).toUpperCase() ?? comm.from_user?.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Card className={`border-0 ${comm.from_user_id === currentUserId ? "bg-blue-50 ml-8" : "bg-muted/30 mr-8"}`}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {comm.from_user?.display_name || comm.from_user?.email}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant={TYPE_COLORS[comm.communication_type] as any} className="text-xs capitalize">
                      {comm.communication_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comm.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                <p className="text-sm">{comm.message}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      ))}
    </div>
  );
}
