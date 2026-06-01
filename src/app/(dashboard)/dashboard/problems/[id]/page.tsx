import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { VoteButton } from "@/components/problems/VoteButton";
import { AIInsightCard } from "@/components/AIInsightCard";

interface ProblemPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProblemPage({ params }: ProblemPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: problem } = await supabase
    .from("problems")
    .select("*")
    .eq("id", id)
    .single();

  const { count: voteCount } = await supabase
    .from("problem_votes")
    .select("*", { count: "exact", head: true })
    .eq("problem_id", id);

  if (!problem) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">{problem.title}</h1>
          <p className="text-muted-foreground">{problem.description}</p>
        </div>
        <Link href={`/proposals/new?problem_id=${problem.id}`}>
          <Button className="shrink-0">
            Create Proposal
          </Button>
        </Link>
      </div>

      <div className="border rounded-xl p-4">
        <h2 className="font-semibold mb-3">Voting Test</h2>

        <VoteButton problemId={problem.id} initialVotes={voteCount ?? 0} />
      </div>

      <AIInsightCard problemId={problem.id} initialAiSummary={problem.ai_summary ?? null} />
    </div>
  );
}
