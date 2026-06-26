"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  CreateInvitationInput,
  CreateSkillInput,
  UpdateSkillInput,
  CreateAvailabilityInput,
  TeamInvitationWithInviter,
  MemberSkill,
  MemberAvailability,
  TeamMember,
  TeamAnalytics,
  MemberContribution,
} from "@/types/team-management";

// Invitation Actions
export async function getInvitations() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("team_invitations")
    .select(`
      *,
      inviter:profiles(id, display_name, email, avatar_url)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as TeamInvitationWithInviter[];
}

export async function createInvitation(input: CreateInvitationInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Không có quyền truy cập");
  }

  // Generate token
  const { data: tokenData } = await supabase.rpc("generate_invitation_token");
  const token = tokenData;

  // Set expiration to 7 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data, error } = await supabase
    .from("team_invitations")
    .insert({
      email: input.email,
      role: input.role,
      invited_by: user.id,
      token,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dashboard/team");
  return data;
}

export async function deleteInvitation(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("team_invitations")
    .delete()
    .eq("id", id);

  if (error) throw error;

  revalidatePath("/dashboard/team");
}

export async function acceptInvitation(token: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Không có quyền truy cập");
  }

  const { data, error } = await supabase
    .from("team_invitations")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .eq("token", token)
    .select()
    .single();

  if (error) throw error;

  // Update user role
  await supabase
    .from("profiles")
    .update({ role: data.role })
    .eq("id", user.id);

  revalidatePath("/dashboard/team");
  return data;
}

// Member Skills Actions
export async function getMemberSkills(profileId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("member_skills")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as MemberSkill[];
}

export async function createSkill(input: CreateSkillInput) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("member_skills")
    .insert(input)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dashboard/team");
  return data;
}

export async function updateSkill(id: string, input: UpdateSkillInput) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("member_skills")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dashboard/team");
  return data;
}

export async function deleteSkill(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("member_skills")
    .delete()
    .eq("id", id);

  if (error) throw error;

  revalidatePath("/dashboard/team");
}

export async function verifySkill(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("member_skills")
    .update({ verified: true })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dashboard/team");
  return data;
}

// Member Availability Actions
export async function getMemberAvailability(profileId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("member_availability")
    .select("*")
    .eq("profile_id", profileId)
    .order("day_of_week", { ascending: true });

  if (error) throw error;
  return data as MemberAvailability[];
}

export async function createAvailability(input: CreateAvailabilityInput) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("member_availability")
    .insert(input)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dashboard/team");
  return data;
}

export async function updateAvailability(id: string, input: Partial<CreateAvailabilityInput>) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("member_availability")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dashboard/team");
  return data;
}

export async function deleteAvailability(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("member_availability")
    .delete()
    .eq("id", id);

  if (error) throw error;

  revalidatePath("/dashboard/team");
}

// Team Members Actions
export async function getTeamMembers() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, email, role, avatar_url, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as TeamMember[];
}

export async function updateMemberRole(profileId: string, role: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", profileId)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dashboard/team");
  return data;
}

export async function removeMember(profileId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ role: null })
    .eq("id", profileId);

  if (error) throw error;

  revalidatePath("/dashboard/team");
}

// Team Analytics Actions
export async function getTeamAnalytics(): Promise<TeamAnalytics> {
  const supabase = await createClient();

  const [membersResult, invitationsResult, skillsResult, contributionsResult] = await Promise.all([
    supabase.from("profiles").select("role").not("role", "is", null),
    supabase.from("team_invitations").select("status").eq("status", "pending"),
    supabase.from("member_skills").select("*"),
    supabase.from("member_contributions").select("impact_score"),
  ]);

  const members = (membersResult.data || []) as Pick<TeamMember, 'role'>[];
  const invitations = invitationsResult.data || [];
  const skills = skillsResult.data || [];
  const contributions = (contributionsResult.data || []) as MemberContribution[];

  const total_members = members.length;
  const active_members = members.length; // Simplified - could be based on recent activity
  const pending_invitations = invitations.length;
  const total_skills = skills.length;
  const total_contributions = contributions.length;

  const contributionsWithScore = contributions.filter((c) => c.impact_score !== null);
  const average_impact_score = contributionsWithScore.length > 0
    ? contributionsWithScore.reduce((sum, c) => sum + (c.impact_score || 0), 0) / contributionsWithScore.length
    : 0;

  const participation_rate = total_members > 0 ? (active_members / total_members) * 100 : 0;

  const role_distribution = {
    admin: members.filter((m) => m.role === "admin").length,
    leader: members.filter((m) => m.role === "leader").length,
    builder: members.filter((m) => m.role === "builder").length,
    expert: members.filter((m) => m.role === "expert").length,
    mentor: members.filter((m) => m.role === "mentor").length,
    member: members.filter((m) => m.role === "member").length,
  };

  return {
    total_members,
    active_members,
    pending_invitations,
    total_skills,
    total_contributions,
    average_impact_score,
    participation_rate,
    role_distribution,
  };
}

// Team Activity Actions
export async function getTeamActivity(limit: number = 50) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("team_activity_log")
    .select(`
      *,
      profile:profiles(id, display_name, email, avatar_url)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function logTeamActivity(
  profileId: string,
  activityType: string,
  activityDescription?: string,
  metadata?: any
) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("log_team_activity", {
    p_profile_id: profileId,
    p_activity_type: activityType,
    p_activity_description: activityDescription,
    p_metadata: metadata,
  });

  if (error) throw error;
  return data;
}
