import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
} from "@/lib/rbac";
import type { RecommendedTool } from "@/types/recommended-tools";
import { RecommendedToolsAdminClient } from "./recommended-tools-admin-client";

export default async function RecommendedToolsAdminPage() {
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

  if (!hasPermission(ctx, "admin.panel.view")) {
    redirect("/dashboard");
  }

  const { data: tools } = await supabase
    .from("recommended_tools")
    .select("*")
    .order("priority", { ascending: false })
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <RecommendedToolsAdminClient
      initialTools={(tools ?? []) as RecommendedTool[]}
    />
  );
}
