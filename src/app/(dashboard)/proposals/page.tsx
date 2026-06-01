import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import StatusBadge from "@/components/proposals/status-badge";
import { createClient } from "@/lib/supabase/server";
import type { ProposalFormState } from "@/types/proposal";

interface ProposalItem {
  id: string;
  problem_id: string;
  title: string;
  overview: string;
  goals: string[];
  timeline: string;
  team_notes: string;
  status: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
  problem?: {
    id: string;
    title: string;
  };
}

export default async function ProposalsPage() {
  const supabase = await createClient();

  // Load proposals belonging to current user
  const { data: authData } = await supabase.auth.getUser();
  const currentUserId = authData?.user?.id ?? null;

  if (!currentUserId) {
    return (
      <div className="rounded-2xl border border-dashed p-6 text-center">
        <h3 className="font-semibold">Not signed in</h3>
        <p className="text-sm text-muted-foreground">Please sign in to view your proposals.</p>
      </div>
    );
  }

  const { data: proposals = [], error } = await supabase
    .from("proposals")
    .select("id,problem_id,title,overview,goals,timeline,team_notes,status,created_at,updated_at,user_id")
    .eq("user_id", currentUserId)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6">
        <h3 className="font-semibold text-destructive">Error loading proposals</h3>
        <p className="text-sm text-destructive/80">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Proposals</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse submitted proposals or create a new one to solve community problems.
          </p>
        </div>
        <Link href="/problems">
          <Button>
            Create Proposal
          </Button>
        </Link>
      </div>

      {(proposals ?? []).length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <h3 className="text-lg font-semibold">No proposals yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Start by selecting a problem and building your proposal.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {(proposals ?? []).map((proposal) => {
            const isDraft = proposal.status === "draft";
            const href = isDraft ? `/proposals/${proposal.id}/edit` : `/proposals/${proposal.id}`;

            return (
              <Card key={proposal.id} className="transition-all hover:-translate-y-1 hover:shadow-lg">
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-xl font-semibold">{proposal.title || "Untitled"}</h3>
                    <StatusBadge status={proposal.status} />
                  </div>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {proposal.overview || "No overview provided"}
                  </p>
                </CardHeader>
                <CardContent className="space-y-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">📌 {Array.isArray(proposal.goals) ? proposal.goals.length : 0} goals</p>
                    {proposal.created_at && (
                      <p className="text-xs text-muted-foreground">Created: {new Date(proposal.created_at).toLocaleDateString()}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/proposals/${proposal.id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                    <Link href={`/proposals/${proposal.id}/edit`}>
                      <Button size="sm">Edit</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
