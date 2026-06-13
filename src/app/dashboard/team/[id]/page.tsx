import { redirect } from "next/navigation";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Mail, Calendar, Award, Clock, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
} from "@/lib/rbac";
import { getMemberSkills, getMemberAvailability, getTeamActivity } from "../actions";
import { MemberSkills } from "./member-skills";
import { MemberAvailability } from "./member-availability";
import { MemberContributions } from "./member-contributions";

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = parseRole(profile?.role);
  const ctx = createAuthenticatedContext(role, user.id);

  if (!hasPermission(ctx, "team.view")) {
    redirect("/dashboard/team");
  }

  const canManageSkills = hasPermission(ctx, "team.skills.manage");
  const canManageAvailability = hasPermission(ctx, "team.availability.manage");

  const { id: memberId } = await params;

  const [member, skills, availability, activity] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, role, avatar_url, created_at")
      .eq("id", memberId)
      .single(),
    getMemberSkills(memberId),
    getMemberAvailability(memberId),
    getTeamActivity(20),
  ]);

  if (!member.data) {
    redirect("/dashboard/team");
  }

  const isOwner = member.data.id === user.id;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/team">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {member.data.full_name || member.data.email}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="capitalize">
              {member.data.role}
            </Badge>
          </div>
        </div>
      </div>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={member.data.avatar_url ?? undefined} />
              <AvatarFallback className="text-xl">
                {member.data.full_name?.charAt(0) || member.data.email.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <CardTitle className="text-xl">{member.data.full_name || member.data.email}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  <span>{member.data.email}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {new Date(member.data.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="skills" className="space-y-6">
        <TabsList>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="contributions">Contributions</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="skills" className="space-y-6">
          <MemberSkills
            profileId={memberId}
            skills={skills}
            canManage={canManageSkills || isOwner}
          />
        </TabsContent>

        <TabsContent value="availability" className="space-y-6">
          <MemberAvailability
            profileId={memberId}
            availability={availability}
            canManage={canManageAvailability || isOwner}
          />
        </TabsContent>

        <TabsContent value="contributions" className="space-y-6">
          <MemberContributions profileId={memberId} />
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest activities from this team member
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activity
                  .filter((a: any) => a.profile_id === memberId)
                  .map((item: any) => (
                    <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={item.profile?.avatar_url ?? undefined} />
                        <AvatarFallback>
                          {item.profile?.full_name?.charAt(0) || item.profile?.email.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">
                            {item.profile?.full_name || item.profile?.email}
                          </span>
                          <Badge variant="outline" className="capitalize text-xs">
                            {item.activity_type.replace("_", " ")}
                          </Badge>
                        </div>
                        {item.activity_description && (
                          <p className="text-sm text-muted-foreground">
                            {item.activity_description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(item.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                {activity.filter((a: any) => a.profile_id === memberId).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No recent activity found.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
