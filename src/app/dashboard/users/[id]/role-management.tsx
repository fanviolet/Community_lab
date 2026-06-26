"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Shield, AlertTriangle } from "lucide-react";
import { updateUserRole } from "../actions";

interface RoleManagementProps {
  userId: string;
  currentRole: string;
}

export function RoleManagement({ userId, currentRole }: RoleManagementProps) {
  const roleLabels: Record<string, string> = {
    guest: "Khách",
    member: "Thành viên",
    builder: "Người xây dựng",
    expert: "Chuyên gia",
    mentor: "Người cố vấn",
    leader: "Trưởng nhóm",
    admin: "Quản trị viên",
  };

  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateRole = async () => {
    if (selectedRole === currentRole) return;

    setIsUpdating(true);
    try {
      await updateUserRole(userId, { role: selectedRole as any });
      window.location.reload();
    } catch (error) {
      console.error("Failed to update role:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Quản lý vai trò
        </CardTitle>
        <CardDescription>
          Gán hoặc thay đổi vai trò và quyền của người dùng
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="role">Vai trò hiện tại</Label>
          <div className="p-3 bg-muted/30 rounded-lg">
            <span className="font-medium capitalize">
              {roleLabels[currentRole] || currentRole}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-role">Vai trò mới</Label>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger id="new-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="guest">
                Khách - Quyền truy cập hạn chế
              </SelectItem>
              <SelectItem value="member">
                Thành viên - Toàn quyền truy cập cộng đồng
              </SelectItem>
              <SelectItem value="builder">
                Người xây dựng - Có thể tạo dự án
              </SelectItem>
              <SelectItem value="expert">
                Chuyên gia - Có thể đánh giá và cố vấn
              </SelectItem>
              <SelectItem value="mentor">
                Người cố vấn - Có thể hướng dẫn và giảng dạy
              </SelectItem>
              <SelectItem value="leader">
                Trưởng nhóm - Có thể quản lý nhóm
              </SelectItem>
              <SelectItem value="admin">
                Quản trị viên - Toàn quyền truy cập hệ thống
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedRole !== currentRole && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Cảnh báo thay đổi vai trò
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Việc thay đổi vai trò sẽ ngay lập tức ảnh hưởng đến quyền hạn
                  và quyền truy cập của người dùng.
                </p>
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={handleUpdateRole}
          disabled={selectedRole === currentRole || isUpdating}
          className="w-full"
        >
          {isUpdating ? "Đang cập nhật..." : "Cập nhật vai trò"}
        </Button>
      </CardContent>
    </Card>
  );
}
