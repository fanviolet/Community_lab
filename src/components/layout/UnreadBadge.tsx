"use client";

import { useNotifications } from "@/hooks/useNotifications";
import { Badge } from "@/components/ui/badge";

export function UnreadBadge() {
  const { unreadCount } = useNotifications();

  if (unreadCount === 0) return null;

  return (
    <Badge
      variant="default"
      className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs bg-destructive text-destructive-foreground"
    >
      {unreadCount > 9 ? "9+" : unreadCount}
    </Badge>
  );
}
