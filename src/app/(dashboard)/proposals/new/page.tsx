import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProposalBuilder from "@/components/proposal/ProposalBuilder";

interface NewProposalPageProps {
     searchParams: Promise<{ problem_id?: string }>;
}

export default async function NewProposalPage({ searchParams }: NewProposalPageProps) {
     const { problem_id } = await searchParams;
     const problemId = problem_id;

     // Validate problem_id parameter
     if (!problemId) {
          return (
               <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-white p-8 shadow-sm">
                    <h1 className="text-2xl font-semibold">Missing problem selection</h1>
                    <p className="mt-3 text-sm text-muted-foreground">
                         This page needs a problem ID to create a proposal. Go back to the problem board and choose a problem first.
                    </p>
               </div>
          );
     }

     const supabase = await createClient();

     // Verify user is logged in
     const { data: { user } } = await supabase.auth.getUser();
     if (!user) {
          notFound();
     }

     // Load the problem to ensure it exists
     const { data: problem } = await supabase
          .from("problems")
          .select("id,title,description")
          .eq("id", problemId)
          .single();

     if (!problem) {
          notFound();
     }

     return <ProposalBuilder initialProposal={null} problem={problem} />;
}
