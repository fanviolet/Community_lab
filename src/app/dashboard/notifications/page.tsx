"use client";

import { useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { t } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRelativeTime } from "@/lib/notifications/relativeTime";
import { Bell, Check, CheckCheck, Trash2, Filter, CheckCircle, AlertCircle, MessageSquare, FileText, Users, Brain } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type FilterType = "all" | "unread" | "tasks" | "projects" | "proposals" | "mentions" | "ai";

const filterLabels: Record<FilterType, string> = {
  all: t("notifications.all"),
  unread: t("notifications.unread"),
  tasks: t("notifications.tasks"),
  projects: t("notifications.projects"),
  proposals: t("notifications.proposals"),
  mentions: t("notifications.mentions"),
  ai: t("notifications.aiInsights"),
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
    setSelectedIds(new Set());
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "task_assigned":
      case "task_completed":
        return <CheckCircle className="size-5 text-blue-500" />;
      case "member_added":
      case "project_updated":
        return <Users className="size-5 text-emerald-500" />;
      case "pitch_approved":
      case "pitch_rejected":
      case "pitch_revision_requested":
        return <FileText className="size-5 text-amber-500" />;
      case "mention":
        return <MessageSquare className="size-5 text-purple-500" />;
      case "ai_insight":
        return <Brain className="size-5 text-primary" />;
      default:
        return <Bell className="size-5 text-muted-foreground" />;
    }
  };

  const groupedNotifications = filteredNotifications.reduce((acc, notification) => {
    const date = new Date(notification.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let group = t("notifications.older");
    if (date.toDateString() === today.toDateString()) {
      group = t("notifications.today");
    } else if (date.toDateString() === yesterday.toDateString()) {
      group = t("notifications.yesterday");
    } else if (date.getTime() > today.getTime() - 7 * 24 * 60 * 60 * 1000) {
      group = t("notifications.thisWeek");
    }

    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(notification);
    return acc;
  }, {} as Record<string, typeof notifications>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-border/50 bg-gradient-to-r from-primary/10 to-primary/5 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/20">
              <Bell className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t("notifications.title")}</h1>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} ${t("notifications.unreadCount")}` : t("notifications.noNewNotifications")}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="outline" onClick={markAllAsRead} size="sm">
                <CheckCheck className="size-4 mr-2" />
                {t("notifications.markAllAsRead")}
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="size-4 mr-2" />
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
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{selectedIds.size} {t("notifications.selected")}</span>
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={handleMarkSelectedAsRead}>
                <Check className="size-4 mr-2" />
                {t("notifications.markAsRead")}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDeleteSelected}>
                <Trash2 className="size-4 mr-2" />
                {t("notifications.delete")}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                {t("notifications.cancel")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications List */}
      {Object.entries(groupedNotifications).map(([group, groupNotifications]) => (
        <div key={group} className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">{group}</h3>
          <div className="space-y-2">
            {groupNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`border-0 bg-white shadow-sm ring-1 ring-black/5 transition-all duration-200 cursor-pointer hover:shadow-md ${
                  !notification.is_read ? "bg-primary/5" : ""
                } ${selectedIds.has(notification.id) ? "ring-2 ring-primary" : ""}`}
                onClick={() => handleSelect(notification.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/50">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium ${!notification.is_read ? "font-semibold text-foreground" : "text-foreground"}`}>
                          {notification.message}
                        </p>
                        {!notification.is_read && (
                          <Badge variant="default" className="shrink-0 bg-primary">
                            {t("notifications.new")}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getRelativeTime(new Date(notification.created_at))}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                      >
                        <Check className="size-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Empty State */}
      {filteredNotifications.length === 0 && (
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="size-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {filter === "all"
                ? t("notifications.noNotificationsYet")
                : `${t("notifications.noNotificationsIn")} ${filterLabels[filter].toLowerCase()}`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
