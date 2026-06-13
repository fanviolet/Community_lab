/**
 * Discussion Types
 * Shared types for discussion system
 * This file does NOT use "use server" directive
 */

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
