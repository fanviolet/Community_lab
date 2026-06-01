import { notFound } from "next/navigation";
import { ProposalPreview } from "@/components/proposal/ProposalPreview";
import { createClient } from "@/lib/supabase/server";
import type { ProposalFormState, ProposalProblem } from "@/types/proposal";

interface ViewProposalPageProps {
  params: Promise<{ id: string }>;
}

export default async function ViewProposalPage({ params }: ViewProposalPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("id,problem_id,title,overview,goals,timeline,team_notes,status")
    .eq("id", id)
    .eq("status", "submitted")
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

  const proposalState: ProposalFormState = {
    id: proposal.id,
    problemId: proposal.problem_id,
    title: proposal.title ?? "",
    overview: proposal.overview ?? "",
    goals: Array.isArray(proposal.goals) ? proposal.goals : [],
    timeline: proposal.timeline ?? "",
    teamNotes: proposal.team_notes ?? "",
    status: proposal.status as ProposalFormState["status"],
  };

  const previewProblem: ProposalProblem = {
    id: problem.id,
    title: problem.title,
    description: problem.description,
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold">Proposal Details</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Đây là bản đề xuất được submit. Bạn có thể xem nội dung chi tiết ở đây.
        </p>
      </div>

      <ProposalPreview proposal={proposalState} problem={previewProblem} />
    </div>
  );
}

