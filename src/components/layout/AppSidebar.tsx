"use client";

import Link from "next/link";
import { useMemo, useEffect, useState } from "react";
import { usePathname, useParams } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { createClient } from "@/lib/supabase/client";
import { useRBAC } from "@/contexts/rbac-context";
import { groupSidebarNavItems } from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils";
import { RoleBadge } from "@/components/layout/RoleBadge";
import { t } from "@/hooks/useTranslation";
import type { GroupSummary } from "@/lib/groups/types";
import {
  Users,
  Compass,
  User,
  Building2,
  ChevronDown,
} from "lucide-react";

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
  const pathname = usePathname();
  const params = useParams();
  const rbac = useRBAC();
  const [groups, setGroups] = useState<GroupSummary[]>([]);

  const isInGroupContext = useMemo(
    () => pathname.startsWith("/dashboard/groups/"),
    [pathname],
  );

  const activeGroupId = params.id as string | undefined;

  // Check if user is actually a member of the active group
  const isMemberOfActiveGroup = useMemo(() => {
    if (!activeGroupId) return false;
    return groups.some((g) => g.id === activeGroupId);
  }, [activeGroupId, groups]);

  // Get the active group object
  const activeGroup = useMemo(() => {
    if (!activeGroupId || !isMemberOfActiveGroup) return null;
    return groups.find((g) => g.id === activeGroupId) || null;
  }, [activeGroupId, isMemberOfActiveGroup, groups]);

  useEffect(() => {
    async function loadGroups() {
      const supabase = createClient();
      const { data } = await supabase
        .from("group_members")
        .select(
          `
          group:groups (
            id,
            name,
            slug,
            description,
            is_public,
            created_at
          )
        `,
        )
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id);

      setGroups(
        data
          ?.map((row) => {
            const group = Array.isArray(row.group) ? row.group[0] : row.group;
            return group as GroupSummary | null;
          })
          .filter((group): group is GroupSummary => group !== null) ?? [],
      );
    }

    loadGroups();
  }, []);

  const isGroupNavActive = (href: string) => {
    const parts = pathname.split("/");
    const currentSegment = parts[parts.length - 1];
    return currentSegment === href || pathname.endsWith(`/${href}`);
  };

  const visibleGroupNavItems = useMemo(() => {
    return groupSidebarNavItems.filter((item) => {
      if (item.roles && !item.roles.includes(rbac.role)) {
        return false;
      }
      if (!item.permission) {
        return true;
      }
      return rbac.hasPermission(item.permission);
    });
  }, [rbac]);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-border bg-card text-foreground transition-transform duration-300 md:static md:z-40 md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      <div className="flex h-14 items-center border-b border-border px-4">
        <Link
          href="/dashboard"
          className="text-sm font-semibold leading-snug tracking-tight text-foreground transition-opacity hover:opacity-90"
          onClick={onClose}
        >
          {t("landing.hero.title")}
        </Link>
      </div>

      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <RoleBadge />
      </div>

      <nav className="flex-1 space-y-0 overflow-y-auto px-2 py-3">
        {/* Level 1: Global Navigation */}
        <div className="space-y-0.5">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Global
          </p>
          <Link
            href="/dashboard/groups"
            onClick={onClose}
            className={cn(
              "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
              pathname === "/dashboard/groups" && !isInGroupContext
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Users className="size-4 shrink-0" />
            <span>{t("navigation.community")}</span>
          </Link>
          <Link
            href="/dashboard/groups"
            onClick={onClose}
            className={cn(
              "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
              pathname === "/dashboard/groups" && !isInGroupContext
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Compass className="size-4 shrink-0" />
            <span>{t("navigation.explore")}</span>
          </Link>
          <Link
            href="/dashboard/profile"
            onClick={onClose}
            className={cn(
              "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
              pathname === "/dashboard/profile"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <User className="size-4 shrink-0" />
            <span>{t("navigation.profile")}</span>
          </Link>
        </div>

        {/* Level 2: Group Navigation (only visible when user is a member of the active group) */}
        {isInGroupContext && activeGroupId && isMemberOfActiveGroup && activeGroup && (
          <div className="mt-4 space-y-0.5 border-t border-border pt-4">
            <div className="flex items-center gap-2 px-3 py-2">
              <Building2 className="size-4 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Current Group
                </p>
                <p className="text-sm font-medium text-foreground truncate">
                  {activeGroup.name}
                </p>
              </div>
            </div>
            {visibleGroupNavItems.map((item) => {
              const active = isGroupNavActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={`/dashboard/groups/${activeGroupId}/${item.href}`}
                  onClick={onClose}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon
                    className={cn(
                      "size-4 shrink-0 transition-colors duration-200",
                      active
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  />
                  {t(`navigation.${item.label}`)}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <div className="space-y-2 border-t border-border px-3 py-3">
        <LogoutButton />
        <p className="px-3 text-xs text-muted-foreground">
          {t("sidebar.studentDrivenInnovation")}
        </p>
      </div>
    </aside>
  );
}