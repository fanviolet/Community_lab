"use server";

import { createClient } from "@/lib/supabase/server";
import { logActivity } from "./activity-logger";
import { ActivityEvents } from "./activity-types";
import { NotificationType, CreateNotificationParams } from "./notification-types";

interface NotificationPreferences {
  enable_notifications: boolean;
  enable_task_notifications?: boolean;
  enable_project_notifications?: boolean;
  enable_pitch_notifications?: boolean;
  enable_mention_notifications?: boolean;
  enable_ai_notifications?: boolean;
}

/**
 * Creates a notification for a user.
 * This is a generic server action that can be called from various features.
 * Respects user notification preferences.
 * Optionally logs activity for the activity feed.
 */
export async function createNotification({
  userId,
  type,
  message,
  link,
  logActivity: logActivityInput,
}: CreateNotificationParams) {
  const supabase = await createClient();

  console.log("[createNotification] Creating notification for user:", userId, "type:", type);

  // Check user notification preferences
  const { data: prefs, error: prefsError } = await supabase
    .rpc("get_or_create_user_prefs", { p_user_id: userId });

  if (prefsError) {
    console.error("[createNotification] Error fetching preferences for user:", userId, prefsError);
    // Don't block notification creation on preference errors
  }

  if (!prefs || !prefs.enable_notifications) {
    console.log("[createNotification] Notifications disabled for user:", userId, "prefs:", prefs);
    return null;
  }

  console.log("[createNotification] Preferences OK for user:", userId);

  // Check type-specific preferences
  const typeEnabled = checkTypePreference(type, prefs);
  if (!typeEnabled) {
    console.log("[createNotification] Notification type disabled for user:", userId, type);
    return null;
  }

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      type,
      message,
      link,
      is_read: false,
    })
    .select()
    .single();

  if (error) {
    console.error("[createNotification] Error:", error);
    throw error;
  }

  // Optionally log activity for activity feed
  if (logActivityInput) {
    const activityAction = mapNotificationToActivity(type);
    if (activityAction) {
      try {
        await logActivity({
          projectId: logActivityInput.projectId,
          userId: logActivityInput.actorUserId,
          userName: logActivityInput.actorUserName,
          action: activityAction,
          description: message,
          metadata: { notificationId: data.id, notificationType: type },
        });
      } catch (activityError) {
        console.error("[createNotification] Activity logging error:", activityError);
        // Don't throw - notification was created successfully
      }
    }
  }

  return data;
}

/**
 * Check if a notification type is enabled based on user preferences
 */
function checkTypePreference(
  type: NotificationType,
  prefs: NotificationPreferences
): boolean {
  switch (type) {
    case "task_assigned":
    case "task_completed":
      return prefs.enable_task_notifications ?? true;
    case "member_added":
    case "project_updated":
      return prefs.enable_project_notifications ?? true;
    case "pitch_approved":
    case "pitch_rejected":
    case "pitch_revision_requested":
      return prefs.enable_pitch_notifications ?? true;
    case "mention":
      return prefs.enable_mention_notifications ?? true;
    case "ai_insight":
      return prefs.enable_ai_notifications ?? true;
    case "general":
      return true;
    default:
      return true;
  }
}

/**
 * Map notification type to activity action
 */
function mapNotificationToActivity(type: NotificationType): string | null {
  switch (type) {
    case "task_assigned":
      return ActivityEvents.TASK_ASSIGNED;
    case "task_completed":
      return ActivityEvents.TASK_COMPLETED;
    case "member_added":
      return ActivityEvents.MEMBER_ADDED;
    case "project_updated":
      return ActivityEvents.PROJECT_UPDATED;
    case "pitch_approved":
      return ActivityEvents.PITCH_APPROVED;
    case "pitch_rejected":
      return ActivityEvents.PITCH_REJECTED;
    case "pitch_revision_requested":
      return ActivityEvents.PITCH_REVISION_REQUESTED;
    case "mention":
      return ActivityEvents.MENTION;
    case "ai_insight":
      return ActivityEvents.AI_INSIGHT;
    default:
      return null;
  }
}
