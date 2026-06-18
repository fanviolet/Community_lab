"use client";

import { useEffect, useState, useCallback } from "react";
import { notificationService, type NotificationData } from "@/lib/notifications/notification-service";

/**
 * useNotifications Hook
 * Custom hook for managing notifications with realtime updates
 */
export function useNotifications() {
  const [data, setData] = useState<NotificationData>({
    notifications: [],
    unreadCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Refresh notifications with optimistic updates
  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const newData = await notificationService.fetchNotificationData();
      setData(newData);
    } catch (error) {
      console.error("[useNotifications] Error refreshing:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mark notification as read with optimistic update
  const markAsRead = useCallback(
    async (notificationId: string) => {
      // Optimistic update
      setData((prev) => ({
        ...prev,
        unreadCount: Math.max(0, prev.unreadCount - 1),
        notifications: prev.notifications.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        ),
      }));

      // Server update
      const success = await notificationService.markAsRead(notificationId);
      if (!success) {
        // Revert on failure
        await refresh();
      }
    },
    [refresh]
  );

  // Mark all as read with optimistic update
  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    setData((prev) => ({
      ...prev,
      unreadCount: 0,
      notifications: prev.notifications.map((n) => ({ ...n, is_read: true })),
    }));

    // Server update
    const success = await notificationService.markAllAsRead();
    if (!success) {
      // Revert on failure
      await refresh();
    }
  }, [refresh]);

  // Setup realtime subscription
  useEffect(() => {
    let mounted = true;

    // Initial load
    const loadData = async () => {
      if (mounted) {
        await refresh();
      }
    };
    loadData();

    // Subscribe to realtime updates
    const cleanup = notificationService.subscribe(() => {
      if (mounted) {
        refresh();
      }
    });

    return () => {
      mounted = false;
      cleanup();
    };
  }, [refresh]);

  return {
    notifications: data.notifications,
    unreadCount: data.unreadCount,
    isLoading,
    refresh,
    markAsRead,
    markAllAsRead,
  };
}
