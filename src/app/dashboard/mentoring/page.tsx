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
import { Users, MessageSquare, CheckCircle, TrendingUp, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
} from "@/lib/rbac";
import { getMentorProfiles, getMentorshipRequests } from "./actions";

export default async function MentoringPage() {
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

  if (!hasPermission(ctx, "mentor.view")) {
    redirect("/dashboard");
  }

  const canCreateRequest = hasPermission(ctx, "mentorship.request.create");
  const canCreateProfile = hasPermission(ctx, "mentor.profile.create");

  const [mentors, requests] = await Promise.all([
    getMentorProfiles(),
    getMentorshipRequests({ requested_by: user.id }),
  ]);

  const pendingRequests = requests.filter((r) => r.status === "pending").length;
  const activeRequests = requests.filter((r) => r.status === "accepted").length;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bảng điều khiển Cố vấn</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kết nối với cố vấn và quản lý chương trình quan hệ cố vấn.
          </p>
        </div>
        {canCreateRequest && (
          <Button asChild>
            <Link href="/dashboard/mentoring/request">
              <Plus className="mr-2 h-4 w-4" />
              Yêu cầu Quan hệ cố vấn
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cố vấn có sẵn</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mentors.length}</div>
            <p className="text-xs text-muted-foreground">
              Sẵn sàng hỗ trợ
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yêu cầu đang chờ</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              Đang chờ phản hồi
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quan hệ cố vấn đang hoạt động</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRequests}</div>
            <p className="text-xs text-muted-foreground">
              Đang thực hiện
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hồ sơ của bạn</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {canCreateProfile ? "Setup" : "Complete"}
            </div>
            <p className="text-xs text-muted-foreground">
              Trạng thái cố vấn
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Danh bạ Cố vấn</CardTitle>
            <CardDescription>
              Tìm kiếm cố vấn có sẵn và chuyên môn của họ.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/mentoring/directory">
                <Users className="mr-2 h-4 w-4" />
                Xem tất cả Cố vấn
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Quan hệ cố vấn của bạn</CardTitle>
            <CardDescription>
              Quản lý yêu cầu và buổi quan hệ cố vấn của bạn.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline">
              <Link href="/dashboard/mentoring/my-mentorships">
                <MessageSquare className="mr-2 h-4 w-4" />
                Xem Quan hệ cố vấn
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {canCreateProfile && (
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Trở thành Cố vấn</CardTitle>
            <CardDescription>
              Chia sẻ chuyên môn và giúp đỡ thế hệ đổi mới tiếp theo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/mentoring/profile">
                <Plus className="mr-2 h-4 w-4" />
                Tạo hồ sơ Cố vấn
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
