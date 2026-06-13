"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  Hash, 
  Plus, 
  Search, 
  MoreVertical, 
  Send, 
  Smile, 
  Paperclip, 
  Reply,
  Pin,
  Edit2,
  Trash2,
  MessageSquare,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getChannels,
  createChannel,
  getMessages,
  createMessage,
  addReaction,
  removeReaction,
  createThread,
  getThreadMessages,
  createThreadMessage,
  pinMessage,
  unpinMessage,
  updateMessage,
  deleteMessage,
} from "@/app/dashboard/discussion/discussion-actions";
import type {
  DiscussionChannel,
  DiscussionMessage,
  DiscussionReaction,
  DiscussionThread,
} from "@/app/dashboard/discussion/discussion-types";

interface DiscussionHubProps {
  projectId?: string;
}

export default function DiscussionHub({ projectId }: DiscussionHubProps) {
  const [channels, setChannels] = useState<DiscussionChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<DiscussionChannel | null>(null);
  const [messages, setMessages] = useState<DiscussionMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [replyTo, setReplyTo] = useState<DiscussionMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<DiscussionMessage | null>(null);
  const [editContent, setEditContent] = useState("");
  const [threadOpen, setThreadOpen] = useState<DiscussionThread | null>(null);
  const [threadMessages, setThreadMessages] = useState<any[]>([]);
  const [newThreadMessage, setNewThreadMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDescription, setNewChannelDescription] = useState("");
  const [showMessageActions, setShowMessageActions] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [channelError, setChannelError] = useState<string | null>(null);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const threadMessagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Load channels on mount
  useEffect(() => {
    loadChannels();
  }, [projectId]);

  // Load messages when channel is selected
  useEffect(() => {
    if (selectedChannel) {
      loadMessages(selectedChannel.id);
    }
  }, [selectedChannel]);

  // Setup realtime subscriptions
  useEffect(() => {
    if (!selectedChannel) return;

    // Subscribe to new messages
    const messagesSubscription = supabase
      .channel(`messages:${selectedChannel.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'discussion_messages',
          filter: `channel_id=eq.${selectedChannel.id}`,
        },
        async (payload) => {
          const newMessage = payload.new as DiscussionMessage;
          // Fetch user data for the new message
          const { data: userData } = await supabase
            .from('profiles')
            .select('id, name, avatar_url')
            .eq('id', newMessage.user_id)
            .single();
          
          if (userData) {
            setMessages((prev) => [...prev, { ...newMessage, user: userData }]);
          } else {
            setMessages((prev) => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    // Subscribe to new reactions
    const reactionsSubscription = supabase
      .channel(`reactions:${selectedChannel.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'discussion_reactions',
        },
        () => {
          // Reload messages to show updated reactions
          if (selectedChannel) {
            loadMessages(selectedChannel.id);
          }
        }
      )
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
      reactionsSubscription.unsubscribe();
    };
  }, [selectedChannel]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Scroll to bottom when thread messages change
  useEffect(() => {
    threadMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadMessages]);

  const loadChannels = async () => {
    try {
      const data = await getChannels(projectId);
      setChannels(data);
      
      // Auto-select project channel if available
      if (projectId && data.length > 0) {
        const projectChannel = data.find(c => c.project_id === projectId);
        setSelectedChannel(projectChannel || data[0]);
      } else if (data.length > 0 && !selectedChannel) {
        setSelectedChannel(data[0]);
      }
    } catch (error) {
      console.error("Failed to load channels:", error);
    }
  };

  const loadMessages = async (channelId: string) => {
    try {
      const data = await getMessages(channelId);
      setMessages(data);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChannel || isLoading) return;

    setIsLoading(true);
    setMessageError(null);
    try {
      const message = await createMessage({
        channel_id: selectedChannel.id,
        content: newMessage,
        reply_to_id: replyTo?.id,
      });
      setMessages([...messages, message]);
      setNewMessage("");
      setReplyTo(null);
      setSuccessMessage("Message sent successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setMessageError(error.message || "Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    try {
      await addReaction(messageId, emoji);
      // Reload messages to show updated reactions
      if (selectedChannel) {
        loadMessages(selectedChannel.id);
      }
    } catch (error) {
      console.error("Failed to add reaction:", error);
    }
  };

  const handleRemoveReaction = async (messageId: string, emoji: string) => {
    try {
      await removeReaction(messageId, emoji);
      if (selectedChannel) {
        loadMessages(selectedChannel.id);
      }
    } catch (error) {
      console.error("Failed to remove reaction:", error);
    }
  };

  const handleCreateThread = async (messageId: string, title: string) => {
    try {
      const thread = await createThread({ message_id: messageId, title });
      setThreadOpen(thread);
      loadThreadMessages(thread.id);
    } catch (error) {
      console.error("Failed to create thread:", error);
    }
  };

  const loadThreadMessages = async (threadId: string) => {
    try {
      const data = await getThreadMessages(threadId);
      setThreadMessages(data);
    } catch (error) {
      console.error("Failed to load thread messages:", error);
    }
  };

  const handleSendThreadMessage = async () => {
    if (!newThreadMessage.trim() || !threadOpen) return;

    try {
      const message = await createThreadMessage({
        thread_id: threadOpen.id,
        content: newThreadMessage,
      });
      setThreadMessages([...threadMessages, message]);
      setNewThreadMessage("");
    } catch (error: any) {
      console.error("Failed to send thread message:", error);
      setMessageError(error.message || "Failed to send thread message");
    }
  };

  const handlePinMessage = async (messageId: string) => {
    try {
      await pinMessage(messageId);
      if (selectedChannel) {
        loadMessages(selectedChannel.id);
      }
      setSuccessMessage("Message pinned");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setMessageError(error.message || "Failed to pin message");
    }
  };

  const handleUnpinMessage = async (messageId: string) => {
    try {
      await unpinMessage(messageId);
      if (selectedChannel) {
        loadMessages(selectedChannel.id);
      }
      setSuccessMessage("Message unpinned");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setMessageError(error.message || "Failed to unpin message");
    }
  };

  const handleEditMessage = async () => {
    if (!editingMessage || !editContent.trim()) return;

    try {
      await updateMessage(editingMessage.id, editContent);
      if (selectedChannel) {
        loadMessages(selectedChannel.id);
      }
      setEditingMessage(null);
      setEditContent("");
      setSuccessMessage("Message updated");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setMessageError(error.message || "Failed to edit message");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage(messageId);
      if (selectedChannel) {
        loadMessages(selectedChannel.id);
      }
      setSuccessMessage("Message deleted");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setMessageError(error.message || "Failed to delete message");
    }
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim()) return;

    setIsCreatingChannel(true);
    setChannelError(null);
    try {
      const channel = await createChannel({
        name: newChannelName,
        description: newChannelDescription,
        project_id: projectId,
      });
      setChannels([...channels, channel]);
      setSelectedChannel(channel);
      setNewChannelName("");
      setNewChannelDescription("");
      setShowCreateChannel(false);
      setSuccessMessage("Channel created successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      setChannelError(error.message || "Failed to create channel");
    } finally {
      setIsCreatingChannel(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredChannels = channels.filter((channel) =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Channels Sidebar */}
      <div className="w-60 flex-shrink-0 border-r border-border bg-muted/30">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm">Discussion</h2>
            <Dialog open={showCreateChannel} onOpenChange={setShowCreateChannel}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Channel</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {channelError && (
                    <div className="text-sm text-destructive">{channelError}</div>
                  )}
                  <div>
                    <Input
                      placeholder="Channel name"
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value)}
                      disabled={isCreatingChannel}
                    />
                  </div>
                  <div>
                    <Textarea
                      placeholder="Description (optional)"
                      value={newChannelDescription}
                      onChange={(e) => setNewChannelDescription(e.target.value)}
                      disabled={isCreatingChannel}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowCreateChannel(false);
                        setNewChannelName("");
                        setNewChannelDescription("");
                        setChannelError(null);
                      }}
                      disabled={isCreatingChannel}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateChannel}
                      disabled={!newChannelName.trim() || isCreatingChannel}
                    >
                      {isCreatingChannel ? "Creating..." : "Create Channel"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>
        <div className="p-2 space-y-0.5 overflow-y-auto">
          {filteredChannels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setSelectedChannel(channel)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                selectedChannel?.id === channel.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              <Hash className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{channel.name}</span>
              {channel.channel_type === "announcement" && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  <span className="sr-only">Announcement</span>
                  📢
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Channel Header */}
        {selectedChannel && (
          <div className="h-14 border-b border-border flex items-center px-4 flex-shrink-0">
            <Hash className="h-5 w-5 text-muted-foreground mr-2" />
            <div>
              <h3 className="font-semibold">{selectedChannel.name}</h3>
              {selectedChannel.description && (
                <p className="text-xs text-muted-foreground">{selectedChannel.description}</p>
              )}
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {selectedChannel ? (
            <>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Hash className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-sm">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`group relative ${message.pinned ? "bg-amber-50 dark:bg-amber-950/20 -mx-4 px-4 py-2" : ""}`}
                  >
                    {message.pinned && (
                      <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 mb-1">
                        <Pin className="h-3 w-3" />
                        <span>Pinned</span>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                          {message.user?.name?.charAt(0).toUpperCase() || "?"}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{message.user?.name || "Unknown"}</span>
                          <span className="text-xs text-muted-foreground">{formatTime(message.created_at)}</span>
                          {message.edited && (
                            <span className="text-xs text-muted-foreground">(edited)</span>
                          )}
                        </div>
                        {editingMessage?.id === message.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="min-h-[60px] text-sm"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleEditMessage}>
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingMessage(null)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm break-words">{message.content}</p>
                        )}
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {message.reactions.map((reaction: DiscussionReaction) => (
                              <button
                                key={reaction.id}
                                onClick={() => handleRemoveReaction(message.id, reaction.emoji)}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted hover:bg-muted/80 text-xs"
                              >
                                <span>{reaction.emoji}</span>
                                <span className="text-muted-foreground">1</span>
                              </button>
                            ))}
                          </div>
                        )}
                        {message.reply_to_id && (
                          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                            <Reply className="h-3 w-3" />
                            <span>Replying to a message</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setShowMessageActions(message.id)}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Hash className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">Select a channel to start chatting</p>
            </div>
          )}
        </div>

        {/* Reply Preview */}
        {replyTo && (
          <div className="px-4 py-2 border-t border-border flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-2 text-sm">
              <Reply className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Replying to</span>
              <span className="font-medium">{replyTo.user?.name}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setReplyTo(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="px-4 py-2 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 text-sm">
            {successMessage}
          </div>
        )}
        {messageError && (
          <div className="px-4 py-2 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-sm">
            {messageError}
            <Button variant="ghost" size="sm" className="ml-2" onClick={() => setMessageError(null)}>
              Dismiss
            </Button>
          </div>
        )}

        {/* Message Input */}
        <div className="p-4 border-t border-border flex-shrink-0">
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="h-10 w-10 flex-shrink-0">
              <Paperclip className="h-5 w-5" />
            </Button>
            <div className="flex-1 relative">
              <Textarea
                placeholder="Type a message... (Press Enter to send, Shift+Enter for new line)"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="min-h-[60px] max-h-[200px] resize-none pr-12"
                disabled={!selectedChannel || isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isLoading}
                className="absolute right-2 bottom-2 h-8 w-8"
                size="icon"
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Message Actions Dialog */}
      <Dialog open={showMessageActions !== null} onOpenChange={() => setShowMessageActions(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message Actions</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {messages.find(m => m.id === showMessageActions) && (
              <>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    setReplyTo(messages.find(m => m.id === showMessageActions)!);
                    setShowMessageActions(null);
                  }}
                >
                  <Reply className="h-4 w-4 mr-2" />
                  Reply
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    handleCreateThread(showMessageActions!, "Thread");
                    setShowMessageActions(null);
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Create Thread
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    handleAddReaction(showMessageActions!, "👍");
                    setShowMessageActions(null);
                  }}
                >
                  <span className="mr-2">👍</span>
                  React 👍
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    handleAddReaction(showMessageActions!, "❤️");
                    setShowMessageActions(null);
                  }}
                >
                  <span className="mr-2">❤️</span>
                  React ❤️
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    handleAddReaction(showMessageActions!, "🎉");
                    setShowMessageActions(null);
                  }}
                >
                  <span className="mr-2">🎉</span>
                  React 🎉
                </Button>
                {messages.find(m => m.id === showMessageActions)?.pinned ? (
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      handleUnpinMessage(showMessageActions!);
                      setShowMessageActions(null);
                    }}
                  >
                    <Pin className="h-4 w-4 mr-2" />
                    Unpin
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      handlePinMessage(showMessageActions!);
                      setShowMessageActions(null);
                    }}
                  >
                    <Pin className="h-4 w-4 mr-2" />
                    Pin
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    const msg = messages.find(m => m.id === showMessageActions);
                    if (msg) {
                      setEditingMessage(msg);
                      setEditContent(msg.content);
                    }
                    setShowMessageActions(null);
                  }}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive"
                  onClick={() => {
                    handleDeleteMessage(showMessageActions!);
                    setShowMessageActions(null);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Thread Panel */}
      {threadOpen && (
        <div className="w-80 flex-shrink-0 border-l border-border bg-muted/30 flex flex-col">
          <div className="h-14 border-b border-border flex items-center px-4 justify-between flex-shrink-0">
            <h3 className="font-semibold text-sm truncate">{threadOpen.title}</h3>
            <Button variant="ghost" size="icon" onClick={() => setThreadOpen(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {threadMessages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium flex-shrink-0">
                  {msg.user?.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-xs">{msg.user?.name || "Unknown"}</span>
                    <span className="text-xs text-muted-foreground">{formatTime(msg.created_at)}</span>
                  </div>
                  <p className="text-sm break-words">{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={threadMessagesEndRef} />
          </div>
          <div className="p-4 border-t border-border flex-shrink-0">
            <div className="flex gap-2">
              <Textarea
                placeholder="Reply to thread..."
                value={newThreadMessage}
                onChange={(e) => setNewThreadMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendThreadMessage();
                  }
                }}
                className="min-h-[60px] max-h-[150px] resize-none text-sm"
              />
              <Button onClick={handleSendThreadMessage} disabled={!newThreadMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Members Panel */}
      <div className="w-60 flex-shrink-0 border-l border-border bg-muted/30 hidden lg:block">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </h3>
        </div>
        <div className="p-4">
          <p className="text-xs text-muted-foreground mb-3">Online — 0</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">You</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
