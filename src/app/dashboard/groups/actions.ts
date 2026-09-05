"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { getAuthSession } from "@/lib/auth/server";
import {
  ACTIVE_GROUP_COOKIE,
  getGroupMembershipState,
  isGroupLeader,
} from "@/lib/groups/server";
import type { GroupJoinRequest } from "@/lib/groups/types";
import { createNotification } from "@/lib/notifications/createNotification";

export type GroupActionResult =
  | { success: true }
  | { success: false; error: string };

async function requireUser() {
  const { user } = await getAuthSession();
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user;
}

export async function setActiveGroup(groupId: string): Promise<GroupActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  // Verify user is actually a member of this group
  const { data: membership } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    return { success: false, error: "You are not a member of this group." };
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_GROUP_COOKIE, groupId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  redirect(`/dashboard/groups/${groupId}/dashboard`);
  return { success: true };
}

export async function requestJoinGroup(
  groupId: string,
  message?: string,
): Promise<GroupActionResult & { requestId?: string }> {
  const user = await requireUser();
  const state = await getGroupMembershipState(groupId, user.id);

  if (state === "member") {
    return { success: false, error: "You are already a member of this group." };
  }

  if (state === "pending") {
    return { success: false, error: "You already have a pending join request." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("request_group_join", {
    p_group_id: groupId,
    p_message: message?.trim() || null,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/dashboard/groups/${groupId}`);
  revalidatePath("/dashboard/groups");
  return { success: true, requestId: data as string };
}

export async function reviewJoinRequest(
  requestId: string,
  approve: boolean,
): Promise<GroupActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: request, error: fetchError } = await supabase
    .from("group_join_requests")
    .select("group_id, status, user_id, group:groups (name)")
    .eq("id", requestId)
    .maybeSingle();

  if (fetchError || !request) {
    return { success: false, error: "Join request not found." };
  }

  const canReview = await isGroupLeader(request.group_id, user.id);
  if (!canReview) {
    return { success: false, error: "Not authorized to review join requests." };
  }

  const { error } = await supabase.rpc("review_group_join_request", {
    p_request_id: requestId,
    p_approve: approve,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Send notification to the requester
  const groupName = (request.group as any)?.name || "a group";
  await createNotification({
    userId: request.user_id,
    type: approve ? "group_join_approved" : "group_join_rejected",
    message: approve
      ? `Your request to join ${groupName} has been approved`
      : `Your request to join ${groupName} has been rejected`,
    link: `/dashboard/groups/${request.group_id}`,
  });

  revalidatePath(`/dashboard/groups/${request.group_id}`);
  revalidatePath("/dashboard/groups");
  return { success: true };
}

export async function getPendingJoinRequests(
  groupId: string,
): Promise<GroupJoinRequest[]> {
  const user = await requireUser();
  const canReview = await isGroupLeader(groupId, user.id);
  if (!canReview) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("group_join_requests")
    .select(
      `
      id,
      group_id,
      user_id,
      status,
      message,
      reviewed_by,
      reviewed_at,
      created_at,
      profile:profiles!group_join_requests_user_id_fkey (
        id,
        display_name,
        email,
        avatar_url
      )
    `,
    )
    .eq("group_id", groupId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getPendingJoinRequests]", error);
    return [];
  }

  return (data ?? []).map((request: any) => ({
    ...request,
    profile: request.profile ? {
      id: request.profile.id,
      display_name: request.profile.display_name,
      email: request.profile.email,
      avatar_url: request.profile.avatar_url,
    } : undefined,
  })) as GroupJoinRequest[];
}

export async function leaveGroup(groupId: string): Promise<GroupActionResult> {
  const user = await requireUser();
  const canReview = await isGroupLeader(groupId, user.id);

  // Leaders cannot leave their own group (must transfer leadership first)
  if (canReview) {
    return { success: false, error: "Group leaders cannot leave. Transfer leadership first." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/dashboard/groups/${groupId}`);
  revalidatePath("/dashboard/groups");
  return { success: true };
}

export async function removeGroupMember(
  groupId: string,
  userId: string,
): Promise<GroupActionResult> {
  const user = await requireUser();
  const canManage = await isGroupLeader(groupId, user.id);

  if (!canManage) {
    return { success: false, error: "Not authorized to remove members." };
  }

  // Prevent removing the last leader
  const supabase = await createClient();
  const { data: member } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (member?.role === "leader") {
    const { count } = await supabase
      .from("group_members")
      .select("*", { count: "exact", head: true })
      .eq("group_id", groupId)
      .eq("role", "leader");

    if (count && count <= 1) {
      return { success: false, error: "Cannot remove the last leader." };
    }
  }

  // Get group name for notification
  const { data: group } = await supabase
    .from("groups")
    .select("name")
    .eq("id", groupId)
    .maybeSingle();

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Send notification to the removed member
  const groupName = group?.name || "a group";
  await createNotification({
    userId: userId,
    type: "group_member_removed",
    message: `You have been removed from ${groupName}`,
    link: "/dashboard/groups",
  });

  revalidatePath(`/dashboard/groups/${groupId}`);
  revalidatePath("/dashboard/groups");
  return { success: true };
}

export async function addGroupMember(
  groupId: string,
  userId: string,
  role: "member" | "leader" = "member",
): Promise<GroupActionResult> {
  const user = await requireUser();
  const canManage = await isGroupLeader(groupId, user.id);

  if (!canManage) {
    return { success: false, error: "Not authorized to add members." };
  }

  const supabase = await createClient();

  // Check if user is already a member
  const { data: existing } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    return { success: false, error: "User is already a member of this group." };
  }

  // Get group name for notification
  const { data: group } = await supabase
    .from("groups")
    .select("name")
    .eq("id", groupId)
    .maybeSingle();

  const { error } = await supabase
    .from("group_members")
    .insert({
      group_id: groupId,
      user_id: userId,
      role,
    });

  if (error) {
    return { success: false, error: error.message };
  }

  // Send notification to the added member
  const groupName = group?.name || "a group";
  await createNotification({
    userId: userId,
    type: "group_member_added",
    message: `You have been added to ${groupName}`,
    link: `/dashboard/groups/${groupId}`,
  });

  revalidatePath(`/dashboard/groups/${groupId}`);
  revalidatePath("/dashboard/groups");
  return { success: true };
}

export async function searchUsers(query: string) {
  const user = await requireUser();
  const supabase = await createClient();

  if (!query || query.length < 2) {
    return [];
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, email, avatar_url")
    .or(`display_name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(10);

  if (error) {
    console.error("[searchUsers]", error);
    return [];
  }

  return data ?? [];
}

export async function getGroupMembers(groupId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("group_members")
    .select(
      `
      id,
      group_id,
      user_id,
      role,
      created_at,
      profile:profiles (
        id,
        display_name,
        email,
        avatar_url
      )
    `,
    )
    .eq("group_id", groupId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getGroupMembers]", error);
    return [];
  }

  // Handle Supabase response format - profile might be an array or object
  return (data ?? []).map((member: any) => ({
    ...member,
    profile: Array.isArray(member.profile) ? member.profile[0] : member.profile,
  }));
}

export async function createGroup(
  name: string,
  slug: string,
  description: string | null,
  isPublic: boolean,
): Promise<GroupActionResult & { groupId?: string }> {
  const user = await requireUser();
  const supabase = await createClient();

  // Verify auth session is valid before proceeding
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    return { success: false, error: "Invalid authentication session" };
  }

  // Ensure the session user matches the required user
  if (session.user.id !== user.id) {
    return { success: false, error: "Session mismatch" };
  }

  // Generate a unique slug if needed
  let finalSlug = slug.toLowerCase().replace(/\s+/g, '-');
  const { data: existing } = await supabase
    .from("groups")
    .select("id")
    .eq("slug", finalSlug)
    .maybeSingle();

  if (existing) {
    // Append a random suffix to make it unique
    finalSlug = `${finalSlug}-${Date.now().toString(36)}`;
  }

  // Create the group with proper created_by using the session user ID
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({
      name,
      slug: finalSlug,
      description,
      is_public: isPublic,
      created_by: session.user.id, // Use session.user.id to ensure auth context match
    })
    .select("id")
    .single();

  if (groupError || !group) {
    console.error("[createGroup] Group creation error:", groupError);
    return { success: false, error: groupError?.message || "Failed to create group" };
  }

  // The trigger handle_new_group() should automatically add the creator as leader
  // But we verify it here to ensure it worked
  const { data: memberCheck, error: memberCheckError } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", group.id)
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (memberCheckError || !memberCheck || memberCheck.role !== "leader") {
    // If trigger failed, add manually
    const { error: manualAddError } = await supabase
      .from("group_members")
      .insert({
        group_id: group.id,
        user_id: session.user.id,
        role: "leader",
      });

    if (manualAddError) {
      console.error("[createGroup] Manual leader add error:", manualAddError);
      // Rollback group creation if leader assignment fails
      await supabase.from("groups").delete().eq("id", group.id);
      return { success: false, error: "Failed to add creator as leader" };
    }
  }

  // Set the new group as active
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_GROUP_COOKIE, group.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  revalidatePath("/dashboard/groups");
  return { success: true, groupId: group.id };
}

export async function updateGroup(
  groupId: string,
  name: string,
  slug: string,
  description: string | null,
  isPublic: boolean,
): Promise<GroupActionResult> {
  const user = await requireUser();
  const canManage = await isGroupLeader(groupId, user.id);

  if (!canManage) {
    return { success: false, error: "Not authorized to edit this group." };
  }

  const supabase = await createClient();

  // Check if slug is being changed and if it conflicts
  const { data: currentGroup } = await supabase
    .from("groups")
    .select("slug")
    .eq("id", groupId)
    .single();

  if (currentGroup && currentGroup.slug !== slug) {
    const { data: existing } = await supabase
      .from("groups")
      .select("id")
      .eq("slug", slug)
      .neq("id", groupId)
      .maybeSingle();

    if (existing) {
      return { success: false, error: "A group with this slug already exists." };
    }
  }

  const { error } = await supabase
    .from("groups")
    .update({
      name,
      slug,
      description,
      is_public: isPublic,
      updated_at: new Date().toISOString(),
    })
    .eq("id", groupId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/dashboard/groups/${groupId}`);
  revalidatePath("/dashboard/groups");
  return { success: true };
}
