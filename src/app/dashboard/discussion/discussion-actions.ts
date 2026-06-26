"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications/createNotification";
import type {
  DiscussionChannel,
  DiscussionMessage,
  DiscussionReaction,
  DiscussionThread,
  DiscussionThreadMessage,
  CreateChannelInput,
  CreateMessageInput,
  CreateThreadInput,
  CreateThreadMessageInput,
} from "./discussion-types";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

let mentionsTableAvailable = true;

async function getSupabaseClient() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Không có quyền truy cập");
  }

  return { supabase, user };
}

async function isProjectLeader(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  projectId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .eq("role", "leader")
    .maybeSingle();

  return !!data;
}

// ============================================================================
// CHANNEL ACTIONS
// ============================================================================

export async function getChannels(
  projectId?: string,
): Promise<DiscussionChannel[]> {
  const { supabase, user } = await getSupabaseClient();

  let query = supabase
    .from("discussion_channels")
    .select("*")
    .eq("is_archived", false)
    .order("created_at", { ascending: true });

  if (projectId) {
    query = query.eq("project_id", projectId);
  } else {
    query = query.is("project_id", null);
  }

  // Filter based on access
  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  // Filter channels user has access to
  const accessibleChannels = (data ?? []).filter(
    (channel: DiscussionChannel) => {
      if (channel.is_public) return true;
      if (channel.project_id) {
        // Check if user is project member
        // This is handled by RLS, but we can add additional client-side filtering if needed
        return true;
      }
      return false;
    },
  );

  return accessibleChannels;
}

export async function getChannel(
  channelId: string,
): Promise<DiscussionChannel | null> {
  const { supabase } = await getSupabaseClient();

  const { data, error } = await supabase
    .from("discussion_channels")
    .select("*")
    .eq("id", channelId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createChannel(
  input: CreateChannelInput,
): Promise<DiscussionChannel> {
  const { supabase, user } = await getSupabaseClient();

  // If project-specific, check if user is leader
  if (input.project_id) {
    const isLeader = await isProjectLeader(supabase, user.id, input.project_id);
    if (!isLeader) {
      throw new Error("Chỉ trưởng dự án mới có thể tạo kênh dự án");
    }
  }

  const { data, error } = await supabase
    .from("discussion_channels")
    .insert({
      name: input.name.toLowerCase().replace(/\s+/g, "-"),
      description: input.description,
      is_public: input.is_public ?? true,
      channel_type: input.channel_type ?? "text",
      project_id: input.project_id,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/discussion");
  return data;
}

export async function updateChannel(
  channelId: string,
  updates: Partial<CreateChannelInput>,
): Promise<DiscussionChannel> {
  const { supabase, user } = await getSupabaseClient();

  // Check if user is the creator
  const { data: channel } = await supabase
    .from("discussion_channels")
    .select("created_by, project_id")
    .eq("id", channelId)
    .single();

  if (!channel) {
    throw new Error("Không tìm thấy kênh");
  }

  if (channel.created_by !== user.id) {
    throw new Error("Chỉ người tạo kênh mới có thể cập nhật kênh");
  }

  const { data, error } = await supabase
    .from("discussion_channels")
    .update({
      ...updates,
      name: updates.name
        ? updates.name.toLowerCase().replace(/\s+/g, "-")
        : undefined,
    })
    .eq("id", channelId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/discussion");
  return data;
}

export async function archiveChannel(channelId: string): Promise<void> {
  const { supabase, user } = await getSupabaseClient();

  // Check if user is leader of the project or channel creator
  const { data: channel } = await supabase
    .from("discussion_channels")
    .select("created_by, project_id")
    .eq("id", channelId)
    .single();

  if (!channel) {
    throw new Error("Không tìm thấy kênh");
  }

  if (channel.project_id) {
    const isLeader = await isProjectLeader(
      supabase,
      user.id,
      channel.project_id,
    );
    if (!isLeader && channel.created_by !== user.id) {
      throw new Error(
        "Chỉ trưởng dự án hoặc người tạo kênh mới có thể lưu trữ kênh",
      );
    }
  } else if (channel.created_by !== user.id) {
    throw new Error("Chỉ người tạo kênh mới có thể lưu trữ kênh");
  }

  const { error } = await supabase
    .from("discussion_channels")
    .update({
      is_archived: true,
      archived_at: new Date().toISOString(),
    })
    .eq("id", channelId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/discussion");
}

// ============================================================================
// MESSAGE ACTIONS
// ============================================================================

export async function getMessages(
  channelId: string,
  limit: number = 50,
): Promise<DiscussionMessage[]> {
  const { supabase } = await getSupabaseClient();

  // First, get messages with basic data
  const { data: messages, error } = await supabase
    .from("discussion_messages")
    .select(
      `
      *,
      user:user_id(id, display_name, username, avatar_url, email),
      reactions:discussion_reactions(id, user_id, emoji, user:user_id(display_name, username))
    `,
    )
    .eq("channel_id", channelId)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  if (!messages || messages.length === 0) {
    return [];
  }

  // Then, fetch mentions separately for each message
  // Note: PostgREST doesn't auto-detect the relationship between discussion_messages and message_mentions
  // because the FK column is named 'message_id' instead of 'discussion_message_id'
  if (!mentionsTableAvailable) {
    return messages;
  }

  const messageIds = messages.map((m: DiscussionMessage) => m.id);
  const { data: mentionsData, error: mentionsError } = await supabase
    .from("message_mentions")
    .select(
      `
      id,
      message_id,
      mentioned_user_id,
      created_at,
      mentioned_user:user_id(id, username, display_name, avatar_url, role)
    `,
    )
    .in("message_id", messageIds);

  if (mentionsError) {
    const errorMessage = mentionsError.message ?? "";
    if (
      mentionsError.code === "42P01" ||
      errorMessage.includes("message_mentions")
    ) {
      mentionsTableAvailable = false;
      return messages;
    }
    console.error("Error fetching mentions:", mentionsError);
    // Return messages without mentions rather than failing completely
    return messages;
  }

  // Group mentions by message_id
  const mentionsByMessage = new Map<string, any[]>();
  if (mentionsData) {
    for (const mention of mentionsData) {
      const existing = mentionsByMessage.get(mention.message_id) || [];
      existing.push(mention);
      mentionsByMessage.set(mention.message_id, existing);
    }
  }

  // Attach mentions to each message
  const messagesWithMentions = messages.map((message: DiscussionMessage) => ({
    ...message,
    mentions: mentionsByMessage.get(message.id) || [],
  }));

  return messagesWithMentions;
}

export async function getMessage(
  messageId: string,
): Promise<DiscussionMessage | null> {
  const { supabase } = await getSupabaseClient();

  const { data, error } = await supabase
    .from("discussion_messages")
    .select(
      `
      *,
      user:user_id(id, display_name, username, avatar_url, email),
      reactions:discussion_reactions(id, user_id, emoji, user:user_id(display_name, username))
    `,
    )
    .eq("id", messageId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createMessage(
  input: CreateMessageInput,
): Promise<DiscussionMessage> {
  const { supabase, user } = await getSupabaseClient();

  // Get user profile for notification
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const userName = userProfile?.display_name || user.email || "Một người dùng";

  // Check if user has access to the channel
  const { data: channel } = await supabase
    .from("discussion_channels")
    .select("is_public, project_id")
    .eq("id", input.channel_id)
    .single();

  if (!channel) {
    throw new Error("Không tìm thấy kênh");
  }

  if (!channel.is_public && channel.project_id) {
    const { data: membership } = await supabase
      .from("project_members")
      .select("id")
      .eq("project_id", channel.project_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      throw new Error("Bạn phải là thành viên dự án để đăng trong kênh này");
    }
  }

  const { data, error } = await supabase
    .from("discussion_messages")
    .insert({
      channel_id: input.channel_id,
      user_id: user.id,
      content: input.content,
      reply_to_id: input.reply_to_id,
    })
    .select(
      `
      *,
      user:user_id(id, display_name, username, avatar_url, email)
    `,
    )
    .single();

  if (error) {
    throw new Error(error.message);
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
            message: `${userName} đã nhắc đến bạn trong một tin nhắn`,
            link: `/dashboard/discussion?channel=${input.channel_id}`,
          });
          console.log(
            "[createMessage] Mention notification created for user:",
            mentionedUser.id,
          );
        } catch (notificationError) {
          console.error(
            "[createMessage] Mention notification creation failed for user:",
            mentionedUser.id,
            notificationError,
          );
          // Don't throw - message was created successfully
        }
      }
    }
  }

  revalidatePath("/dashboard/discussion");
  return data;
}

export async function updateMessage(
  messageId: string,
  content: string,
): Promise<DiscussionMessage> {
  const { supabase, user } = await getSupabaseClient();

  // Check if user is the author
  const { data: message } = await supabase
    .from("discussion_messages")
    .select("user_id")
    .eq("id", messageId)
    .single();

  if (!message) {
    throw new Error("Không tìm thấy tin nhắn");
  }

  if (message.user_id !== user.id) {
    throw new Error("Chỉ tác giả tin nhắn mới có thể sửa");
  }

  const { data, error } = await supabase
    .from("discussion_messages")
    .update({
      content,
      edited: true,
      edited_at: new Date().toISOString(),
    })
    .eq("id", messageId)
    .select(
      `
      *,
      user:user_id(id, display_name, username, avatar_url, email)
    `,
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/discussion");
  return data;
}

export async function deleteMessage(messageId: string): Promise<void> {
  const { supabase, user } = await getSupabaseClient();

  // Check if user is the author
  const { data: message } = await supabase
    .from("discussion_messages")
    .select("user_id")
    .eq("id", messageId)
    .single();

  if (!message) {
    throw new Error("Không tìm thấy tin nhắn");
  }

  if (message.user_id !== user.id) {
    throw new Error("Chỉ tác giả tin nhắn mới có thể xóa");
  }

  const { error } = await supabase
    .from("discussion_messages")
    .delete()
    .eq("id", messageId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/discussion");
}

export async function pinMessage(
  messageId: string,
): Promise<DiscussionMessage> {
  const { supabase, user } = await getSupabaseClient();

  // Check if user is a leader of the channel's project
  const { data: message } = await supabase
    .from("discussion_messages")
    .select(
      `
      channel_id,
      channel:channel_id!inner(project_id)
    `,
    )
    .eq("id", messageId)
    .single();

  if (!message) {
    throw new Error("Không tìm thấy tin nhắn");
  }

  const channelData = message.channel as any;
  if (channelData?.project_id) {
    const isLeader = await isProjectLeader(
      supabase,
      user.id,
      channelData.project_id,
    );
    if (!isLeader) {
      throw new Error("Chỉ trưởng dự án mới có thể ghim tin nhắn");
    }
  } else {
    throw new Error("Chỉ kênh dự án mới hỗ trợ ghim");
  }

  const { data, error } = await supabase
    .from("discussion_messages")
    .update({
      pinned: true,
      pinned_at: new Date().toISOString(),
      pinned_by: user.id,
    })
    .eq("id", messageId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/discussion");
  return data;
}

export async function unpinMessage(
  messageId: string,
): Promise<DiscussionMessage> {
  const { supabase, user } = await getSupabaseClient();

  // Check if user is a leader of the channel's project
  const { data: message } = await supabase
    .from("discussion_messages")
    .select(
      `
      channel_id,
      channel:channel_id!inner(project_id)
    `,
    )
    .eq("id", messageId)
    .single();

  if (!message) {
    throw new Error("Không tìm thấy tin nhắn");
  }

  const channelData = message.channel as any;
  if (channelData?.project_id) {
    const isLeader = await isProjectLeader(
      supabase,
      user.id,
      channelData.project_id,
    );
    if (!isLeader) {
      throw new Error("Chỉ trưởng dự án mới có thể bỏ ghim tin nhắn");
    }
  } else {
    throw new Error("Chỉ kênh dự án mới hỗ trợ ghim");
  }

  const { data, error } = await supabase
    .from("discussion_messages")
    .update({
      pinned: false,
      pinned_at: null,
      pinned_by: null,
    })
    .eq("id", messageId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/discussion");
  return data;
}

// ============================================================================
// REACTION ACTIONS
// ============================================================================

export async function addReaction(
  messageId: string,
  emoji: string,
): Promise<DiscussionReaction> {
  const { supabase, user } = await getSupabaseClient();

  const { data, error } = await supabase
    .from("discussion_reactions")
    .insert({
      message_id: messageId,
      user_id: user.id,
      emoji,
    })
    .select(
      `
      *,
      user:user_id(display_name, username)
    `,
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/discussion");
  return data;
}

export async function removeReaction(
  messageId: string,
  emoji: string,
): Promise<void> {
  const { supabase, user } = await getSupabaseClient();

  const { error } = await supabase
    .from("discussion_reactions")
    .delete()
    .eq("message_id", messageId)
    .eq("user_id", user.id)
    .eq("emoji", emoji);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/discussion");
}

export async function getMessageReactions(
  messageId: string,
): Promise<DiscussionReaction[]> {
  const { supabase } = await getSupabaseClient();

  const { data, error } = await supabase
    .from("discussion_reactions")
    .select(
      `
      *,
      user:user_id(display_name, username)
    `,
    )
    .eq("message_id", messageId);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

// ============================================================================
// THREAD ACTIONS
// ============================================================================

export async function createThread(
  input: CreateThreadInput,
): Promise<DiscussionThread> {
  const { supabase, user } = await getSupabaseClient();

  // Check if user is the author of the message
  const { data: message } = await supabase
    .from("discussion_messages")
    .select("user_id")
    .eq("id", input.message_id)
    .single();

  if (!message) {
    throw new Error("Không tìm thấy tin nhắn");
  }

  if (message.user_id !== user.id) {
    throw new Error("Chỉ tác giả tin nhắn mới có thể tạo chuỗi");
  }

  const { data, error } = await supabase
    .from("discussion_threads")
    .insert({
      message_id: input.message_id,
      title: input.title,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/discussion");
  return data;
}

export async function getThread(
  threadId: string,
): Promise<DiscussionThread | null> {
  const { supabase } = await getSupabaseClient();

  const { data, error } = await supabase
    .from("discussion_threads")
    .select(
      `
      *,
      message:message_id(
        *,
        user:user_id(display_name, username, avatar_url, email)
      )
    `,
    )
    .eq("id", threadId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getThreadMessages(
  threadId: string,
): Promise<DiscussionThreadMessage[]> {
  const { supabase } = await getSupabaseClient();

  const { data, error } = await supabase
    .from("discussion_thread_messages")
    .select(
      `
      *,
      user:user_id(display_name, username, avatar_url, email)
    `,
    )
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createThreadMessage(
  input: CreateThreadMessageInput,
): Promise<DiscussionThreadMessage> {
  const { supabase, user } = await getSupabaseClient();

  const { data, error } = await supabase
    .from("discussion_thread_messages")
    .insert({
      thread_id: input.thread_id,
      user_id: user.id,
      content: input.content,
    })
    .select(
      `
      *,
      user:user_id(display_name, username, avatar_url, email)
    `,
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/discussion");
  return data;
}

// ============================================================================
// SEARCH ACTIONS
// ============================================================================

export async function searchMessages(
  query: string,
  channelId?: string,
): Promise<DiscussionMessage[]> {
  const { supabase } = await getSupabaseClient();

  let dbQuery = supabase
    .from("discussion_messages")
    .select(
      `
      *,
      user:user_id(display_name, username, avatar_url, email),
      channel:channel_id(name, project_id)
    `,
    )
    .textSearch("content", query)
    .order("created_at", { ascending: false })
    .limit(50);

  if (channelId) {
    dbQuery = dbQuery.eq("channel_id", channelId);
  }

  const { data, error } = await dbQuery;

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function searchChannels(
  query: string,
): Promise<DiscussionChannel[]> {
  const { supabase } = await getSupabaseClient();

  const { data, error } = await supabase
    .from("discussion_channels")
    .select("*")
    .ilike("name", `%${query}%`)
    .eq("is_archived", false)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

// ============================================================================
// PROJECT CHANNEL ACTIONS
// ============================================================================

export async function createProjectChannel(
  projectId: string,
  projectName: string,
): Promise<DiscussionChannel> {
  const { supabase, user } = await getSupabaseClient();

  // Check if user is a leader of the project
  const isLeader = await isProjectLeader(supabase, user.id, projectId);
  if (!isLeader) {
    throw new Error("Chỉ trưởng dự án mới có thể tạo kênh dự án");
  }

  // Check if project channel already exists
  const { data: existingChannel } = await supabase
    .from("discussion_channels")
    .select("id")
    .eq("project_id", projectId)
    .maybeSingle();

  if (existingChannel) {
    throw new Error("Kênh dự án đã tồn tại");
  }

  // Create channel name from project name
  const channelName = projectName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 50);

  const { data, error } = await supabase
    .from("discussion_channels")
    .insert({
      name: channelName,
      description: `Thảo luận cho ${projectName}`,
      is_public: false,
      channel_type: "project",
      project_id: projectId,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/discussion");
  return data;
}

export async function getProjectChannel(
  projectId: string,
): Promise<DiscussionChannel | null> {
  const { supabase } = await getSupabaseClient();

  const { data, error } = await supabase
    .from("discussion_channels")
    .select("*")
    .eq("project_id", projectId)
    .eq("is_archived", false)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// ============================================================================
// MENTION ACTIONS
// ============================================================================

export interface WorkspaceMember {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
  email: string;
}

export async function getWorkspaceMembers(
  projectId: string,
): Promise<WorkspaceMember[]> {
  const { supabase } = await getSupabaseClient();

  const { data, error } = await supabase
    .from("project_members")
    .select(
      `
      id,
      user_id,
      role,
      profile:user_id(id, username, display_name, avatar_url, email)
    `,
    )
    .eq("project_id", projectId)
    .order("role", { ascending: false })
    .order("profile(display_name)", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  // Transform data to match WorkspaceMember interface
  return (data ?? []).map((member: any) => ({
    id: member.id,
    user_id: member.user_id,
    username: member.profile?.username,
    display_name: member.profile?.display_name,
    avatar_url: member.profile?.avatar_url,
    role: member.role,
    email: member.profile?.email || "",
  }));
}

export async function createMentions(
  messageId: string,
  mentionedUserIds: string[],
): Promise<void> {
  const { supabase } = await getSupabaseClient();

  if (mentionedUserIds.length === 0 || !mentionsTableAvailable) return;

  const mentions = mentionedUserIds.map((userId) => ({
    message_id: messageId,
    mentioned_user_id: userId,
  }));

  const { error } = await supabase.from("message_mentions").insert(mentions);

  if (error) {
    const errorMessage = error.message ?? "";
    if (error.code === "42P01" || errorMessage.includes("message_mentions")) {
      mentionsTableAvailable = false;
      return;
    }
    console.error("Error creating mentions:", error);
  }
}
