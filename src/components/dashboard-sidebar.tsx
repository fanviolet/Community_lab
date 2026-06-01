"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { dashboardNavItems } from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils";

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-white/10 bg-[#0f1117] text-zinc-300">
      <div className="flex h-[70px] items-center border-b border-white/10 px-5">
        <Link
          href="/dashboard"
          className="text-sm font-semibold leading-snug tracking-tight text-white transition-opacity hover:opacity-90"
        >
          Community Project Lab
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {dashboardNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white",
              )}
            >
              <item.icon
                className={cn(
                  "size-4 shrink-0 transition-colors duration-200",
                  isActive ? "text-blue-400" : "text-zinc-500 group-hover:text-zinc-300",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-white/10 px-3 py-4">
        <LogoutButton />
        <p className="px-3 text-xs text-zinc-500">Student-led innovation</p>
      </div>
    </aside>
  );
}
