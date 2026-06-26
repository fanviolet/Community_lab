"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Shield, Clock, Lock, UserCheck } from "lucide-react";

interface SecuritySettingsProps {
  canManage: boolean;
}

export function SecuritySettings({ canManage }: SecuritySettingsProps) {
  return (
    <div className="space-y-6">
      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Quản lý phiên
          </CardTitle>
          <CardDescription>
            Cấu hình thời gian hết hạn phiên và xác thực
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="session-timeout">
              Thời gian hết hạn phiên (giờ)
            </Label>
            <Input
              id="session-timeout"
              type="number"
              defaultValue="24"
              min="1"
              max="168"
              disabled={!canManage}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="remember-me">Cho phép ghi nhớ đăng nhập</Label>
              <p className="text-sm text-muted-foreground">
                Cho phép người dùng duy trì đăng nhập lâu hơn
              </p>
            </div>
            <Switch id="remember-me" defaultChecked disabled={!canManage} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Chính sách mật khẩu
          </CardTitle>
          <CardDescription>Cấu hình yêu cầu mật khẩu</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password-min-length">Độ dài tối thiểu</Label>
            <Input
              id="password-min-length"
              type="number"
              defaultValue="8"
              min="6"
              max="32"
              disabled={!canManage}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="password-require-uppercase">
                Yêu cầu chữ in hoa
              </Label>
            </div>
            <Switch
              id="password-require-uppercase"
              defaultChecked
              disabled={!canManage}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="password-require-number">Yêu cầu chữ số</Label>
            </div>
            <Switch
              id="password-require-number"
              defaultChecked
              disabled={!canManage}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="password-require-special">
                Yêu cầu ký tự đặc biệt
              </Label>
            </div>
            <Switch
              id="password-require-special"
              defaultChecked
              disabled={!canManage}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Kiểm soát truy cập
          </CardTitle>
          <CardDescription>
            Cấu hình chính sách và giới hạn truy cập
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="two-factor">Xác thực hai yếu tố</Label>
              <p className="text-sm text-muted-foreground">
                Bật 2FA cho tất cả người dùng
              </p>
            </div>
            <Switch id="two-factor" disabled={!canManage} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="ip-restriction">Giới hạn IP</Label>
              <p className="text-sm text-muted-foreground">
                Giới hạn truy cập theo địa chỉ IP
              </p>
            </div>
            <Switch id="ip-restriction" disabled={!canManage} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="audit-retention">
              Thời gian lưu nhật ký kiểm tra (ngày)
            </Label>
            <Input
              id="audit-retention"
              type="number"
              defaultValue="90"
              min="7"
              max="365"
              disabled={!canManage}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
