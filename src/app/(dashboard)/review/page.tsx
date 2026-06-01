import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge from "@/components/proposals/status-badge";
import { createClient } from "@/lib/supabase/server";
import { ReviewActionButtons } from "./ReviewActionButtons";

interface ReviewProposal {
  id: string;
  title: string;
  overview: string | null;
  goals: string[] | null;
  status: string;
  created_at: string | null;
}

export default async function ReviewPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("proposals")
    .select("id,title,overview,goals,status,created_at")
    .order("created_at", { ascending: false });

  const proposals = (data ?? []) as ReviewProposal[];

  if (error) {
    return (
      <div className="rounded-3xl border border-destructive/20 bg-destructive/10 p-6">
        <h1 className="text-2xl font-semibold text-destructive">Unable to load proposals</h1>
        <p className="mt-2 text-sm text-destructive/80">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Review Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Review submitted proposals and surface the next step for each idea.
          </p>
        </div>
      </div>

      {proposals.length === 0 ? (
        <div className="rounded-3xl border border-dashed p-10 text-center">
          <h2 className="text-xl font-semibold">No proposals available</h2>
          <p className="mt-2 text-sm text-muted-foreground">No review items were found. Check back after submissions appear.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {proposals.map((proposal) => {
            const goal = Array.isArray(proposal.goals) && proposal.goals.length > 0
              ? proposal.goals[0]
              : proposal.overview ?? "No goal provided";

            return (
              <Card key={proposal.id} className="flex h-full flex-col justify-between overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle>{proposal.title || "Untitled Proposal"}</CardTitle>
                    <StatusBadge status={proposal.status} />
                  </div>
                  <CardDescription>{goal}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">{proposal.overview ?? "No overview available."}</p>
                  {proposal.created_at ? (
                    <p className="text-xs text-muted-foreground">Created: {new Date(proposal.created_at).toLocaleDateString()}</p>
                  ) : null}
                </CardContent>

                <CardFooter>
                  <ReviewActionButtons proposalId={proposal.id} />
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
