"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, ChevronDown } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setActiveGroup } from "@/app/dashboard/groups/actions";
import type { GroupSummary } from "@/lib/groups/types";

export function GroupContextIndicator() {
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [activeGroup, setActiveGroupState] = useState<GroupSummary | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function loadGroupContext() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("group_members")
        .select(
          `
          group:groups (
            id,
            name,
            slug,
            description,
            is_public,
            created_at
          )
        `,
        )
        .eq("user_id", user.id);

      const userGroups =
        data
          ?.map((row) => {
            const group = Array.isArray(row.group) ? row.group[0] : row.group;
            return group as GroupSummary | null;
          })
          .filter((group): group is GroupSummary => group !== null) ?? [];

      setGroups(userGroups);

      const cookieMatch = document.cookie
        .split("; ")
        .find((row) => row.startsWith("cpl_active_group="));
      const activeId = cookieMatch?.split("=")[1];
      const active =
        userGroups.find((group) => group.id === activeId) ?? userGroups[0] ?? null;
      setActiveGroupState(active);
    }

    loadGroupContext();
  }, []);

  const handleSwitchGroup = async (groupId: string) => {
    setPending(true);
    try {
      await setActiveGroup(groupId);
      const selected = groups.find((group) => group.id === groupId) ?? null;
      setActiveGroupState(selected);
      router.push(`/dashboard/groups/${groupId}/dashboard`);
    } finally {
      setPending(false);
    }
  };

  if (!activeGroup) {
    return (
      <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
        <Building2 className="size-4" />
        <span className="truncate max-w-[140px]">No group selected</span>
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <Building2 className="size-4" />
          <span className="truncate max-w-[140px]">{activeGroup.name}</span>
          <ChevronDown className="size-3 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Current Group</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {groups.map((group) => (
          <DropdownMenuItem
            key={group.id}
            onClick={() => handleSwitchGroup(group.id)}
            disabled={pending}
          >
            {group.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/dashboard/groups">Switch to different group</a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}