import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import type { GroupMembershipState, GroupSummary } from "@/lib/groups/types";

export const ACTIVE_GROUP_COOKIE = "cpl_active_group";

export async function getActiveGroupId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_GROUP_COOKIE)?.value ?? null;
}

export async function resolveActiveGroupId(
  userId: string,
): Promise<string | null> {
  const fromCookie = await getActiveGroupId();
  if (fromCookie) {
    // Validate that the user is actually a member of the group from the cookie
    const supabase = await createClient();
    const { data } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("group_id", fromCookie)
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      return fromCookie;
    }

    // Cookie contains a group the user is not a member of, ignore it
    // Don't delete from Server Component context - just return null
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data?.group_id ?? null;
}

export async function getGroupMembershipState(
  groupId: string,
  userId: string,
): Promise<GroupMembershipState> {
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (membership) {
    return "member";
  }

  const { data: pendingRequest } = await supabase
    .from("group_join_requests")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .eq("status", "pending")
    .maybeSingle();

  if (pendingRequest) {
    return "pending";
  }

  return "visitor";
}

export async function getUserGroups(userId: string): Promise<GroupSummary[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
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
    .eq("user_id", userId);

  if (error) {
    console.error("[getUserGroups]", error);
    return [];
  }

  return (
    data
      ?.map((row) => row.group as any)
      .filter((group): group is GroupSummary => group !== null) ?? []
  );
}

export async function getDiscoverableGroups(): Promise<GroupSummary[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("groups")
    .select("id, name, slug, description, is_public, created_at")
    .eq("is_public", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("[getDiscoverableGroups]", error);
    return [];
  }

  return data ?? [];
}

export async function getGroupById(groupId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("groups")
    .select("id, name, slug, description, is_public, created_at, created_by")
    .eq("id", groupId)
    .maybeSingle();

  if (error) {
    console.error("[getGroupById]", error);
    return null;
  }

  return data;
}

export async function isGroupLeader(
  groupId: string,
  userId: string,
): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  return data?.role === "leader";
}
