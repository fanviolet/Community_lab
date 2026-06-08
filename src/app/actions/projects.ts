"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CreateProjectResult =
  | { success: true; projectId: string }
  | { success: false; error: string };

export type ProposalReviewResult =
  | { success: true }
  | { success: false; error: string };

async function getSupabaseClient() {
  const supabase = await createClient();
  if (!supabase) {
    return { supabase: null, error: "Supabase is not configured." };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return { supabase, error: error.message ?? "Unable to verify authentication." };
  }

  if (!user) {
    redirect("/login");
  }

  return { supabase, user } as const;
}

function parseDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

async function fetchProfileMeta(supabase: any, userId: string) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("name,avatar_url")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) {
      return { name: null, avatar_url: null };
    }

    return {
      name: data.name ?? null,
      avatar_url: data.avatar_url ?? null,
    };
  } catch {
    return { name: null, avatar_url: null };
  }
}

export async function createProject(formData: FormData): Promise<CreateProjectResult> {
  "use server";

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const startDateRaw = String(formData.get("startDate") ?? "").trim();
  const endDateRaw = String(formData.get("endDate") ?? "").trim();

  if (!title) {
    return { success: false, error: "Title is required." };
  }

  const startDate = parseDate(startDateRaw || null);
  const endDate = parseDate(endDateRaw || null);

  if (startDateRaw && !startDate) {
    return { success: false, error: "Start date is invalid." };
  }

  if (endDateRaw && !endDate) {
    return { success: false, error: "End date is invalid." };
  }

  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    return { success: false, error: "End date must be the same or later than start date." };
  }

  const clientResult = await getSupabaseClient();
  if (!clientResult.supabase) {
    return { success: false, error: clientResult.error };
  }

  const { supabase, user } = clientResult;
  if (!user) {
    // ❌ Thiếu field 'success'


    // ✅ Đúng — phải có đủ cả 2
    return { success: false, error: 'Unauthorized' }
  }
  const profile = await fetchProfileMeta(supabase, user.id);

  const projectRow: Record<string, unknown> = {
    title,
    description: description || null,
    status: "active",
  };

  if (startDate) {
    projectRow.start_date = startDate;
  }

  if (endDate) {
    projectRow.end_date = endDate;
  }

  const { data: project, error } = await supabase
    .from("projects")
    .insert(projectRow)
    .select()
    .single();

  if (error || !project) {
    return { success: false, error: error?.message ?? "Unable to create project." };
  }

  const memberPayload: Record<string, unknown> = {
    project_id: project.id,
    user_id: user.id,
    role: "leader",
  };

  if (profile.name) {
    memberPayload.name = profile.name;
  }

  if (profile.avatar_url) {
    memberPayload.avatar_url = profile.avatar_url;
  }

  const { error: memberError } = await supabase.from("project_members").insert(memberPayload);
  if (memberError) {
    await supabase.from("project_members").insert({
      project_id: project.id,
      user_id: user.id,
      role: "leader",
    });
  }

  revalidatePath("/dashboard/workspace");

  return { success: true, projectId: project.id };
}

export async function createProjectFromProposal(proposalId: string): Promise<ProposalReviewResult> {
  const supabase = await createClient();
  if (!supabase) {
    return { success: false, error: "Supabase is not configured." };
  }

  const { data: proposal, error: proposalError } = await supabase
    .from("proposals")
    .select("id,title,overview,user_id")
    .eq("id", proposalId)
    .single();

  if (proposalError || !proposal) {
    return { success: false, error: proposalError?.message ?? "Proposal not found." };
  }

  const { error: updateError } = await supabase
    .from("proposals")
    .update({ status: "approved" })
    .eq("id", proposalId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  const { data: existingProject } = await supabase
    .from("projects")
    .select("id")
    .eq("proposal_id", proposalId)
    .maybeSingle();

  if (existingProject?.id) {
    revalidatePath("/review");
    revalidatePath("/dashboard/workspace");
    return { success: true };
  }

  const profile = await fetchProfileMeta(supabase, proposal.user_id);

  const projectPayload: Record<string, unknown> = {
    title: proposal.title,
    description: proposal.overview ?? null,
    status: "active",
    proposal_id: proposal.id,
  };

  const { data: newProject, error: projectError } = await supabase
    .from("projects")
    .insert(projectPayload)
    .select()
    .single();

  if (projectError || !newProject) {
    return { success: false, error: projectError?.message ?? "Unable to create project." };
  }

  const memberPayload: Record<string, unknown> = {
    project_id: newProject.id,
    user_id: proposal.user_id,
    role: "leader",
  };

  if (profile.name) {
    memberPayload.name = profile.name;
  }

  if (profile.avatar_url) {
    memberPayload.avatar_url = profile.avatar_url;
  }

  const { error: memberError } = await supabase.from("project_members").insert(memberPayload);
  if (memberError) {
    await supabase.from("project_members").insert({
      project_id: newProject.id,
      user_id: proposal.user_id,
      role: "leader",
    });
  }

  await supabase.from("activities").insert({
    project_id: newProject.id,
    description: "Project created from approved proposal",
    user_name: profile.name ?? null,
  });

  revalidatePath("/dashboard/workspace");

  return { success: true };
}
