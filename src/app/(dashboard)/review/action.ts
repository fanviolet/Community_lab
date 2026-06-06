import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createProjectFromProposal } from "@/app/actions/projects";

export type ProposalReviewResult =
  | { success: true }
  | { success: false; error: string };

async function updateProposalStatus(
  id: string,
  status: "revise" | "rejected"
): Promise<ProposalReviewResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("proposals")
    .update({ status })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/review");

  return { success: true };
}

export async function approveProposal(id: string) {
  "use server";
  return await createProjectFromProposal(id);
}

export async function reviseProposal(id: string) {
  "use server";
  return await updateProposalStatus(id, "revise");
}

export async function rejectProposal(id: string) {
  "use server";
  return await updateProposalStatus(id, "rejected");
}

export async function approveProposalAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await approveProposal(id);
}

export async function reviseProposalAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await reviseProposal(id);
}

export async function rejectProposalAction(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await rejectProposal(id);
}
