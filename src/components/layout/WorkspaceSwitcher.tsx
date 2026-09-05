"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";

import { setActiveGroup } from "@/app/dashboard/groups/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import type { GroupSummary } from "@/lib/groups/types";

export function WorkspaceSwitcher() {
  const router = useRouter();
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [activeGroup, setActiveGroupState] = useState<GroupSummary | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    async function loadGroups() {
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
          ?.map((row) => row.group as any)
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

    loadGroups();
  }, []);

  function handleSelect(groupId: string) {
    startTransition(async () => {
      await setActiveGroup(groupId);
      const selected = groups.find((group) => group.id === groupId) ?? null;
      setActiveGroupState(selected);
      router.push(`/dashboard/groups/${groupId}/dashboard`);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2" disabled={pending}>
          <Building2 className="h-5 w-5" />
          <span className="hidden sm:inline">
            {activeGroup?.name ?? "Community Lab"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Groups</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {groups.map((group) => (
          <DropdownMenuItem
            key={group.id}
            onClick={() => handleSelect(group.id)}
          >
            {group.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/groups">Discover groups</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
