import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RBACProvider } from "@/contexts/rbac-context";
import { isSupabaseConfigured } from "@/lib/supabase-env";
import { createClient } from "@/lib/supabase/server";
import { parseRole, Role } from "@/lib/rbac";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!isSupabaseConfigured()) {
    return <DashboardShell>{children}</DashboardShell>;
  }

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

  const role = parseRole(profile?.role ?? Role.Member);

  return (
    <RBACProvider role={role} userId={user.id}>
      <DashboardShell>{children}</DashboardShell>
    </RBACProvider>
  );
}
