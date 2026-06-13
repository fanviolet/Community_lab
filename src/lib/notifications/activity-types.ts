/**
 * Activity Types
 * Shared types and constants for activity logging
 * This file does NOT use "use server" directive
 */

export interface ActivityLogInput {
  projectId?: string;
  userId: string;
  userName: string;
  action: string;
  description: string;
  metadata?: Record<string, unknown>;
}

/**
 * Activity event types that can be logged
 */
export const ActivityEvents = {
  TASK_ASSIGNED: "task_assigned",
  TASK_COMPLETED: "task_completed",
  MEMBER_ADDED: "member_added",
  PROJECT_UPDATED: "project_updated",
  PROJECT_CREATED: "project_created",
  PITCH_APPROVED: "pitch_approved",
  PITCH_REJECTED: "pitch_rejected",
  PITCH_REVISION_REQUESTED: "pitch_revision_requested",
  MENTION: "mention",
  AI_INSIGHT: "ai_insight",
} as const;
