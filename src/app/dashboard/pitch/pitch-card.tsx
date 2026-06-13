import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkles, Clock, Edit, Eye, Trash2 } from "lucide-react";
import type { PitchWithRelations } from "@/types/pitch-management";

interface PitchCardProps {
  pitch: PitchWithRelations;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "secondary",
  submitted: "default",
  under_review: "outline",
  revision_required: "revise",
  approved: "approved",
  rejected: "rejected",
};

export function PitchCard({ pitch }: PitchCardProps) {
  return (
    <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base line-clamp-2">{pitch.title}</CardTitle>
          <Badge variant={STATUS_COLORS[pitch.status] as any} className="capitalize text-xs">
            {pitch.status.replace("_", " ")}
          </Badge>
        </div>
        {pitch.problem && (
          <p className="text-xs text-muted-foreground">
            Problem: {pitch.problem.title}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {pitch.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {pitch.description}
          </p>
        )}

        <div className="flex items-center gap-2">
          {pitch.ai_score && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              <span>AI Score: {pitch.ai_score.toFixed(1)}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>
              {new Date(pitch.updated_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pitch.creator && (
            <Avatar className="h-6 w-6">
              <AvatarImage src={pitch.creator.avatar_url ?? undefined} />
              <AvatarFallback className="text-xs">
                {pitch.creator.full_name?.charAt(0) || pitch.creator.email.charAt(0)}
              </AvatarFallback>
            </Avatar>
          )}
          <span className="text-xs text-muted-foreground">
            {pitch.creator?.full_name || pitch.creator?.email}
          </span>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/dashboard/pitch/${pitch.id}`}>
              <Eye className="mr-2 h-3 w-3" />
              View
            </Link>
          </Button>
          {pitch.status === "draft" && (
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href={`/dashboard/pitch/${pitch.id}/edit`}>
                <Edit className="mr-2 h-3 w-3" />
                Edit
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
