"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
            Session Management
          </CardTitle>
          <CardDescription>
            Configure session timeout and authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="session-timeout">Session Timeout (hours)</Label>
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
              <Label htmlFor="remember-me">Allow "Remember Me"</Label>
              <p className="text-sm text-muted-foreground">
                Allow users to stay logged in longer
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
            Password Policy
          </CardTitle>
          <CardDescription>
            Configure password requirements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password-min-length">Minimum Length</Label>
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
              <Label htmlFor="password-require-uppercase">Require uppercase</Label>
            </div>
            <Switch id="password-require-uppercase" defaultChecked disabled={!canManage} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="password-require-number">Require numbers</Label>
            </div>
            <Switch id="password-require-number" defaultChecked disabled={!canManage} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="password-require-special">Require special characters</Label>
            </div>
            <Switch id="password-require-special" defaultChecked disabled={!canManage} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Access Control
          </CardTitle>
          <CardDescription>
            Configure access policies and restrictions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="two-factor">Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Enable 2FA for all users
              </p>
            </div>
            <Switch id="two-factor" disabled={!canManage} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="ip-restriction">IP Restriction</Label>
              <p className="text-sm text-muted-foreground">
                Restrict access by IP address
              </p>
            </div>
            <Switch id="ip-restriction" disabled={!canManage} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="audit-retention">Audit Log Retention (days)</Label>
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
