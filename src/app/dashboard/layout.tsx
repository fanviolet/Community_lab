import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { RBACProvider } from "@/contexts/rbac-context";
import { isSupabaseConfigured } from "@/lib/supabase-env";
import { getAuthSession, getCachedProfileRole } from "@/lib/auth/server";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!isSupabaseConfigured()) {
    return <AppShell>{children}</AppShell>;
  }

  const { user } = await getAuthSession();

  if (!user) {
    redirect("/login");
  }

  const role = await getCachedProfileRole(user.id);

  return (
    <RBACProvider role={role} userId={user.id}>
      <AppShell>{children}</AppShell>
    </RBACProvider>
  );
}
