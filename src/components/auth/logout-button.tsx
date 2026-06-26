"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";

import { createClient } from "@/lib/supabase";
import { t } from "@/hooks/useTranslation";
import { getSupabaseConfigError } from "@/lib/supabase-env";
import { cn } from "@/lib/utils";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    if (getSupabaseConfigError()) {
      router.push("/login");
      router.refresh();
      return;
    }

    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout error:", err);
    }

    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 transition-all duration-200",
        "hover:bg-white/5 hover:text-white disabled:opacity-50",
      )}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <LogOut className="size-4 shrink-0" />
      )}
      {t("auth.logout")}
    </button>
  );
}
