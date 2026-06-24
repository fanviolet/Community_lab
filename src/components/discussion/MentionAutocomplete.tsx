"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface MentionUser {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  email: string;
}

interface MentionAutocompleteProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (value: string) => void;
  users: MentionUser[];
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function MentionAutocomplete({
  textareaRef,
  value,
  onChange,
  users,
  currentUserId,
  isOpen,
  onClose,
}: MentionAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.user_id !== currentUserId &&
      ((user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % filteredUsers.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
          break;
        case "Enter":
          if (filteredUsers.length > 0) {
            e.preventDefault();
            selectUser(filteredUsers[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [isOpen, filteredUsers, selectedIndex, onClose]
  );

  // Select a user and insert mention
  const selectUser = (user: MentionUser) => {
    const mentionText = `@[${user.username || user.full_name || user.email}]`;
    
    // Find the position of the last @ that triggered the autocomplete
    const atIndex = value.lastIndexOf("@");
    if (atIndex !== -1) {
      const before = value.substring(0, atIndex);
      const spaceIndex = value.indexOf(" ", atIndex);
      const after = spaceIndex !== -1 ? value.substring(spaceIndex) : "";
      
      // If cursor is at the end, add a space after mention
      const newValue = before + mentionText + " " + after;
      onChange(newValue);
    } else {
      onChange(value + mentionText + " ");
    }
    
    onClose();
  };

  // Set up keyboard listener
  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Extract search term from current value
  useEffect(() => {
    if (isOpen && value) {
      const atIndex = value.lastIndexOf("@");
      if (atIndex !== -1) {
        const afterAt = value.substring(atIndex + 1);
        const spaceIndex = afterAt.indexOf(" ");
        const term = spaceIndex !== -1 ? afterAt.substring(0, spaceIndex) : afterAt;
        setSearchTerm(term);
      }
    }
  }, [value, isOpen]);

  // Reset selection when search term changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  if (!isOpen || filteredUsers.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="absolute z-50 w-72 max-h-64 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg"
      style={{
        bottom: "100%",
        left: 0,
      }}
    >
      <div className="p-2">
        <div className="mb-2 px-2 py-1 text-xs font-medium text-muted-foreground">
          {filteredUsers.length} member{filteredUsers.length !== 1 ? "s" : ""} found
        </div>
        <div className="space-y-1">
          {filteredUsers.map((user, index) => (
            <button
              key={user.id}
              onClick={() => selectUser(user)}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors",
                index === selectedIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-muted"
              )}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback>
                  {(user.full_name || user.email).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">
                    {user.full_name || user.email}
                  </span>
                  {user.role === "leader" && (
                    <Badge variant="secondary" className="text-xs px-1 py-0 h-5">
                      Leader
                    </Badge>
                  )}
                </div>
                {user.username && (
                  <span className="text-xs text-muted-foreground">
                    @{user.username}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}