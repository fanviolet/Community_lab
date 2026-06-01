"use client";

import { useState } from "react";
import { updateProposal } from "@/app/actions/proposals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  proposal: any;
};

export default function ProposalEditForm({ proposal }: Props) {
  const [title, setTitle] = useState(proposal.title ?? "");
  const [overview, setOverview] = useState(proposal.overview ?? "");
  const [goals, setGoals] = useState((proposal.goals || []).join("\n"));
  const [timeline, setTimeline] = useState(proposal.timeline ?? "");

  return (
    <form action={updateProposal} className="space-y-4">
      <input type="hidden" name="id" value={proposal.id} />

      <div>
        <label className="text-sm font-medium">Title</label>
        <Input name="title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div>
        <label className="text-sm font-medium">Overview</label>
        <Textarea name="overview" value={overview} onChange={(e) => setOverview(e.target.value)} />
      </div>

      <div>
        <label className="text-sm font-medium">Goals (one per line)</label>
        <Textarea name="goals" value={goals} onChange={(e) => setGoals(e.target.value)} />
      </div>

      <div>
        <label className="text-sm font-medium">Timeline</label>
        <Textarea name="timeline" value={timeline} onChange={(e) => setTimeline(e.target.value)} />
      </div>

      <div className="flex gap-2">
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}
