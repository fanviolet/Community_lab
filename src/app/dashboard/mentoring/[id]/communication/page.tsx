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
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, MessageSquare, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
} from "@/lib/rbac";
import { getMentorshipRequestById, getMentorCommunications, createMentorCommunication } from "../../actions";
import { CommunicationTimeline } from "./communication-timeline";

export default async function MentoringCommunicationPage({
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

  if (!hasPermission(ctx, "mentoring.communication.create")) {
    redirect("/dashboard/mentoring");
  }

  const { id: mentorshipId } = await params;

  const [mentorship, communications] = await Promise.all([
    getMentorshipRequestById(mentorshipId),
    getMentorCommunications(mentorshipId),
  ]);

  if (!mentorship) {
    redirect("/dashboard/mentoring/my-mentorships");
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/mentoring/my-mentorships">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Giao tiếp</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mentorship.mentor?.display_name} · {mentorship.project?.title}
          </p>
        </div>
      </div>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Gửi tin nhắn</CardTitle>
          <CardDescription>
            Giao tiếp với cố vấn của bạn về dự án.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={async (formData) => {
            "use server";
            const message = formData.get("message") as string;

            await createMentorCommunication({
              mentorship_request_id: mentorshipId,
              message,
            });
          }} className="space-y-4">
            <Textarea
              name="message"
              required
              rows={3}
              placeholder="Nhập tin nhắn của bạn tại đây..."
            />
            <Button type="submit">
              <Send className="mr-2 h-4 w-4" />
              Gửi tin nhắn
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Dòng thời gian Giao tiếp</CardTitle>
          <CardDescription>
            Tất cả tin nhắn và cập nhật cho quan hệ cố vấn này.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {communications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground text-center">
                Chưa có tin nhắn nào. Bắt đầu cuộc trò chuyện!
              </p>
            </div>
          ) : (
            <CommunicationTimeline communications={communications} currentUserId={user.id} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
