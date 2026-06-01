import { AuthShell } from "@/components/auth/auth-shell";
import { EnvConfigAlert } from "@/components/auth/env-config-alert";
import { SignupForm } from "@/components/auth/signup-form";
import { isSupabaseConfigured } from "@/lib/supabase-env";

export default function SignupPage() {
  const supabaseConfigured = isSupabaseConfigured();

  return (
    <AuthShell
      title="Đăng ký"
      subtitle="Tạo tài khoản để bắt đầu với Community Project Lab"
    >
      {!supabaseConfigured && <EnvConfigAlert />}
      <SignupForm supabaseConfigured={supabaseConfigured} />
    </AuthShell>
  );
}
