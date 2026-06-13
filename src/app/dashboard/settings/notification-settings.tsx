"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bell, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface NotificationSettingsProps {
  canManage: boolean;
}

interface NotificationPrefs {
  enable_notifications: boolean;
  enable_task_notifications: boolean;
  enable_project_notifications: boolean;
  enable_pitch_notifications: boolean;
  enable_mention_notifications: boolean;
  enable_ai_notifications: boolean;
}

export function NotificationSettings({ canManage }: NotificationSettingsProps) {
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    enable_notifications: true,
    enable_task_notifications: true,
    enable_project_notifications: true,
    enable_pitch_notifications: true,
    enable_mention_notifications: true,
    enable_ai_notifications: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .rpc("get_or_create_user_prefs", { p_user_id: user.id });

      if (error) throw error;

      if (data) {
        setPrefs({
          enable_notifications: data.enable_notifications ?? true,
          enable_task_notifications: data.enable_task_notifications ?? true,
          enable_project_notifications: data.enable_project_notifications ?? true,
          enable_pitch_notifications: data.enable_pitch_notifications ?? true,
          enable_mention_notifications: data.enable_mention_notifications ?? true,
          enable_ai_notifications: data.enable_ai_notifications ?? true,
        });
      }
    } catch (error) {
      console.error("[NotificationSettings] Error loading preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase
        .from("user_notification_prefs")
        .upsert({
          user_id: user.id,
          ...prefs,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("[NotificationSettings] Error saving preferences:", error);
    } finally {
      setSaving(false);
    }
  };

  const updatePref = (key: keyof NotificationPrefs, value: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cài đặt thông báo</h2>
          <p className="text-muted-foreground">Quản lý cách bạn nhận thông báo</p>
        </div>
        <Button onClick={handleSave} disabled={saving || !canManage}>
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4 mr-2" />
          ) : null}
          {saving ? "Đang lưu..." : saved ? "Đã lưu" : "Lưu thay đổi"}
        </Button>
      </div>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Thông báo trong ứng dụng
          </CardTitle>
          <CardDescription>
            Chọn loại thông báo bạn muốn nhận
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enable-notifications">Bật thông báo</Label>
              <p className="text-sm text-muted-foreground">
                Tắt để tắt tất cả thông báo
              </p>
            </div>
            <Switch
              id="enable-notifications"
              checked={prefs.enable_notifications}
              onCheckedChange={(v) => updatePref("enable_notifications", v)}
              disabled={!canManage}
            />
          </div>

          <div className="space-y-4 pl-4 border-l-2 border-muted">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="task-notifications">Nhiệm vụ</Label>
                <p className="text-sm text-muted-foreground">
                  Thông báo khi được giao nhiệm vụ hoặc nhiệm vụ hoàn thành
                </p>
              </div>
              <Switch
                id="task-notifications"
                checked={prefs.enable_task_notifications}
                onCheckedChange={(v) => updatePref("enable_task_notifications", v)}
                disabled={!canManage || !prefs.enable_notifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="project-notifications">Dự án</Label>
                <p className="text-sm text-muted-foreground">
                  Thông báo khi được thêm vào dự án hoặc trạng thái dự án thay đổi
                </p>
              </div>
              <Switch
                id="project-notifications"
                checked={prefs.enable_project_notifications}
                onCheckedChange={(v) => updatePref("enable_project_notifications", v)}
                disabled={!canManage || !prefs.enable_notifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="pitch-notifications">Đề xuất</Label>
                <p className="text-sm text-muted-foreground">
                  Thông báo khi đề xuất được phê duyệt, từ chối hoặc cần sửa đổi
                </p>
              </div>
              <Switch
                id="pitch-notifications"
                checked={prefs.enable_pitch_notifications}
                onCheckedChange={(v) => updatePref("enable_pitch_notifications", v)}
                disabled={!canManage || !prefs.enable_notifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="mention-notifications">Nhắc đến</Label>
                <p className="text-sm text-muted-foreground">
                  Thông báo khi ai đó nhắc đến bạn trong tin nhắn
                </p>
              </div>
              <Switch
                id="mention-notifications"
                checked={prefs.enable_mention_notifications}
                onCheckedChange={(v) => updatePref("enable_mention_notifications", v)}
                disabled={!canManage || !prefs.enable_notifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="ai-notifications">AI Insights</Label>
                <p className="text-sm text-muted-foreground">
                  Thông báo khi AI xác định đóng góp của bạn là insight nổi bật
                </p>
              </div>
              <Switch
                id="ai-notifications"
                checked={prefs.enable_ai_notifications}
                onCheckedChange={(v) => updatePref("enable_ai_notifications", v)}
                disabled={!canManage || !prefs.enable_notifications}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
