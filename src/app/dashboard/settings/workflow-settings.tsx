"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Workflow } from "lucide-react";

interface WorkflowSettingsProps {
  canManage: boolean;
}

export function WorkflowSettings({ canManage }: WorkflowSettingsProps) {
  return (
    <div className="space-y-6">
      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Quy trình đề xuất
          </CardTitle>
          <CardDescription>
            Cấu hình quy trình duyệt đề xuất
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="proposal-auto-assign">Tự động phân công người duyệt</Label>
              <p className="text-sm text-muted-foreground">
                Tự động phân công người duyệt cho đề xuất mới
              </p>
            </div>
            <Switch id="proposal-auto-assign" disabled={!canManage} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="proposal-require-approval">Yêu cầu phê duyệt trước khi xuất bản</Label>
              <p className="text-sm text-muted-foreground">
                Đề xuất phải được phê duyệt trước khi xuất bản
              </p>
            </div>
            <Switch id="proposal-require-approval" defaultChecked disabled={!canManage} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="proposal-allow-revision">Cho phép yêu cầu chỉnh sửa</Label>
              <p className="text-sm text-muted-foreground">
                Người duyệt có thể yêu cầu chỉnh sửa đề xuất
              </p>
            </div>
            <Switch id="proposal-allow-revision" defaultChecked disabled={!canManage} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Quy trình đánh giá
          </CardTitle>
          <CardDescription>
            Cấu hình quy trình xem xét và đánh giá
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="review-require-evaluation">Yêu cầu điểm đánh giá</Label>
              <p className="text-sm text-muted-foreground">
                Người duyệt phải cung cấp điểm đánh giá
              </p>
            </div>
            <Switch id="review-require-evaluation" defaultChecked disabled={!canManage} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="review-min-reviewers">Số người duyệt tối thiểu</Label>
              <p className="text-sm text-muted-foreground">
                Số người duyệt tối thiểu cho mỗi đề xuất
              </p>
            </div>
            <select
              id="review-min-reviewers"
              className="w-32 px-3 py-2 border rounded-md"
              disabled={!canManage}
            >
              <option value="1">1</option>
              <option value="2" selected>2</option>
              <option value="3">3</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            Quy trình dự án
          </CardTitle>
          <CardDescription>
            Cấu hình việc tạo và quản lý dự án
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="project-auto-create">Tự động tạo không gian làm việc</Label>
              <p className="text-sm text-muted-foreground">
                Tự động tạo không gian làm việc khi dự án được duyệt
              </p>
            </div>
            <Switch id="project-auto-create" disabled={!canManage} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="project-require-team">Yêu cầu phân công nhóm</Label>
              <p className="text-sm text-muted-foreground">
                Dự án phải được phân công thành viên nhóm
              </p>
            </div>
            <Switch id="project-require-team" defaultChecked disabled={!canManage} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
