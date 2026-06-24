"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { useRBAC } from "@/contexts/rbac-context";
import { dashboardNavSections } from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils";
import { RoleBadge } from "@/components/layout/RoleBadge";

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
  const pathname = usePathname();
  const rbac = useRBAC();

  const visibleNavSections = dashboardNavSections.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (item.roles && !item.roles.includes(rbac.role)) {
        return false;
      }

      if (!item.permission) {
        return true;
      }

      return rbac.hasPermission(item.permission);
    }),
  })).filter((section) => section.items.length > 0);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-border bg-card text-foreground transition-transform duration-300 md:static md:z-40 md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex h-16 items-center border-b border-border px-5">
        <Link
          href="/dashboard"
          className="text-sm font-semibold leading-snug tracking-tight text-foreground transition-opacity hover:opacity-90"
          onClick={onClose}
        >
          Community Project Lab
        </Link>
      </div>

      <div className="flex items-center gap-3 border-b border-border px-5 py-3">
        <RoleBadge />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {visibleNavSections.map((section) => (
          <div key={section.title} className="space-y-2">
            <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
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
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon
                    className={cn(
                      "size-4 shrink-0 transition-colors duration-200",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="space-y-2 border-t border-border px-3 py-4">
        <LogoutButton />
        <p className="px-3 text-xs text-muted-foreground">Sự đổi mới do học sinh dẫn dắt</p>
      </div>
    </aside>
  );
}
