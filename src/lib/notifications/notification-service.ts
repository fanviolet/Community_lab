import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface Notification {
  id: string;
  user_id: string;
  type: "task_assigned" | "pitch_approved" | "pitch_rejected" | "mention" | "general";
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationData {
  notifications: Notification[];
  unreadCount: number;
}

/**
 * Notification Service
 * Centralized service for notification operations
 */
class NotificationService {
  private supabase = createClient();
  private channel: RealtimeChannel | null = null;
  private userId: string | null = null;

  /**
   * Get current user ID
   */
  private async getUserId(): Promise<string | null> {
    if (this.userId) return this.userId;

    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    this.userId = user?.id ?? null;
    return this.userId;
  }

  /**
   * Fetch notifications and unread count in a single query
   */
  async fetchNotificationData(): Promise<NotificationData> {
    const userId = await this.getUserId();
    if (!userId) {
      return { notifications: [], unreadCount: 0 };
    }

    // Fetch notifications
    const { data: notifications, error: notificationsError } = await this.supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (notificationsError) {
      console.error("[NotificationService] Error fetching notifications:", notificationsError);
      return { notifications: [], unreadCount: 0 };
    }

    // Count unread
    const { count, error: countError } = await this.supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (countError) {
      console.error("[NotificationService] Error counting unread:", countError);
    }

    return {
      notifications: (notifications as Notification[]) ?? [],
      unreadCount: count ?? 0,
    };
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) {
      console.error("[NotificationService] Error marking as read:", error);
      return false;
    }

    return true;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<boolean> {
    const userId = await this.getUserId();
    if (!userId) return false;

    const { error } = await this.supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      console.error("[NotificationService] Error marking all as read:", error);
      return false;
    }

    return true;
  }

  /**
   * Subscribe to realtime notifications
   * Returns a cleanup function
   */
  subscribe(onChange: () => void): () => void {
    let cleanupCalled = false;

    const setupSubscription = async () => {
      if (cleanupCalled) return;

      const userId = await this.getUserId();
      if (!userId) return;

      // Use unique channel name per user to avoid conflicts
      const channelName = `notifications:${userId}`;

      // Remove existing channel if any
      if (this.channel) {
        await this.supabase.removeChannel(this.channel);
      }

      // Create new subscription - ensure .on() is called BEFORE .subscribe()
      this.channel = this.supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log("[NotificationService] Realtime event:", payload.eventType);
            onChange();
          }
        )
        .subscribe((status, err) => {
          console.log("[NotificationService] Subscription status:", status, err);
        });
    };

    setupSubscription();

    // Return cleanup function
    return () => {
      cleanupCalled = true;
      if (this.channel) {
        this.supabase.removeChannel(this.channel);
        this.channel = null;
      }
    };
  }

  /**
   * Reset user ID (call on logout)
   */
  reset(): void {
    this.userId = null;
    if (this.channel) {
      this.supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}

// Singleton instance
export const notificationService = new NotificationService();
