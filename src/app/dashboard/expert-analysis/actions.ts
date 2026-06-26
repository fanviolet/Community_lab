"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  CreateAnalysisInput,
  UpdateAnalysisInput,
  CreateScorecardInput,
  UpdateScorecardInput,
  ExpertAnalysisWithRelations,
} from "@/types/expert-analysis";

export async function getAnalyses(filters?: {
  analysis_type?: string;
  status?: string;
  search?: string;
}) {
  const supabase = await createClient();

  let query = supabase
    .from("expert_analyses")
    .select(`
      *,
      problem:problem_id(id, title),
      project:project_id(id, title),
      author:created_by(id, display_name, email),
      scorecard:expert_scorecards(*)
    `)
    .order("created_at", { ascending: false });

  if (filters?.analysis_type) {
    query = query.eq("analysis_type", filters.analysis_type);
  }

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as ExpertAnalysisWithRelations[];
}

export async function getAnalysisById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("expert_analyses")
    .select(`
      *,
      problem:problem_id(id, title),
      project:project_id(id, title),
      author:created_by(id, display_name, email),
      scorecard:expert_scorecards(*)
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as ExpertAnalysisWithRelations;
}

export async function createAnalysis(input: CreateAnalysisInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Không có quyền truy cập");
  }

  const { data, error } = await supabase
    .from("expert_analyses")
    .insert({
      ...input,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dashboard/expert-analysis");
  return data;
}

export async function updateAnalysis(id: string, input: UpdateAnalysisInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Không có quyền truy cập");
  }

  const { data, error } = await supabase
    .from("expert_analyses")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dashboard/expert-analysis");
  revalidatePath(`/dashboard/expert-analysis/${id}`);
  return data;
}

export async function deleteAnalysis(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Không có quyền truy cập");
  }

  const { error } = await supabase
    .from("expert_analyses")
    .delete()
    .eq("id", id);

  if (error) throw error;

  revalidatePath("/dashboard/expert-analysis");
}

export async function createScorecard(input: CreateScorecardInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Không có quyền truy cập");
  }

  const { data, error } = await supabase
    .from("expert_scorecards")
    .insert({
      ...input,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dashboard/expert-analysis");
  revalidatePath(`/dashboard/expert-analysis/${input.analysis_id}`);
  return data;
}

export async function updateScorecard(id: string, input: UpdateScorecardInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Không có quyền truy cập");
  }

  const { data, error } = await supabase
    .from("expert_scorecards")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/dashboard/expert-analysis");
  revalidatePath(`/dashboard/expert-analysis/${id}`);
  return data;
}

export async function getProblems() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("problems")
    .select("id, title")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getProjects() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select("id, title")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
