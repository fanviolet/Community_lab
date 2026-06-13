"use client";

import { useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRelativeTime } from "@/lib/notifications/relativeTime";
import { Bell, Check, CheckCheck, Trash2, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type FilterType = "all" | "unread" | "tasks" | "projects" | "proposals" | "mentions" | "ai";

const filterLabels: Record<FilterType, string> = {
  all: "Tất cả",
  unread: "Chưa đọc",
  tasks: "Nhiệm vụ",
  projects: "Dự án",
  proposals: "Đề xuất",
  mentions: "Nhắc đến",
  ai: "AI Insights",
};

const typeToFilter: Record<string, FilterType> = {
  task_assigned: "tasks",
  task_completed: "tasks",
  member_added: "projects",
  project_updated: "projects",
  pitch_approved: "proposals",
  pitch_rejected: "proposals",
  pitch_revision_requested: "proposals",
  mention: "mentions",
  ai_insight: "ai",
  general: "all",
};

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, refresh } = useNotifications();
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.is_read;
    return typeToFilter[n.type] === filter;
  });

  const handleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleMarkSelectedAsRead = async () => {
    for (const id of selectedIds) {
      await markAsRead(id);
    }
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = async () => {
    // Implement delete functionality
    setSelectedIds(new Set());
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

  const groupedNotifications = filteredNotifications.reduce((acc, notification) => {
    const date = new Date(notification.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let group = "Older";
    if (date.toDateString() === today.toDateString()) {
      group = "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      group = "Yesterday";
    } else if (date.getTime() > today.getTime() - 7 * 24 * 60 * 60 * 1000) {
      group = "This Week";
    }

    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(notification);
    return acc;
  }, {} as Record<string, typeof notifications>);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Thông báo</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : "Không có thông báo mới"}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead} size="sm">
              <CheckCheck className="w-4 h-4 mr-2" />
              Đánh dấu tất cả đã đọc
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                {filterLabels[filter]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.entries(filterLabels).map(([key, label]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => setFilter(key as FilterType)}
                  className={filter === key ? "bg-accent" : ""}
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex gap-2 mb-4 p-4 bg-accent rounded-lg">
          <Button variant="outline" size="sm" onClick={handleMarkSelectedAsRead}>
            <Check className="w-4 h-4 mr-2" />
            Đánh dấu đã đọc ({selectedIds.size})
          </Button>
          <Button variant="outline" size="sm" onClick={handleDeleteSelected}>
            <Trash2 className="w-4 h-4 mr-2" />
            Xóa ({selectedIds.size})
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
            Hủy
          </Button>
        </div>
      )}

      {Object.entries(groupedNotifications).map(([group, groupNotifications]) => (
        <div key={group} className="mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">{group}</h3>
          <div className="space-y-2">
            {groupNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-4 cursor-pointer transition-colors hover:bg-accent ${
                  !notification.is_read ? "border-l-4 border-l-primary bg-accent/50" : ""
                } ${selectedIds.has(notification.id) ? "bg-accent" : ""}`}
                onClick={() => handleSelect(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1">
                    <p className={`font-medium ${!notification.is_read ? "font-semibold" : ""}`}>
                      {notification.message}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getRelativeTime(new Date(notification.created_at))}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {filteredNotifications.length === 0 && (
        <div className="text-center py-12">
          <Bell className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg">
            {filter === "all"
              ? "Bạn chưa có thông báo nào"
              : `Không có thông báo ${filterLabels[filter].toLowerCase()}`}
          </p>
        </div>
      )}
    </div>
  );
}
