import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProposalBuilder from "@/components/proposal/ProposalBuilder";
import type { ProposalFormState } from "@/types/proposal";

interface EditProposalPageProps {
     params: Promise<{ id: string }>;
}

export default async function EditProposalPage({ params }: EditProposalPageProps) {
     const { id } = await params;
     const supabase = await createClient();

     const { data: { user } } = await supabase.auth.getUser();
     if (!user) {
          notFound();
     }

     const { data: proposal } = await supabase
          .from("proposals")
          .select("id,problem_id,title,overview,goals,timeline,team_notes,status,user_id")
          .eq("id", id)
          .eq("user_id", user.id)
          .single();

     if (!proposal) {
          notFound();
     }

     const { data: problem } = await supabase
          .from("problems")
          .select("id,title,description")
          .eq("id", proposal.problem_id)
          .single();

     if (!problem) {
          notFound();
     }

     const initialProposal: Partial<ProposalFormState> = {
          id: proposal.id,
          problemId: proposal.problem_id,
          title: proposal.title ?? "",
          overview: proposal.overview ?? "",
          goals: Array.isArray(proposal.goals) ? proposal.goals : [""],
          timeline: proposal.timeline ?? "",
          teamNotes: proposal.team_notes ?? "",
          status: proposal.status,
     };

     return <ProposalBuilder initialProposal={initialProposal} problem={problem} />;
}
