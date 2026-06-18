"use client";

import { Menu } from "lucide-react";
import { Search } from "lucide-react";
import { usePathname } from "next/navigation";

import { Input } from "@/components/ui/input";
import { dashboardPageTitles } from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { UserDropdown } from "@/components/user-dropdown";

interface DashboardHeaderProps {
  onMenuClick: () => void;
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const pathname = usePathname();
  const title = dashboardPageTitles[pathname] ?? "Bảng điều khiển";

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border/60 bg-white/80 px-6">
      {/* Hamburger menu button - mobile only */}
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Mở menu điều hướng"
        className={cn(
          "flex size-10 items-center justify-center rounded-xl border border-border/60 bg-white text-muted-foreground transition-all duration-200",
          "hover:border-primary/20 hover:bg-primary/5 hover:text-primary",
          "md:hidden"
        )}
      >
        <Menu className="size-4" />
      </button>

      <h1 className="min-w-0 shrink-0 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
        {title}
      </h1>

      <div className="relative mx-auto hidden max-w-md flex-1 md:block">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Tìm kiếm vấn đề, thảo luận, dự án..."
          className="h-10 rounded-xl border-border/80 bg-muted/40 pl-9 transition-colors focus-visible:bg-white"
        />
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <NotificationBell />
        <UserDropdown />
      </div>
    </header>
  );
}
