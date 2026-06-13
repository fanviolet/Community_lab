"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  CreateMentorProfileInput,
  UpdateMentorProfileInput,
  CreateMentorshipRequestInput,
  UpdateMentorshipRequestInput,
  CreateMentoringSessionInput,
  UpdateMentoringSessionInput,
  CreateMentoringProgressInput,
  UpdateMentoringProgressInput,
  CreateMentorFeedbackInput,
  CreateMentorCommunicationInput,
  MentorProfileWithUser,
  MentorshipRequestWithRelations,
  MentoringSessionWithCreator,
  MentoringProgressWithAssignee,
  MentorCommunicationWithUser,
} from "@/types/mentoring";

// Mentor Profile Actions
export async function getMentorProfiles(filters?: {
  expertise?: string;
  search?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("mentor_profiles")
    .select(`
      *,
      user:profiles!mentor_profiles_user_id_fkey(id, full_name, email, avatar_url)
    `)
    .order("rating_avg", { ascending: false, nullsFirst: false });

  if (filters?.expertise) {
    query = query.contains("expertise", [filters.expertise]);
  }

  if (filters?.search) {
    query = query.ilike("user.full_name", `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as MentorProfileWithUser[];
}

export async function getMentorProfileByUserId(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("mentor_profiles")
    .select(`
      *,
      user:profiles!mentor_profiles_user_id_fkey(id, full_name, email, avatar_url)
    `)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data as MentorProfileWithUser | null;
}

export async function createMentorProfile(input: CreateMentorProfileInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("mentor_profiles")
    .insert({
      ...input,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dashboard/mentoring");
  return data;
}

export async function updateMentorProfile(userId: string, input: UpdateMentorProfileInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("mentor_profiles")
    .update(input)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dashboard/mentoring");
  return data;
}

// Mentorship Request Actions
export async function getMentorshipRequests(filters?: {
  status?: string;
  mentor_id?: string;
  requested_by?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("mentorship_requests")
    .select(`
      *,
      project:projects(id, title),
      mentor:profiles!mentorship_requests_mentor_id_fkey(id, full_name, email, avatar_url),
      requested_by_user:profiles!mentorship_requests_requested_by_fkey(id, full_name, email)
    `)
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.mentor_id) {
    query = query.eq("mentor_id", filters.mentor_id);
  }

  if (filters?.requested_by) {
    query = query.eq("requested_by", filters.requested_by);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as MentorshipRequestWithRelations[];
}

export async function getMentorshipRequestById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("mentorship_requests")
    .select(`
      *,
      project:projects(id, title),
      mentor:profiles!mentorship_requests_mentor_id_fkey(id, full_name, email, avatar_url),
      requested_by_user:profiles!mentorship_requests_requested_by_fkey(id, full_name, email)
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as MentorshipRequestWithRelations;
}

export async function createMentorshipRequest(input: CreateMentorshipRequestInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("mentorship_requests")
    .insert({
      ...input,
      requested_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dashboard/mentoring");
  return data;
}

export async function updateMentorshipRequest(id: string, input: UpdateMentorshipRequestInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("mentorship_requests")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dashboard/mentoring");
  revalidatePath(`/dashboard/mentoring/${id}`);
  return data;
}

export async function deleteMentorshipRequest(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("mentorship_requests")
    .delete()
    .eq("id", id);

  if (error) throw error;

  revalidatePath("/dashboard/mentoring");
}

// Mentoring Session Actions
export async function getMentoringSessions(mentorshipRequestId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("mentoring_sessions")
    .select(`
      *,
      created_by_user:profiles(id, full_name, email)
    `)
    .eq("mentorship_request_id", mentorshipRequestId)
    .order("session_date", { ascending: false });

  if (error) throw error;
  return data as MentoringSessionWithCreator[];
}

export async function createMentoringSession(input: CreateMentoringSessionInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("mentoring_sessions")
    .insert({
      ...input,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dashboard/mentoring");
  revalidatePath(`/dashboard/mentoring/${input.mentorship_request_id}`);
  return data;
}

export async function updateMentoringSession(id: string, input: UpdateMentoringSessionInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("mentoring_sessions")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dashboard/mentoring");
  return data;
}

export async function deleteMentoringSession(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("mentoring_sessions")
    .delete()
    .eq("id", id);

  if (error) throw error;

  revalidatePath("/dashboard/mentoring");
}

// Progress Tracking Actions
export async function getMentoringProgress(mentorshipRequestId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("mentoring_progress")
    .select(`
      *,
      assigned_to_user:profiles(id, full_name, email)
    `)
    .eq("mentorship_request_id", mentorshipRequestId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as MentoringProgressWithAssignee[];
}

export async function createMentoringProgress(input: CreateMentoringProgressInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("mentoring_progress")
    .insert(input)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dashboard/mentoring");
  revalidatePath(`/dashboard/mentoring/${input.mentorship_request_id}`);
  return data;
}

export async function updateMentoringProgress(id: string, input: UpdateMentoringProgressInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("mentoring_progress")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dashboard/mentoring");
  return data;
}

export async function deleteMentoringProgress(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("mentoring_progress")
    .delete()
    .eq("id", id);

  if (error) throw error;

  revalidatePath("/dashboard/mentoring");
}

// Communication Actions
export async function getMentorCommunications(mentorshipRequestId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("mentor_communications")
    .select(`
      *,
      from_user:profiles(id, full_name, email, avatar_url)
    `)
    .eq("mentorship_request_id", mentorshipRequestId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as MentorCommunicationWithUser[];
}

export async function createMentorCommunication(input: CreateMentorCommunicationInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("mentor_communications")
    .insert({
      ...input,
      from_user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dashboard/mentoring");
  revalidatePath(`/dashboard/mentoring/${input.mentorship_request_id}`);
  return data;
}

// Feedback Actions
export async function createMentorFeedback(input: CreateMentorFeedbackInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data, error } = await supabase
    .from("mentor_feedback")
    .insert({
      ...input,
      from_user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dashboard/mentoring");
  revalidatePath(`/dashboard/mentoring/${input.mentorship_request_id}`);
  return data;
}

// Helper Actions
export async function getProjects() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select("id, title")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getUsers() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url")
    .order("full_name", { ascending: true });

  if (error) throw error;
  return data;
}
