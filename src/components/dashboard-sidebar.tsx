"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { useRBAC } from "@/contexts/rbac-context";
import { dashboardNavSections } from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils";
import { t } from "@/hooks/useTranslation";

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const rbac = useRBAC();

  const visibleNavSections = dashboardNavSections.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      // Check role requirement
      if (item.roles && !item.roles.includes(rbac.role)) {
        return false;
      }

      // Check permission requirement
      if (!item.permission) {
        return true;
      }

      return rbac.hasPermission(item.permission);
    }),
  })).filter((section) => section.items.length > 0);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-white/10 bg-[#0f1117] text-zinc-300 transition-transform duration-300 md:static md:z-40 md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex h-16 items-center border-b border-white/10 px-5">
        <Link
          href="/dashboard"
          className="text-sm font-semibold leading-snug tracking-tight text-white transition-opacity hover:opacity-90"
          onClick={onClose}
        >
          {t("landing.hero.title")}
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {visibleNavSections.map((section) => (
          <div key={section.title} className="space-y-2">
            <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {t(`navigation.${section.title.toLowerCase()}`)}
            </h3>
            {section.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
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
                  {t(`navigation.${item.label}`)}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="space-y-2 border-t border-white/10 px-3 py-4">
        <LogoutButton />
        <p className="px-3 text-xs text-zinc-500">{t("sidebar.studentDrivenInnovation")}</p>
      </div>
    </aside>
  );
}
