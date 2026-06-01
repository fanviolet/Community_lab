import { revalidatePath, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ProposalFormState } from "@/types/proposal";

export async function getUserProposals() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("proposals")
    .select("id,problem_id,title,overview,goals,timeline,status,created_at,updated_at,user_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getProposalById(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data || data.user_id !== user.id) return null;

  return data;
}

export async function updateProposal(formData: FormData) {
  'use server';
  const supabase = await createClient();

  const id = formData.get("id") as string;
  const title = (formData.get("title") as string) ?? "";
  const overview = (formData.get("overview") as string) ?? "";
  const goalsRaw = (formData.get("goals") as string) ?? "";
  const timeline = (formData.get("timeline") as string) ?? "";

  const goals = goalsRaw.split("\n").map((g) => g.trim()).filter(Boolean);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Only allow updating own proposals
  await supabase
    .from("proposals")
    .update({ title, overview, goals, timeline })
    .eq("id", id)
    .eq("user_id", user.id);

  // Revalidate proposals listing and redirect
  revalidatePath("/dashboard/proposals");
  redirect("/dashboard/proposals");
}
