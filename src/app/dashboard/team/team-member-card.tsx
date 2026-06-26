import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, Mail, Calendar, MoreVertical } from "lucide-react";
import { RoleBadge } from "@/components/common/role-badge";
import type { TeamMember } from "@/types/team-management";

interface TeamMemberCardProps {
  member: TeamMember;
  canChangeRole: boolean;
  canRemove: boolean;
}

export function TeamMemberCard({ member, canChangeRole, canRemove }: TeamMemberCardProps) {
  return (
    <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={member.avatar_url ?? undefined} />
              <AvatarFallback>
                {member.display_name?.charAt(0) || member.email.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{member.display_name || member.email}</CardTitle>
              <RoleBadge role={member.role} className="text-xs mt-1" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="truncate">{member.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Tham gia {new Date(member.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {member.skills && member.skills.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-2">Kỹ năng</p>
            <div className="flex flex-wrap gap-1">
              {member.skills.slice(0, 3).map((skill) => (
                <Badge key={skill.id} variant="outline" className="text-xs">
                  {skill.skill_name}
                </Badge>
              ))}
              {member.skills.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{member.skills.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/dashboard/team/${member.id}`}>
              <Eye className="mr-2 h-3 w-3" />
              View
            </Link>
          </Button>
          {(canChangeRole || canRemove) && (
            <Button variant="outline" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
