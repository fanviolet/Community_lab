"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Mail, Shield, Bell, Check, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { t } from "@/hooks/useTranslation";
import { getNotificationPreferences, updateNotificationPreferences, changePassword } from "../actions";

interface ProfileAccountProps {
  profile: any;
}

export function ProfileAccount({ profile }: ProfileAccountProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setLoadingSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [saved, setSaved] = useState(false);

  const [notificationPrefs, setNotificationPrefs] = useState({
    enable_notifications: true,
    enable_task_notifications: true,
    enable_project_notifications: true,
    enable_pitch_notifications: true,
    enable_mention_notifications: true,
    enable_ai_notifications: true,
  });

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  useEffect(() => {
    loadNotificationPreferences();
  }, []);

  const loadNotificationPreferences = async () => {
    try {
      const result = await getNotificationPreferences();
      if (result.prefs) {
        setNotificationPrefs({
          enable_notifications: result.prefs.enable_notifications ?? true,
          enable_task_notifications: result.prefs.enable_task_notifications ?? true,
          enable_project_notifications: result.prefs.enable_project_notifications ?? true,
          enable_pitch_notifications: result.prefs.enable_pitch_notifications ?? true,
          enable_mention_notifications: result.prefs.enable_mention_notifications ?? true,
          enable_ai_notifications: result.prefs.enable_ai_notifications ?? true,
        });
      }
    } catch (error) {
      console.error("Error loading notification preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setLoadingSaving(true);
    setSaved(false);

    try {
      const formData = new FormData();
      formData.append("enable_notifications", notificationPrefs.enable_notifications.toString());
      formData.append("enable_task_notifications", notificationPrefs.enable_task_notifications.toString());
      formData.append("enable_project_notifications", notificationPrefs.enable_project_notifications.toString());
      formData.append("enable_pitch_notifications", notificationPrefs.enable_pitch_notifications.toString());
      formData.append("enable_mention_notifications", notificationPrefs.enable_mention_notifications.toString());
      formData.append("enable_ai_notifications", notificationPrefs.enable_ai_notifications.toString());

      const result = await updateNotificationPreferences(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        setSaved(true);
        toast.success(t("profile.notificationsSaved"));
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      toast.error(t("profile.notificationsSaveFailed"));
    } finally {
      setLoadingSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error(t("profile.passwordMismatch"));
      return;
    }

    if (passwordData.new_password.length < 8) {
      toast.error(t("profile.passwordMinLength"));
      return;
    }

    setChangingPassword(true);

    try {
      const formData = new FormData();
      formData.append("current_password", passwordData.current_password);
      formData.append("new_password", passwordData.new_password);

      const result = await changePassword(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(t("profile.passwordChanged"));
        setPasswordData({
          current_password: "",
          new_password: "",
          confirm_password: "",
        });
      }
    } catch (error) {
      toast.error(t("profile.passwordChangeFailed"));
    } finally {
      setChangingPassword(false);
    }
  };

  const updatePref = (key: keyof typeof notificationPrefs, value: boolean) => {
    setNotificationPrefs((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Account Info */}
      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t("profile.account")}
          </CardTitle>
          <CardDescription>
            {t("profile.account")} - {t("common.role")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t("common.email")}</Label>
            <Input value={profile?.email || ""} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">
              Email không thể thay đổi. Liên hệ hỗ trợ nếu cần.
            </p>
          </div>

          <div className="space-y-2">
            <Label>{t("common.role")}</Label>
            <Input value={profile?.role || ""} disabled className="bg-muted capitalize" />
            <p className="text-xs text-muted-foreground">
              Vai trò của bạn xác định quyền truy cập trong nền tảng.
            </p>
          </div>

          <div className="space-y-2">
            <Label>{t("team.memberSince")}</Label>
            <Input
              value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : ""}
              disabled
              className="bg-muted"
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t("settings.notifications")}
          </CardTitle>
          <CardDescription>
            Chọn thông báo bạn muốn nhận
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enable-notifications">{t("notifications.title")}</Label>
                  <p className="text-sm text-muted-foreground">
                    Tắt để vô hiệu hóa tất cả thông báo
                  </p>
                </div>
                <Switch
                  id="enable-notifications"
                  checked={notificationPrefs.enable_notifications}
                  onCheckedChange={(v) => updatePref("enable_notifications", v)}
                />
              </div>

              <div className="border-t border-border" />

              <div className="space-y-4 pl-4 border-l-2 border-muted">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="task-notifications">{t("notifications.tasks")}</Label>
                    <p className="text-sm text-muted-foreground">
                      Khi bạn được giao việc hoặc công việc hoàn thành
                    </p>
                  </div>
                  <Switch
                    id="task-notifications"
                    checked={notificationPrefs.enable_task_notifications}
                    onCheckedChange={(v) => updatePref("enable_task_notifications", v)}
                    disabled={!notificationPrefs.enable_notifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="project-notifications">{t("notifications.projects")}</Label>
                    <p className="text-sm text-muted-foreground">
                      Khi bạn được thêm vào dự án hoặc trạng thái dự án thay đổi
                    </p>
                  </div>
                  <Switch
                    id="project-notifications"
                    checked={notificationPrefs.enable_project_notifications}
                    onCheckedChange={(v) => updatePref("enable_project_notifications", v)}
                    disabled={!notificationPrefs.enable_notifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="pitch-notifications">{t("notifications.proposals")}</Label>
                    <p className="text-sm text-muted-foreground">
                      Khi đề xuất của bạn được duyệt, từ chối hoặc cần chỉnh sửa
                    </p>
                  </div>
                  <Switch
                    id="pitch-notifications"
                    checked={notificationPrefs.enable_pitch_notifications}
                    onCheckedChange={(v) => updatePref("enable_pitch_notifications", v)}
                    disabled={!notificationPrefs.enable_notifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="mention-notifications">{t("notifications.mentions")}</Label>
                    <p className="text-sm text-muted-foreground">
                      Khi ai đó nhắc đến bạn trong tin nhắn
                    </p>
                  </div>
                  <Switch
                    id="mention-notifications"
                    checked={notificationPrefs.enable_mention_notifications}
                    onCheckedChange={(v) => updatePref("enable_mention_notifications", v)}
                    disabled={!notificationPrefs.enable_notifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="ai-notifications">{t("notifications.aiInsights")}</Label>
                    <p className="text-sm text-muted-foreground">
                      Khi AI xác định đóng góp của bạn là nổi bật
                    </p>
                  </div>
                  <Switch
                    id="ai-notifications"
                    checked={notificationPrefs.enable_ai_notifications}
                    onCheckedChange={(v) => updatePref("enable_ai_notifications", v)}
                    disabled={!notificationPrefs.enable_notifications}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleSaveNotifications}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t("common.loading")}
                    </>
                  ) : saved ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      {t("settings.saved")}
                    </>
                  ) : (
                    t("common.save")
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t("settings.security")}
          </CardTitle>
          <CardDescription>
            {t("profile.currentPassword")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">{t("profile.currentPassword")}</Label>
              <Input
                id="current-password"
                type="password"
                value={passwordData.current_password}
                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">{t("profile.newPassword")}</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                required
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">
                {t("profile.passwordMinLength")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t("profile.confirmPassword")}</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                required
                minLength={8}
              />
            </div>

            <Button
              type="submit"
              disabled={changingPassword}
              className="w-full"
            >
              {changingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("common.loading")}
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  {t("profile.newPassword")}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}