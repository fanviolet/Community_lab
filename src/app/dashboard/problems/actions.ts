"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications/createNotification";

export interface CreateProblemCommentInput {
  problem_id: string;
  content: string;
}

export async function createProblemComment(input: CreateProblemCommentInput) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Bạn phải đăng nhập để đăng bình luận.");
  }

  // Get user's name for notification
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const userName = profile?.display_name || user.email;

  // Insert comment
  const { data: comment, error } = await supabase
    .from("problem_comments")
    .insert({
      problem_id: input.problem_id,
      user_id: user.id,
      content: input.content.trim(),
    })
    .select()
    .single();

  if (error) {
    console.error("[createProblemComment] Error:", error);
    throw error;
  }

  // Check for mentions and create notifications
  const mentionRegex = /@(\w+)/g;
  const mentions = input.content.match(mentionRegex);
  if (mentions) {
    for (const mention of mentions) {
      const displayName = mention.substring(1);
      const { data: mentionedUser } = await supabase
        .from("profiles")
        .select("id")
        .ilike("display_name", displayName)
        .maybeSingle();

      if (mentionedUser && mentionedUser.id !== user.id) {
        try {
          await createNotification({
            userId: mentionedUser.id,
            type: "mention",
            message: `${userName} đã nhắc đến bạn trong một bình luận về vấn đề`,
            link: `/dashboard/problems/${input.problem_id}`,
          });
          console.log("[createProblemComment] Notification created for user:", mentionedUser.id);
        } catch (notificationError) {
          console.error("[createProblemComment] Notification error:", notificationError);
          // Don't throw - comment was created successfully
        }
      }
    }
  }

  revalidatePath(`/dashboard/problems/${input.problem_id}`);
  return comment;
}
