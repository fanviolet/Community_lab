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
import { Textarea } from "@/components/ui/textarea";
import { User } from "lucide-react";

interface UserDetailProfileProps {
  user: any;
  canEdit: boolean;
}

export function UserDetailProfile({ user, canEdit }: UserDetailProfileProps) {
  return (
    <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Thông tin hồ sơ
        </CardTitle>
        <CardDescription>
          Thông tin cơ bản và tiểu sử người dùng
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="display_name">Họ và tên</Label>
          <Input
            id="display_name"
            defaultValue={user.display_name || ""}
            disabled={!canEdit}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            defaultValue={user.email}
            disabled={!canEdit}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Tiểu sử</Label>
          <Textarea
            id="bio"
            defaultValue={user.bio || ""}
            rows={4}
            disabled={!canEdit}
            placeholder="Tiểu sử người dùng..."
          />
        </div>

        {canEdit && (
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
              Lưu thay đổi
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
