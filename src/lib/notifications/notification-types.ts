/**
 * Notification Types
 * Shared types for notification system
 * This file does NOT use "use server" directive
 */

export type NotificationType =
  | "task_assigned"
  | "task_completed"
  | "member_added"
  | "project_updated"
  | "pitch_approved"
  | "pitch_rejected"
  | "pitch_revision_requested"
  | "mention"
  | "ai_insight"
  | "group_join_request"
  | "group_join_approved"
  | "group_join_rejected"
  | "group_member_added"
  | "group_member_removed"
  | "general";

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  message: string;
  link?: string;
  logActivity?: {
    projectId?: string;
    actorUserId: string;
    actorUserName: string;
  };
}
