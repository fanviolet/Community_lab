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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Shield,
  AlertTriangle,
  UserX,
  CheckCircle,
  XCircle,
  Ban,
} from "lucide-react";
import { updateUserStatus, deleteUser } from "../actions";

interface AccountActionsProps {
  userId: string;
  currentStatus: string;
  canDelete: boolean;
}

export function AccountActions({
  userId,
  currentStatus,
  canDelete,
}: AccountActionsProps) {
  const statusLabels: Record<string, string> = {
    active: "Hoạt động",
    suspended: "Tạm khóa",
    deactivated: "Vô hiệu hóa",
  };

  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [reason, setReason] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdateStatus = async () => {
    if (selectedStatus === currentStatus) return;

    setIsUpdating(true);
    try {
      await updateUserStatus(userId, {
        status: selectedStatus as any,
        reason: reason || undefined,
      });
      window.location.reload();
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Bạn có chắc muốn xóa người dùng này không? Hành động này không thể hoàn tác.",
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteUser(userId);
      window.location.href = "/dashboard/users";
    } catch (error) {
      console.error("Failed to delete user:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Trạng thái tài khoản
          </CardTitle>
          <CardDescription>
            Kích hoạt, tạm khóa hoặc vô hiệu hóa tài khoản người dùng
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-status">Trạng thái hiện tại</Label>
            <div className="p-3 bg-muted/30 rounded-lg">
              <span className="font-medium capitalize">
                {statusLabels[currentStatus] || currentStatus}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-status">Trạng thái mới</Label>
            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => setSelectedStatus("active")}
                className={`p-4 border rounded-lg flex items-center gap-3 ${
                  selectedStatus === "active"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200"
                }`}
              >
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div className="text-left">
                  <p className="font-medium">Hoạt động</p>
                  <p className="text-sm text-muted-foreground">
                    Toàn quyền truy cập nền tảng
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus("suspended")}
                className={`p-4 border rounded-lg flex items-center gap-3 ${
                  selectedStatus === "suspended"
                    ? "border-yellow-500 bg-yellow-50"
                    : "border-gray-200"
                }`}
              >
                <Ban className="h-5 w-5 text-yellow-600" />
                <div className="text-left">
                  <p className="font-medium">Tạm khóa</p>
                  <p className="text-sm text-muted-foreground">
                    Tạm khóa có kèm lý do
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus("deactivated")}
                className={`p-4 border rounded-lg flex items-center gap-3 ${
                  selectedStatus === "deactivated"
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200"
                }`}
              >
                <XCircle className="h-5 w-5 text-red-600" />
                <div className="text-left">
                  <p className="font-medium">Vô hiệu hóa</p>
                  <p className="text-sm text-muted-foreground">
                    Tài khoản bị vô hiệu hóa vĩnh viễn
                  </p>
                </div>
              </button>
            </div>
          </div>

          {(selectedStatus === "suspended" ||
            selectedStatus === "deactivated") && (
            <div className="space-y-2">
              <Label htmlFor="reason">Lý do (không bắt buộc)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nhập lý do cho thay đổi trạng thái này..."
                rows={3}
              />
            </div>
          )}

          {selectedStatus !== currentStatus && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Cảnh báo thay đổi trạng thái
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    {selectedStatus === "suspended"
                      ? "Người dùng sẽ không thể truy cập nền tảng cho đến khi được kích hoạt lại."
                      : selectedStatus === "deactivated"
                        ? "Người dùng sẽ mất toàn bộ quyền truy cập vào nền tảng."
                        : "Người dùng sẽ lấy lại toàn bộ quyền truy cập vào nền tảng."}
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleUpdateStatus}
            disabled={selectedStatus === currentStatus || isUpdating}
            className="w-full"
          >
            {isUpdating ? "Đang cập nhật..." : "Cập nhật trạng thái"}
          </Button>
        </CardContent>
      </Card>

      {canDelete && (
        <Card className="border-0 bg-red-50 shadow-sm ring-1 ring-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <UserX className="h-5 w-5" />
              Vùng nguy hiểm
            </CardTitle>
            <CardDescription className="text-red-700">
              Xóa vĩnh viễn tài khoản người dùng này
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-red-100 border border-red-300 rounded-lg mb-4">
              <p className="text-sm text-red-800">
                Cảnh báo: Hành động này không thể hoàn tác. Tất cả dữ liệu người
                dùng sẽ bị xóa vĩnh viễn.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full"
            >
              {isDeleting ? "Đang xóa..." : "Xóa tài khoản người dùng"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
