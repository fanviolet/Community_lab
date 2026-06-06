"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ============================================================================
// TYPES
// ============================================================================

export interface DiscussionChannel {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  channel_type: string;
  project_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  is_archived: boolean;
}

export interface DiscussionMessage {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  edited: boolean;
  edited_at: string | null;
  pinned: boolean;
  pinned_at: string | null;
  pinned_by: string | null;
  reply_to_id: string | null;
  created_at: string;
  user?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
  reactions?: DiscussionReaction[];
  reply_count?: number;
}

export interface DiscussionReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  user?: {
    id: string;
    name: string | null;
  };
}

export interface DiscussionThread {
  id: string;
  message_id: string;
  title: string;
  created_by: string;
  created_at: string;
  message?: DiscussionMessage;
}

export interface DiscussionThreadMessage {
  id: string;
  thread_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    id: string;
    name: string | null;
    avatar_url: string | null;
  };
}

export interface CreateChannelInput {
  name: string;
  description?: string;
  is_public?: boolean;
  channel_type?: string;
  project_id?: string;
}

export interface CreateMessageInput {
  channel_id: string;
  content: string;
  reply_to_id?: string;
}

export interface CreateThreadInput {
  message_id: string;
  title: string;
}

export interface CreateThreadMessageInput {
  thread_id: string;
  content: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getSupabaseClient() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  return { supabase, user };
}

async function isProjectLeader(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  projectId: string
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

export async function getChannels(projectId?: string): Promise<DiscussionChannel[]> {
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
  const accessibleChannels = (data ?? []).filter((channel) => {
    if (channel.is_public) return true;
    if (channel.project_id) {
      // Check if user is project member
      // This is handled by RLS, but we can add additional client-side filtering if needed
      return true;
    }
    return false;
  });

  return accessibleChannels;
}

export async function getChannel(channelId: string): Promise<DiscussionChannel | null> {
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

export async function createChannel(input: CreateChannelInput): Promise<DiscussionChannel> {
  const { supabase, user } = await getSupabaseClient();

  // If project-specific, check if user is leader
  if (input.project_id) {
    const isLeader = await isProjectLeader(supabase, user.id, input.project_id);
    if (!isLeader) {
      throw new Error("Only project leaders can create project channels");
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
  updates: Partial<CreateChannelInput>
): Promise<DiscussionChannel> {
  const { supabase, user } = await getSupabaseClient();

  // Check if user is the creator
  const { data: channel } = await supabase
    .from("discussion_channels")
    .select("created_by, project_id")
    .eq("id", channelId)
    .single();

  if (!channel) {
    throw new Error("Channel not found");
  }

  if (channel.created_by !== user.id) {
    throw new Error("Only channel creator can update channel");
  }

  const { data, error } = await supabase
    .from("discussion_channels")
    .update({
      ...updates,
      name: updates.name ? updates.name.toLowerCase().replace(/\s+/g, "-") : undefined,
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
    throw new Error("Channel not found");
  }

  if (channel.project_id) {
    const isLeader = await isProjectLeader(supabase, user.id, channel.project_id);
    if (!isLeader && channel.created_by !== user.id) {
      throw new Error("Only project leaders or channel creator can archive channel");
    }
  } else if (channel.created_by !== user.id) {
    throw new Error("Only channel creator can archive channel");
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
  limit: number = 50
): Promise<DiscussionMessage[]> {
  const { supabase } = await getSupabaseClient();

  const { data, error } = await supabase
    .from("discussion_messages")
    .select(`
      *,
      user:user_id(id, name, avatar_url),
      reactions:discussion_reactions(id, user_id, emoji, user:user_id(name))
    `)
    .eq("channel_id", channelId)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getMessage(messageId: string): Promise<DiscussionMessage | null> {
  const { supabase } = await getSupabaseClient();

  const { data, error } = await supabase
    .from("discussion_messages")
    .select(`
      *,
      user:user_id(id, name, avatar_url),
      reactions:discussion_reactions(id, user_id, emoji, user:user_id(name))
    `)
    .eq("id", messageId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createMessage(input: CreateMessageInput): Promise<DiscussionMessage> {
  const { supabase, user } = await getSupabaseClient();

  // Check if user has access to the channel
  const { data: channel } = await supabase
    .from("discussion_channels")
    .select("is_public, project_id")
    .eq("id", input.channel_id)
    .single();

  if (!channel) {
    throw new Error("Channel not found");
  }

  if (!channel.is_public && channel.project_id) {
    const { data: membership } = await supabase
      .from("project_members")
      .select("id")
      .eq("project_id", channel.project_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      throw new Error("You must be a project member to post in this channel");
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
    .select(`
      *,
      user:user_id(id, name, avatar_url)
    `)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // Check for mentions and create notifications
  const mentionRegex = /@(\w+)/g;
  const mentions = input.content.match(mentionRegex);
  if (mentions) {
    for (const mention of mentions) {
      const username = mention.substring(1);
      const { data: mentionedUser } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", username)
        .maybeSingle();

      if (mentionedUser && mentionedUser.id !== user.id) {
        // Create notification (implement notification system separately)
        await supabase.from("notifications").insert({
          user_id: mentionedUser.id,
          type: "mention",
          title: "You were mentioned",
          message: `mentioned you in a message`,
          link: `/dashboard/discussion?channel=${input.channel_id}`,
        });
      }
    }
  }

  revalidatePath("/dashboard/discussion");
  return data;
}

export async function updateMessage(
  messageId: string,
  content: string
): Promise<DiscussionMessage> {
  const { supabase, user } = await getSupabaseClient();

  // Check if user is the author
  const { data: message } = await supabase
    .from("discussion_messages")
    .select("user_id")
    .eq("id", messageId)
    .single();

  if (!message) {
    throw new Error("Message not found");
  }

  if (message.user_id !== user.id) {
    throw new Error("Only message author can edit message");
  }

  const { data, error } = await supabase
    .from("discussion_messages")
    .update({
      content,
      edited: true,
      edited_at: new Date().toISOString(),
    })
    .eq("id", messageId)
    .select(`
      *,
      user:user_id(id, name, avatar_url)
    `)
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
    throw new Error("Message not found");
  }

  if (message.user_id !== user.id) {
    throw new Error("Only message author can delete message");
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

export async function pinMessage(messageId: string): Promise<DiscussionMessage> {
  const { supabase, user } = await getSupabaseClient();

  // Check if user is a leader of the channel's project
  const { data: message } = await supabase
    .from("discussion_messages")
    .select(`
      channel_id,
      channel:channel_id!inner(project_id)
    `)
    .eq("id", messageId)
    .single();

  if (!message) {
    throw new Error("Message not found");
  }

  const channelData = message.channel as any;
  if (channelData?.project_id) {
    const isLeader = await isProjectLeader(supabase, user.id, channelData.project_id);
    if (!isLeader) {
      throw new Error("Only project leaders can pin messages");
    }
  } else {
    throw new Error("Only project channels support pinning");
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

export async function unpinMessage(messageId: string): Promise<DiscussionMessage> {
  const { supabase, user } = await getSupabaseClient();

  // Check if user is a leader of the channel's project
  const { data: message } = await supabase
    .from("discussion_messages")
    .select(`
      channel_id,
      channel:channel_id!inner(project_id)
    `)
    .eq("id", messageId)
    .single();

  if (!message) {
    throw new Error("Message not found");
  }

  const channelData = message.channel as any;
  if (channelData?.project_id) {
    const isLeader = await isProjectLeader(supabase, user.id, channelData.project_id);
    if (!isLeader) {
      throw new Error("Only project leaders can unpin messages");
    }
  } else {
    throw new Error("Only project channels support pinning");
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

export async function addReaction(messageId: string, emoji: string): Promise<DiscussionReaction> {
  const { supabase, user } = await getSupabaseClient();

  const { data, error } = await supabase
    .from("discussion_reactions")
    .insert({
      message_id: messageId,
      user_id: user.id,
      emoji,
    })
    .select(`
      *,
      user:user_id(name)
    `)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/discussion");
  return data;
}

export async function removeReaction(messageId: string, emoji: string): Promise<void> {
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

export async function getMessageReactions(messageId: string): Promise<DiscussionReaction[]> {
  const { supabase } = await getSupabaseClient();

  const { data, error } = await supabase
    .from("discussion_reactions")
    .select(`
      *,
      user:user_id(name)
    `)
    .eq("message_id", messageId);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

// ============================================================================
// THREAD ACTIONS
// ============================================================================

export async function createThread(input: CreateThreadInput): Promise<DiscussionThread> {
  const { supabase, user } = await getSupabaseClient();

  // Check if user is the author of the message
  const { data: message } = await supabase
    .from("discussion_messages")
    .select("user_id")
    .eq("id", input.message_id)
    .single();

  if (!message) {
    throw new Error("Message not found");
  }

  if (message.user_id !== user.id) {
    throw new Error("Only message author can create a thread");
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

export async function getThread(threadId: string): Promise<DiscussionThread | null> {
  const { supabase } = await getSupabaseClient();

  const { data, error } = await supabase
    .from("discussion_threads")
    .select(`
      *,
      message:message_id(
        *,
        user:user_id(name, avatar_url)
      )
    `)
    .eq("id", threadId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getThreadMessages(threadId: string): Promise<DiscussionThreadMessage[]> {
  const { supabase } = await getSupabaseClient();

  const { data, error } = await supabase
    .from("discussion_thread_messages")
    .select(`
      *,
      user:user_id(name, avatar_url)
    `)
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createThreadMessage(
  input: CreateThreadMessageInput
): Promise<DiscussionThreadMessage> {
  const { supabase, user } = await getSupabaseClient();

  const { data, error } = await supabase
    .from("discussion_thread_messages")
    .insert({
      thread_id: input.thread_id,
      user_id: user.id,
      content: input.content,
    })
    .select(`
      *,
      user:user_id(name, avatar_url)
    `)
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

export async function searchMessages(query: string, channelId?: string): Promise<DiscussionMessage[]> {
  const { supabase } = await getSupabaseClient();

  let dbQuery = supabase
    .from("discussion_messages")
    .select(`
      *,
      user:user_id(name, avatar_url),
      channel:channel_id(name, project_id)
    `)
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

export async function searchChannels(query: string): Promise<DiscussionChannel[]> {
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

export async function createProjectChannel(projectId: string, projectName: string): Promise<DiscussionChannel> {
  const { supabase, user } = await getSupabaseClient();

  // Check if user is a leader of the project
  const isLeader = await isProjectLeader(supabase, user.id, projectId);
  if (!isLeader) {
    throw new Error("Only project leaders can create project channels");
  }

  // Check if project channel already exists
  const { data: existingChannel } = await supabase
    .from("discussion_channels")
    .select("id")
    .eq("project_id", projectId)
    .maybeSingle();

  if (existingChannel) {
    throw new Error("Project channel already exists");
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
      description: `Discussion for ${projectName}`,
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

export async function getProjectChannel(projectId: string): Promise<DiscussionChannel | null> {
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
