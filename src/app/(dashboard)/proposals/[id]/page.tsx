import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReviewActionButtons } from "@/app/(dashboard)/review/ReviewActionButtons";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge, { getStatusConfig } from "@/components/proposals/status-badge";

interface ViewProposalPageProps {
  params: Promise<{ id: string }>;
}

interface ProposalDetail {
  id: string;
  problem_id: string;
  title: string | null;
  overview: string | null;
  goals: string[] | null;
  timeline: string | null;
  team_notes: string | null;
  status: string | null;
  impact?: string | null;
}

interface ProblemRecord {
  id: string;
  title: string | null;
  description: string | null;
}

export default async function ViewProposalPage({ params }: ViewProposalPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .single();

  if (!proposal) {
    notFound();
  }

  const proposalRecord = proposal as ProposalDetail;

  const { data: problem } = await supabase
    .from("problems")
    .select("id,title,description")
    .eq("id", proposalRecord.problem_id)
    .single();

  if (!problem) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Proposal Details</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Review the proposal details and update status when ready.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={proposalRecord.status ?? "draft"} />
            <span className="text-sm text-muted-foreground">
              {getStatusConfig(proposalRecord.status).label}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="border border-border bg-white shadow-sm">
          <CardHeader>
            <CardTitle>{proposalRecord.title || "Untitled proposal"}</CardTitle>
            <CardDescription>{problem.title ?? "Related problem"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <section>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Solution</p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {proposalRecord.overview || "No solution summary provided."}
              </p>
            </section>

            <section>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Goals</p>
              {Array.isArray(proposalRecord.goals) && proposalRecord.goals.length > 0 ? (
                <ul className="mt-3 space-y-2 list-inside list-disc text-sm text-muted-foreground">
                  {proposalRecord.goals.map((goal, index) => (
                    <li key={index}>{goal || "Goal description pending."}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">No goals specified yet.</p>
              )}
            </section>

            <section>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Timeline</p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {proposalRecord.timeline || "No timeline details provided."}
              </p>
            </section>

            <section>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Team</p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {proposalRecord.team_notes || "No team notes were shared."}
              </p>
            </section>

            <section>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Impact</p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {proposalRecord.impact || "No impact statement provided."}
              </p>
            </section>
          </CardContent>
        </Card>

        <Card className="border border-border bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Review actions</CardTitle>
            <CardDescription>Leader controls to approve, mark for revision, or reject.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Current status</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {proposalRecord.status ? proposalRecord.status : "Unknown"}
                </p>
              </div>
              <ReviewActionButtons proposalId={proposalRecord.id} />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 text-xs text-muted-foreground">
            <span>Action results refresh the page automatically.</span>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

