"use client"

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatusBadge from "@/components/proposals/status-badge";

export type ProposalStatusFilter = "All" | "submitted" | "approved" | "revise" | "rejected";

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
}

interface Props {
  proposals: ProposalItem[];
}

const statusFilters: { label: string; value: ProposalStatusFilter }[] = [
  { label: "All", value: "All" },
  { label: "Pending", value: "submitted" },
  { label: "Approved", value: "approved" },
  { label: "Revise", value: "revise" },
  { label: "Rejected", value: "rejected" },
];

export function ProposalList({ proposals }: Props) {
  const [activeFilter, setActiveFilter] = useState<ProposalStatusFilter>("All");

  const counts = useMemo(
    () => ({
      All: proposals.length,
      submitted: proposals.filter((proposal) => proposal.status === "submitted").length,
      approved: proposals.filter((proposal) => proposal.status === "approved").length,
      revise: proposals.filter((proposal) => proposal.status === "revise").length,
      rejected: proposals.filter((proposal) => proposal.status === "rejected").length,
    }),
    [proposals],
  );

  const filteredProposals = useMemo(() => {
    if (activeFilter === "All") {
      return proposals;
    }

    return proposals.filter((proposal) => proposal.status === activeFilter);
  }, [activeFilter, proposals]);

  return (
    <div className="grid gap-4">
      <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as ProposalStatusFilter)}>
        <TabsList
          variant="line"
          className="h-auto w-full flex-wrap justify-start gap-1 rounded-none border-b border-border bg-transparent p-0"
        >
          {statusFilters.map((filter) => (
            <TabsTrigger
              key={filter.value}
              value={filter.value}
              className="rounded-none px-3 py-2 after:bottom-0"
            >
              <span>{filter.label}</span>
              <span className="ml-1 text-xs text-muted-foreground">({counts[filter.value] ?? 0})</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filteredProposals.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center">
          <h3 className="text-lg font-semibold">No proposals found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Try another status or create a new proposal.
          </p>
        </div>
      ) : (
        filteredProposals.map((proposal) => {
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
                  <Link href={href}>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                  <Link href={`/proposals/${proposal.id}/edit`}>
                    <Button size="sm">Edit</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
