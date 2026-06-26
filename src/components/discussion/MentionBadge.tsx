"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MentionedUser {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
}

interface MentionBadgeProps {
  username: string;
  user?: MentionedUser;
  className?: string;
}

export default function MentionBadge({ username, user, className }: MentionBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (user) {
      setIsOpen(true);
    }
  };

  if (!user) {
    // Render as plain text if user not found
    return (
      <span className={cn("text-foreground font-medium", className)}>
        @{username}
      </span>
    );
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={cn(
          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-sm font-medium",
          "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
          "hover:bg-purple-200 dark:hover:bg-purple-900/50",
          "transition-colors cursor-pointer",
          className
        )}
      >
        @{user.display_name || user.username || "user"}
      </button>

      {/* Profile Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="text-lg">
                  {(user.display_name || user.username || username).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-lg font-semibold">
                  {user.display_name || "Người dùng"}
                </h2>
                {user.username && (
                  <p className="text-sm text-muted-foreground">
                  @{user.display_name || user.username}
                </p>
                )}
                {user.role && (
                  <Badge variant="secondary" className="mt-1">
                    {user.role === "leader" ? "Trưởng nhóm dự án" : 
                     user.role === "admin" ? "Quản trị viên" : 
                     user.role === "expert" ? "Chuyên gia" : 
                     user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                )}
              </div>
            </div>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-muted-foreground">Vai trò:</span>
              <span className="font-medium">
                {user.role === "leader" ? "Trưởng nhóm dự án" : 
                 user.role === "admin" ? "Quản trị viên" : 
                 user.role === "expert" ? "Chuyên gia" : 
                 user.role === "member" ? "Thành viên nhóm" : 
                 user.role === "builder" ? "Người xây dựng" : 
                 (user.role || "Thành viên").charAt(0).toUpperCase() + (user.role || "Thành viên").slice(1)}
              </span>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}