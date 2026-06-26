import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function ValidationReportPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  // Get pitch counts
  const [
    { count: totalPitches },
    { count: submittedPitches },
    { count: approvedPitches },
    { count: convertedPitches },
  ] = await Promise.all([
    supabase.from("pitches").select("*", { count: "exact", head: true }),
    supabase
      .from("pitches")
      .select("*", { count: "exact", head: true })
      .eq("status", "submitted"),
    supabase
      .from("pitches")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved"),
    supabase
      .from("pitches")
      .select("*", { count: "exact", head: true })
      .eq("status", "converted"),
  ]);

  // Get project counts
  const [{ count: totalProjects }, { count: activeProjects }] =
    await Promise.all([
      supabase.from("projects").select("*", { count: "exact", head: true }),
      supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("status", "active"),
    ]);

  // Get workspace visible projects for current user
  const { data: membershipRows } = await supabase
    .from("project_members")
    .select("project_id")
    .eq("user_id", user.id);

  const projectIds = membershipRows?.map((m: any) => m.project_id) ?? [];

  const { count: workspaceVisibleProjects } =
    projectIds.length > 0
      ? await supabase
          .from("projects")
          .select("*", { count: "exact", head: true })
          .in("id", projectIds)
          .neq("status", "archived")
      : { count: 0 };

  // Get project_members count
  const { count: totalProjectMembers } = await supabase
    .from("project_members")
    .select("*", { count: "exact", head: true });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Báo cáo xác thực quy trình
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Xác thực toàn bộ quy trình: Đề xuất → Gửi → Đánh giá → Phê duyệt → Tạo
          dự án → Hiển thị không gian làm việc
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng đề xuất
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPitches ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Tất cả đề xuất trong hệ thống
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đề xuất đã gửi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submittedPitches ?? 0}</div>
            <p className="text-xs text-muted-foreground">Đang chờ đánh giá</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đề xuất đã duyệt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedPitches ?? 0}</div>
            <p className="text-xs text-muted-foreground">Sẵn sàng chuyển đổi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đề xuất đã chuyển đổi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{convertedPitches ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Đã liên kết với dự án
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tổng dự án
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Tất cả dự án trong hệ thống
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dự án đang hoạt động
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects ?? 0}</div>
            <p className="text-xs text-muted-foreground">Hiện đang hoạt động</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Không gian làm việc hiển thị
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workspaceVisibleProjects ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Các dự án bạn có thể truy cập
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Thành viên dự án
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjectMembers ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Tổng số thành viên tham gia
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trạng thái quy trình</CardTitle>
          <CardDescription>
            Xác thực toàn bộ quy trình từ đề xuất đến dự án
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <p className="font-medium">Hiển thị đề xuất đã gửi</p>
              <p className="text-sm text-muted-foreground">
                Đề xuất đã gửi có thể được xem bởi tất cả người dùng đã xác thực
              </p>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${submittedPitches && submittedPitches > 0 ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
            >
              {submittedPitches && submittedPitches > 0 ? "ĐẠT" : "CẢNH BÁO"}
            </div>
          </div>

          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <p className="font-medium">Chuyển đổi từ đề xuất sang dự án</p>
              <p className="text-sm text-muted-foreground">
                Đề xuất đã duyệt có thể được chuyển thành dự án
              </p>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${convertedPitches && convertedPitches > 0 ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
            >
              {convertedPitches && convertedPitches > 0 ? "ĐẠT" : "CẢNH BÁO"}
            </div>
          </div>

          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <p className="font-medium">Thành viên dự án</p>
              <p className="text-sm text-muted-foreground">
                Dự án có thành viên được phân công
              </p>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${totalProjectMembers && totalProjectMembers > 0 ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
            >
              {totalProjectMembers && totalProjectMembers > 0
                ? "ĐẠT"
                : "CẢNH BÁO"}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Hiển thị không gian làm việc</p>
              <p className="text-sm text-muted-foreground">
                Người dùng có thể xem các dự án mà họ là thành viên
              </p>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${workspaceVisibleProjects !== undefined ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
            >
              {workspaceVisibleProjects !== undefined ? "ĐẠT" : "CẢNH BÁO"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
