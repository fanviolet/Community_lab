import { redirect } from "next/navigation";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Shield, Bot, Workflow, Bell, History } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
} from "@/lib/rbac";
import { GeneralSettings } from "./general-settings";
import { AISettings } from "./ai-settings";
import { WorkflowSettings } from "./workflow-settings";
import { NotificationSettings } from "./notification-settings";
import { SecuritySettings } from "./security-settings";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = parseRole(profile?.role);
  const ctx = createAuthenticatedContext(role, user.id);

  if (!hasPermission(ctx, "settings.view")) {
    redirect("/dashboard");
  }

  const canEdit = hasPermission(ctx, "settings.edit");
  const canManageAI = hasPermission(ctx, "settings.ai.manage");
  const canManageWorkflow = hasPermission(ctx, "settings.workflow.manage");
  const canManageNotification = hasPermission(ctx, "settings.notification.manage");
  const canManageSecurity = hasPermission(ctx, "settings.security.manage");
  const canViewAudit = hasPermission(ctx, "audit.logs.view");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">System Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage platform configuration and preferences.
          </p>
        </div>
        {canViewAudit && (
          <Button variant="outline" asChild>
            <Link href="/dashboard/settings/audit">
              <History className="mr-2 h-4 w-4" />
              Audit Logs
            </Link>
          </Button>
        )}
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">
            <Settings className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Bot className="mr-2 h-4 w-4" />
            AI
          </TabsTrigger>
          <TabsTrigger value="workflow">
            <Workflow className="mr-2 h-4 w-4" />
            Workflow
          </TabsTrigger>
          <TabsTrigger value="notification">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <GeneralSettings canEdit={canEdit} />
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <AISettings canManage={canManageAI} />
        </TabsContent>

        <TabsContent value="workflow" className="space-y-6">
          <WorkflowSettings canManage={canManageWorkflow} />
        </TabsContent>

        <TabsContent value="notification" className="space-y-6">
          <NotificationSettings canManage={canManageNotification} />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <SecuritySettings canManage={canManageSecurity} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
