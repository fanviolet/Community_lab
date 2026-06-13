"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Globe, Palette, Mail } from "lucide-react";
import { updateSystemSetting } from "./actions";

interface GeneralSettingsProps {
  canEdit: boolean;
}

export function GeneralSettings({ canEdit }: GeneralSettingsProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    platform_name: "",
    platform_description: "",
    logo_url: "",
    primary_color: "",
    secondary_color: "",
    support_email: "",
  });

  const handleSave = async (key: string, value: string) => {
    if (!canEdit) return;

    setIsSaving(true);
    try {
      await updateSystemSetting(key, { setting_value: value });
    } catch (error) {
      console.error("Failed to save setting:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Platform Settings
          </CardTitle>
          <CardDescription>
            Configure basic platform information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="platform_name">Platform Name</Label>
            <Input
              id="platform_name"
              defaultValue={settings.platform_name}
              onBlur={(e) => handleSave("platform_name", e.target.value)}
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="platform_description">Platform Description</Label>
            <Textarea
              id="platform_description"
              defaultValue={settings.platform_description}
              onBlur={(e) => handleSave("platform_description", e.target.value)}
              rows={3}
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="support_email">Support Email</Label>
            <Input
              id="support_email"
              type="email"
              defaultValue={settings.support_email}
              onBlur={(e) => handleSave("support_email", e.target.value)}
              disabled={!canEdit}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Branding
          </CardTitle>
          <CardDescription>
            Customize platform appearance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="logo_url">Logo URL</Label>
            <Input
              id="logo_url"
              defaultValue={settings.logo_url}
              onBlur={(e) => handleSave("logo_url", e.target.value)}
              disabled={!canEdit}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="primary_color">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primary_color"
                  type="color"
                  defaultValue={settings.primary_color}
                  onBlur={(e) => handleSave("primary_color", e.target.value)}
                  disabled={!canEdit}
                  className="w-16 h-10"
                />
                <Input
                  defaultValue={settings.primary_color}
                  onBlur={(e) => handleSave("primary_color", e.target.value)}
                  disabled={!canEdit}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary_color">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary_color"
                  type="color"
                  defaultValue={settings.secondary_color}
                  onBlur={(e) => handleSave("secondary_color", e.target.value)}
                  disabled={!canEdit}
                  className="w-16 h-10"
                />
                <Input
                  defaultValue={settings.secondary_color}
                  onBlur={(e) => handleSave("secondary_color", e.target.value)}
                  disabled={!canEdit}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
