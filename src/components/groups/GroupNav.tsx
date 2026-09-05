"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  Loader2,
  Building2,
} from "lucide-react";

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
import { setActiveGroup } from "@/app/dashboard/groups/actions";
import type { GroupSummary } from "@/lib/groups/types";
import { useState, useEffect } from "react";

interface GroupNavProps {
  group: { id: string; name: string; slug: string; description?: string | null };
}

export function GroupNav({ group }: GroupNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGroups() {
      setLoading(true);
      try {
        const supabase = createClient();
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
          .eq("user_id", (await supabase.auth.getUser()).data.user?.id);

        const userGroups =
          data
            ?.map((row) => {
              const group = Array.isArray(row.group) ? row.group[0] : row.group;
              return group as GroupSummary | null;
            })
            .filter((group): group is GroupSummary => group !== null) ?? [];

        setGroups(userGroups);
      } catch (error) {
        console.error("[GroupNav] Failed to load groups:", error);
      } finally {
        setLoading(false);
      }
    }

    loadGroups();
  }, [group.id]);

  const handleSwitchGroup = async (groupId: string) => {
    setPending(true);
    try {
      await setActiveGroup(groupId);
      router.push(`/dashboard/groups/${groupId}/dashboard`);
    } catch (error) {
      console.error("[GroupNav] Failed to switch group:", error);
    } finally {
      setPending(false);
    }
  };

  // Only show group switcher if user has multiple groups
  if (groups.length <= 1) {
    return null;
  }

  return (
    <div className="border-b border-border bg-card">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/groups">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Groups
            </Button>
          </Link>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2" disabled={pending}>
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="font-medium text-foreground">{group.name}</span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Switch Group</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {groups.map((g) => (
                    <DropdownMenuItem
                      key={g.id}
                      onClick={() => handleSwitchGroup(g.id)}
                      disabled={pending}
                      className={g.id === group.id ? "font-medium text-primary" : ""}
                    >
                      {g.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/groups">View All Groups</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}