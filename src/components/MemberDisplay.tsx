"use client";

import React, { useEffect, useState } from "react";

type Member = {
  id: string;
  user_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string | null;
};

export default function MemberDisplay({ workspaceId, userId, fallback }: { workspaceId?: string; userId?: string | null; fallback?: string }) {
  const [member, setMember] = useState<Member | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!workspaceId || !userId) return;
      try {
        const res = await fetch(`/api/workspace-members?projectId=${workspaceId}`);
        const json = await res.json();
        const found = (json.members || []).find((m: Member) => m.id === userId || m.user_id === userId);
        if (mounted && found) setMember(found);
      } catch (err) {
        console.error(err);
      }
    }
    load();
    return () => { mounted = false; };
  }, [workspaceId, userId]);

  if (member) {
    return (
      <div className="flex items-center gap-2">
        <img src={member.avatar_url || '/avatar-placeholder.png'} className="h-6 w-6 rounded-full object-cover" alt="" />
        <div className="text-sm">
          <div className="font-medium">{member.display_name}</div>
          <div className="text-xs text-muted-foreground">{member.email}</div>
        </div>
        <div className="ml-2 text-xs text-muted-foreground">{member.role}</div>
      </div>
    );
  }

  return (
    <div className="text-sm">{fallback || "Chưa giao"}</div>
  );
}
