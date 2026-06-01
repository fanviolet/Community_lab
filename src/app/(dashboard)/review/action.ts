import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProposalReviewResult =
  | { success: true }
  | { success: false; error: string };

async function updateProposalStatus(
  id: string,
  status: "approved" | "revise" | "rejected"
): Promise<ProposalReviewResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("proposals")
    .update({ status })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard/review");

  return { success: true };
}

export async function approveProposal(id: string) {
  "use server";
  return await updateProposalStatus(id, "approved");
}

export async function reviseProposal(id: string) {
  "use server";
  return await updateProposalStatus(id, "revise");
}

export async function rejectProposal(id: string) {
  "use server";
  return await updateProposalStatus(id, "rejected");
}
