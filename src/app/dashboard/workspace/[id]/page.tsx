import Link from "next/link";
import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";
import MemberManagement from "@/components/workspace/MemberManagement";
import TaskManagement from "@/components/workspace/TaskManagement";
import ActivityTimeline from "@/components/workspace/ActivityTimeline";
import ProjectReport from "@/components/workspace/ProjectReport";
import { getProjectTimelineInfo } from "@/lib/project-timeline";
import { buildProjectRBACContext } from "@/lib/rbac-server";
import { getWorkspacePermissions, hasPermission } from "@/lib/rbac";
import ProjectWorkflow from "@/components/workspace/ProjectWorkflow";
import DiscussionHub from "@/components/discussion/DiscussionHub";
import {
  updateProject,
  archiveProject,
} from "../actions";
import {
  generateProjectReport,
  getProjectReports,
  getSavedReport,
  deleteReport,
} from "./report-actions";

interface ProjectDetail {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string | null;
}

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  assigned_to: string | null;
  assigned_user: string | null;
  due_date: string | null;
  created_at: string | null;
}

interface MemberItem {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  avatar_url: string | null;
  created_at: string | null;
}

interface ActivityItem {
  id: string;
  user_id: string | null;
  user_name: string | null;
  action: string | null;
  description: string | null;
  created_at: string | null;
}

function statusBadgeVariant(status: string | null) {
  if (!status) return "pending";

  switch (status.toString().toLowerCase()) {
    case "active":
      return "secondary";
    case "completed":
    case "done":
      return "approved";
    case "archived":
      return "muted";
    default:
      return "pending";
  }
}

const statusLabels: Record<string, string> = {
  planning: "Lên kế hoạch",
  active: "Đang hoạt động",
  paused: "Tạm dừng",
  completed: "Hoàn thành",
  archived: "Đã lưu trữ",
};

function isCompleteStatus(status: string | null) {
  return ["completed", "done", "complete"].includes(status?.toString().toLowerCase() ?? "");
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Supabase chưa được cấu hình. Thêm biến môi trường vào{' '}
        <code className="font-mono">.env.local</code>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const rbacCtx = await buildProjectRBACContext(id);

  if (!hasPermission(rbacCtx, "workspace.view")) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Truy cập bị từ chối</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Bạn không phải là thành viên của dự án này. Vui lòng liên hệ trưởng dự án để yêu cầu quyền truy cập.
            </p>
          </div>
          <Link
            href="/dashboard/workspace"
            className="inline-flex items-center rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
          >
            Quay lại không gian làm việc
          </Link>
        </div>
      </div>
    );
  }

  const permissions = getWorkspacePermissions(rbacCtx);
  const isLeader = permissions.canEditProject;

  const [projectResult, tasksResult, membersResult, activitiesResult] = await Promise.all([
    supabase
      .from("projects")
      .select("id,title,description,status,start_date,end_date,created_at")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("tasks")
      .select("id,title,description,status,priority,assigned_to,assigned_user,due_date,created_at")
      .eq("project_id", id)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("project_members")
      .select("id,user_id,name,email,role,avatar_url,created_at")
      .eq("project_id", id)
      .order("role", { ascending: false })
      .order("name", { ascending: true }),
    supabase
      .from("activities")
      .select("id,user_id,user_name,action,description,created_at")
      .eq("project_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (!projectResult.data) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Không tìm thấy dự án</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Dự án bạn đang tìm kiếm không tồn tại hoặc bạn không có quyền truy cập.
            </p>
          </div>
          <Link
            href="/dashboard/workspace"
            className="inline-flex items-center rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
          >
            Quay lại không gian làm việc
          </Link>
        </div>
      </div>
    );
  }

  const project: ProjectDetail = projectResult.data;
  const tasks: TaskItem[] = tasksResult.data ?? [];
  const members: MemberItem[] = membersResult.data ?? [];
  const activities: ActivityItem[] = activitiesResult.data ?? [];

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => isCompleteStatus(task.status)).length;
  const inProgressTasks = tasks.filter((task) => task.status === "in_progress").length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const timeline = getProjectTimelineInfo({
    startDate: project.start_date,
    endDate: project.end_date,
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{project.title}</h1>
            <Badge variant={statusBadgeVariant(project.status)} className="mt-1">
              {(project.status && statusLabels[project.status.toLowerCase()]) || project.status || "Đang hoạt động"}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {project.description ?? "Không có mô tả."}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/workspace"
            className="inline-flex items-center rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
          >
            <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
            Quay lại
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tổng công việc</p>
                <p className="text-2xl font-semibold text-foreground">{totalTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Đã hoàn thành</p>
                <p className="text-2xl font-semibold text-foreground">{completedTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Thành viên đội</p>
                <p className="text-2xl font-semibold text-foreground">{members.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tiến độ</p>
                <p className="text-2xl font-semibold text-foreground">{progress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full lg:w-auto lg:inline-grid" style={{ gridTemplateColumns: isLeader ? 'repeat(8, 1fr)' : 'repeat(7, 1fr)' }}>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="workflow">Quy trình</TabsTrigger>
          <TabsTrigger value="tasks">Công việc</TabsTrigger>
          <TabsTrigger value="members">Thành viên</TabsTrigger>
          <TabsTrigger value="discussion">Thảo luận</TabsTrigger>
          <TabsTrigger value="activity">Hoạt động</TabsTrigger>
          <TabsTrigger value="reports">Báo cáo</TabsTrigger>
          {isLeader && <TabsTrigger value="settings">Cài đặt</TabsTrigger>}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
            <div className="space-y-6">
              {/* Progress Section */}
              <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
                <CardHeader>
                  <CardTitle>Tiến độ</CardTitle>
                  <CardDescription>Trạng thái hoàn thành dự án</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tiến độ tổng thể</span>
                      <span className="font-medium text-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-foreground">{totalTasks}</p>
                      <p className="text-xs text-muted-foreground">Tổng công việc</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-foreground">{completedTasks}</p>
                      <p className="text-xs text-muted-foreground">Đã hoàn thành</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-foreground">{inProgressTasks}</p>
                      <p className="text-xs text-muted-foreground">Đang thực hiện</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Project Description */}
              <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
                <CardHeader>
                  <CardTitle>Về dự án này</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {project.description || "Không có mô tả."}
                  </p>
                </CardContent>
              </Card>

              {/* Project Timeline */}
              <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
                <CardHeader>
                  <CardTitle>Lịch trình dự án</CardTitle>
                  <CardDescription>Lịch trình và thời lượng</CardDescription>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">Ngày bắt đầu</dt>
                      <dd className="mt-1 text-sm font-medium text-foreground">
                        {timeline.startDate ?? "Chưa đặt"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">Ngày kết thúc</dt>
                      <dd className="mt-1 text-sm font-medium text-foreground">
                        {timeline.endDate ?? "Chưa đặt"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">Thời lượng</dt>
                      <dd className="mt-1 text-sm font-medium text-foreground">
                        {timeline.duration ?? "Chưa đặt"}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Team Members Summary */}
              <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
                <CardHeader>
                  <CardTitle>Đội ngũ</CardTitle>
                  <CardDescription>{members.length} thành viên</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {members.slice(0, 5).map((member) => (
                      <div key={member.id} className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                          {member.name ? member.name.charAt(0).toUpperCase() : "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {member.name || "Không rõ"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {member.role || "member"}
                          </p>
                        </div>
                      </div>
                    ))}
                    {members.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{members.length - 5} thành viên khác
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </TabsContent>

        {/* Workflow Tab */}
        <TabsContent value="workflow" className="space-y-6">
          <ProjectWorkflow
            projectId={project.id}
            isLeader={isLeader}
          />
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6">
          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardHeader>
              <CardTitle>Công việc</CardTitle>
              <CardDescription>Quản lý công việc dự án và theo dõi tiến độ</CardDescription>
            </CardHeader>
            <CardContent>
              <TaskManagement
                projectId={project.id}
                tasks={tasks}
                currentUserId={user.id}
                isLeader={isLeader}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-6">
          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardHeader>
              <CardTitle>Thành viên đội</CardTitle>
              <CardDescription>Quản lý đội dự án và vai trò</CardDescription>
            </CardHeader>
            <CardContent>
              <MemberManagement
                projectId={project.id}
                members={members}
                currentUserId={user.id}
                isLeader={isLeader}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Discussion Tab */}
        <TabsContent value="discussion" className="space-y-6">
          <div className="h-[calc(100vh-12rem)]">
            <DiscussionHub projectId={project.id} />
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardHeader>
              <CardTitle>Nhật ký hoạt động</CardTitle>
              <CardDescription>Cập nhật và thay đổi dự án gần đây</CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityTimeline activities={activities} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardHeader>
              <CardTitle>Tạo báo cáo AI</CardTitle>
              <CardDescription>Tạo báo cáo dự án chuyên nghiệp bằng dữ liệu thực</CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectReport
                projectId={project.id}
                isLeader={isLeader}
                generateReport={generateProjectReport}
                getReports={getProjectReports}
                getReport={getSavedReport}
                deleteReport={deleteReport}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab - Leaders Only */}
        {isLeader && (
          <TabsContent value="settings" className="space-y-6">
            <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
              <CardHeader>
                <CardTitle>Cài đặt dự án</CardTitle>
                <CardDescription>Quản lý chi tiết và cấu hình dự án</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Edit Project Form */}
                <form action={updateProject} className="space-y-4">
                  <input type="hidden" name="projectId" value={project.id} />
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Tên dự án</label>
                    <Input name="title" defaultValue={project.title} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Mô tả</label>
                    <Textarea name="description" defaultValue={project.description ?? ""} rows={4} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Trạng thái</label>
                    <select
                      name="status"
                      defaultValue={project.status ?? "active"}
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <option value="planning">Lên kế hoạch</option>
                      <option value="active">Đang hoạt động</option>
                      <option value="paused">Tạm dừng</option>
                      <option value="completed">Hoàn thành</option>
                      <option value="archived">Đã lưu trữ</option>
                    </select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Ngày bắt đầu</label>
                      <Input
                        name="startDate"
                        type="date"
                        defaultValue={project.start_date?.slice(0, 10) ?? ""}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Ngày kết thúc</label>
                      <Input
                        name="endDate"
                        type="date"
                        defaultValue={project.end_date?.slice(0, 10) ?? ""}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Lưu thay đổi</Button>
                  </div>
                </form>

                {/* Danger Zone */}
                <div className="mt-8 rounded-xl border border-destructive/20 bg-destructive/5 p-6">
                  <h3 className="text-lg font-semibold text-destructive">Vùng nguy hiểm</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Các hành động này không thể hoàn tác. Vui lòng thận trọng.
                  </p>
                  <div className="mt-4">
                    <form action={archiveProject}>
                      <input type="hidden" name="projectId" value={project.id} />
                      <Button type="submit" variant="destructive">
                        Lưu trữ dự án
                      </Button>
                    </form>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}