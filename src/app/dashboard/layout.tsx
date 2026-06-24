import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
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
    return <AppShell>{children}</AppShell>;
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
      <AppShell>{children}</AppShell>
    </RBACProvider>
  );
}
