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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Calendar, MessageSquare, CheckCircle, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
} from "@/lib/rbac";
import { getMentorshipRequests } from "../actions";

export default async function MyMentorshipsPage() {
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

  if (!hasPermission(ctx, "mentorship.request.view.own")) {
    redirect("/dashboard/mentoring");
  }

  const requests = await getMentorshipRequests({ requested_by: user.id });

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/mentoring">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quan hệ cố vấn của tôi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý yêu cầu và buổi quan hệ cố vấn của bạn.
          </p>
        </div>
      </div>

      {requests.length === 0 ? (
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Chưa có quan hệ cố vấn</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Yêu cầu quan hệ cố vấn để bắt đầu nhận hướng dẫn từ các chuyên gia.
            </p>
            <Button asChild>
              <Link href="/dashboard/mentoring/request">
                Yêu cầu Quan hệ cố vấn
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {requests.map((request) => (
            <Card key={request.id} className="border-0 bg-white shadow-sm ring-1 ring-black/5">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={request.mentor?.avatar_url ?? undefined} />
                      <AvatarFallback>
                        {request.mentor?.full_name?.charAt(0).toUpperCase() ?? request.mentor?.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{request.mentor?.full_name || "Ẩn danh"}</CardTitle>
                      <CardDescription>
                        {request.project?.title || "Dự án không xác định"}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={
                      request.status === "accepted"
                        ? "approved"
                        : request.status === "pending"
                        ? "secondary"
                        : request.status === "declined"
                        ? "rejected"
                        : "outline"
                    }
                    className="capitalize"
                  >
                    {request.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Khó khăn</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {request.challenge_description}
                  </p>
                </div>

                {request.expected_outcome && (
                  <div>
                    <p className="text-sm font-medium mb-1">Kết quả mong đợi</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {request.expected_outcome}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(request.created_at).toLocaleDateString()}
                  </span>
                </div>

                {request.status === "accepted" && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/mentoring/${request.id}/sessions`}>
                        <Calendar className="mr-2 h-4 w-4" />
                        Buổi cố vấn
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/mentoring/${request.id}/progress`}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Tiến độ
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/mentoring/${request.id}/communication`}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Tin nhắn
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
