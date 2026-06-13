"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Loader2 } from "lucide-react";
import { getRelativeTime } from "@/lib/notifications/relativeTime";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    await markAsRead(notification.id);
    setIsOpen(false);

    if (notification.link) {
      router.push(notification.link);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "task_assigned":
      case "task_completed":
        return "📋";
      case "member_added":
      case "project_updated":
        return "📁";
      case "pitch_approved":
      case "pitch_rejected":
      case "pitch_revision_requested":
        return "📝";
      case "mention":
        return "💬";
      case "ai_insight":
        return "🤖";
      default:
        return "🔔";
    }
  };

  // Group notifications by time
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, typeof notifications> = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    notifications.forEach((notification) => {
      const date = new Date(notification.created_at);
      let group = "Older";

      if (date.toDateString() === today.toDateString()) {
        group = "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        group = "Yesterday";
      } else if (date.getTime() > today.getTime() - 7 * 24 * 60 * 60 * 1000) {
        group = "This Week";
      }

      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(notification);
    });

    return groups;
  }, [notifications]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-10 rounded-xl border border-border/60 bg-white text-muted-foreground hover:border-primary/20 hover:bg-primary/5 hover:text-primary transition-all"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex size-5 rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold">Thông báo</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                Đánh dấu tất cả
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/notifications")}
              className="h-auto px-2 py-1 text-xs text-primary hover:text-primary"
            >
              Xem tất cả
            </Button>
          </div>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <Bell className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Chưa có thông báo</p>
            </div>
          ) : (
            Object.entries(groupedNotifications).map(([group, groupNotifications]) => (
              <div key={group}>
                <div className="px-4 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground">
                  {group === "Today" ? "Hôm nay" : group === "Yesterday" ? "Hôm qua" : group === "This Week" ? "Tuần này" : "Cũ hơn"}
                </div>
                {groupNotifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "w-full border-b px-4 py-3 text-left transition-colors hover:bg-muted/50 cursor-pointer",
                      !notification.is_read && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className="text-xl flex-shrink-0">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-sm line-clamp-2",
                            !notification.is_read ? "font-semibold text-foreground" : "text-muted-foreground"
                          )}
                        >
                          {notification.message}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {getRelativeTime(notification.created_at)}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        </div>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
