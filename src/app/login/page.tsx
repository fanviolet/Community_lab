import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { EnvConfigAlert } from "@/components/auth/env-config-alert";
import { LoginForm } from "@/components/auth/login-form";
import { isSupabaseConfigured } from "@/lib/supabase-env";

export default function LoginPage() {
  const supabaseConfigured = isSupabaseConfigured();

  return (
    <AuthShell
      title="Đăng nhập"
      subtitle="Tiếp tục xây dựng dự án cộng đồng của bạn"
    >
      {!supabaseConfigured && <EnvConfigAlert />}
      <Suspense
        fallback={
          <p className="text-center text-sm text-muted-foreground">Đang tải...</p>
        }
      >
        <LoginForm supabaseConfigured={supabaseConfigured} />
      </Suspense>
    </AuthShell>
  );
}
