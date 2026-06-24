import { redirect } from "next/navigation";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Lightbulb, Plus, Search, Eye, Clock, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import {
  createAuthenticatedContext,
  hasPermission,
  parseRole,
} from "@/lib/rbac";
import { getPitches, getPitchMetrics } from "./actions";
import { ProposalCard } from "@/components/dashboard/ProposalCard";

export default async function PitchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = parseRole(profile?.role);
  const ctx = createAuthenticatedContext(role, user.id);

  if (!hasPermission(ctx, "pitch.view")) {
    redirect("/dashboard");
  }

  const canCreate = hasPermission(ctx, "pitch.create");
  const canReview = hasPermission(ctx, "pitch.approve") || hasPermission(ctx, "pitch.reject");

  const [pitches, metrics] = await Promise.all([
    getPitches({
      status: resolvedSearchParams.status,
      created_by: role === "member" ? user.id : undefined,
    }),
    getPitchMetrics(role === "member" ? { created_by: user.id } : undefined),
  ]);

  // Fetch review queue for admins/mentors/experts
  let reviewQueue: any[] = [];
  if (canReview) {
    const { data: reviewData } = await supabase
      .from("pitches")
      .select("id,title,status,created_at,created_by,ai_score")
      .in("status", ["submitted", "under_review"])
      .order("ai_score", { ascending: false })
      .limit(5);
    reviewQueue = reviewData || [];
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-border/50 bg-gradient-to-r from-primary/10 to-primary/5 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/20">
              <Lightbulb className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Proposal Center</h1>
              <p className="text-sm text-muted-foreground">
                Create and manage project proposals
              </p>
            </div>
          </div>
          {canCreate && (
            <Button asChild>
              <Link href="/dashboard/pitch/new">
                <Plus className="mr-2 h-4 w-4" />
                New Proposal
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Review Queue - Only for reviewers */}
      {canReview && reviewQueue.length > 0 && (
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Eye className="size-5 text-primary" />
              Review Queue
            </CardTitle>
            <CardDescription>
              {reviewQueue.length} proposals awaiting review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reviewQueue.map((proposal: any) => (
                <Link
                  key={proposal.id}
                  href={`/dashboard/pitch/${proposal.id}`}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground line-clamp-1">{proposal.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>AI Score: {proposal.ai_score || 0}%</span>
                      <span>•</span>
                      <span>{new Date(proposal.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      proposal.status === "submitted"
                        ? "text-amber-600 border-amber-200"
                        : "text-blue-600 border-blue-200"
                    }
                  >
                    {proposal.status === "submitted" ? "Submitted" : "Under Review"}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.drafts}</div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Submitted
              <Clock className="size-4 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.submitted}</div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Approved
              <CheckCircle className="size-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.approved}</div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              Rejected
              <XCircle className="size-4 text-rose-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Filter Proposals</CardTitle>
          <CardDescription>
            Search and filter by status or keywords.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search proposals..."
                  className="pl-10"
                  name="search"
                  defaultValue={resolvedSearchParams.search}
                />
              </div>
            </div>
            <Select name="status" defaultValue={resolvedSearchParams.status}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="revision_required">Revision Required</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">Apply</Button>
          </div>
        </CardContent>
      </Card>

      {/* Proposals Grid */}
      {pitches.length === 0 ? (
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No proposals found</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              {canCreate
                ? "Create your first proposal to get started."
                : "Wait for proposals to be created."}
            </p>
            {canCreate && (
              <Button asChild>
                <Link href="/dashboard/pitch/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Proposal
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pitches.map((pitch: any) => (
            <ProposalCard
              key={pitch.id}
              id={pitch.id}
              title={pitch.title}
              status={pitch.status}
              author={pitch.created_by || "Unknown"}
              date={pitch.created_at}
              voteCount={0}
              aiScore={pitch.ai_score || 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
