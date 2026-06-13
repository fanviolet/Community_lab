"use server";

import { createClient } from "@/lib/supabase/server";
import { ActivityLogInput } from "./activity-types";

/**
 * Activity Logger
 * Helper function to log activity events for the activity feed
 * This can be called alongside createNotification to create activity log entries
 */

/**
 * Log an activity event
 * This creates an entry in the activities table for the activity feed
 */
export async function logActivity(input: ActivityLogInput) {
  const supabase = await createClient();

  const { error } = await supabase.from("activities").insert({
    project_id: input.projectId,
    user_id: input.userId,
    user_name: input.userName,
    action: input.action,
    description: input.description,
    metadata: input.metadata,
  });

  if (error) {
    console.error("[logActivity] Error:", error);
    throw error;
  }

  return { success: true };
}
