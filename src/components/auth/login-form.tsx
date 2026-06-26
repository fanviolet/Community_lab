"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { t } from "@/hooks/useTranslation";
import { createClient } from "@/lib/supabase";
import { getSupabaseConfigError } from "@/lib/supabase-env";

type LoginFormProps = {
  supabaseConfigured: boolean;
};

export function LoginForm({ supabaseConfigured }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const configError = getSupabaseConfigError();
    if (configError) {
      setError(configError);
      setLoading(false);
      return;
    }

    let supabase;
    try {
      supabase = createClient();
    } catch (err) {
      console.error("Supabase client init failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Không thể khởi tạo Supabase client.",
      );
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    setSuccess("Đăng nhập thành công! Đang chuyển hướng...");
    router.push(redirect);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          {success}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <Input
          id="email"
          type="email"
          placeholder="you@school.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="h-11 rounded-xl border-border/80 bg-white/80"
          disabled={loading || !supabaseConfigured}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Mật khẩu
        </label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="h-11 rounded-xl border-border/80 bg-white/80"
          disabled={loading || !supabaseConfigured}
        />
      </div>

      <Button
        type="submit"
        disabled={loading || !supabaseConfigured}
        className="h-11 w-full rounded-full shadow-lg shadow-primary/20"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Đang đăng nhập...
          </>
        ) : (
          "Đăng nhập"
        )}
      </Button>

      {supabaseConfigured && (
        <div className="space-y-2 pt-2">
          <p className="text-center text-xs text-muted-foreground">
            {t("auth.login.demoAccounts")}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEmail("guest@communitylab.demo");
                setPassword("demo123");
              }}
              disabled={loading}
              className="flex-1"
            >
              {t("auth.login.guest")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEmail("leader@communitylab.demo");
                setPassword("demo123");
              }}
              disabled={loading}
              className="flex-1"
            >
              {t("auth.login.leader")}
            </Button>
          </div>
        </div>
      )}

      <p className="text-center text-sm text-muted-foreground">
        Chưa có tài khoản?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Đăng ký
        </Link>
      </p>
    </form>
  );
}
