"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { approveProposal, rejectProposal, reviseProposal } from "./action";

interface ReviewActionButtonsProps {
  proposalId: string;
}

export function ReviewActionButtons({ proposalId }: ReviewActionButtonsProps) {
  const router = useRouter();
  const [busyAction, setBusyAction] = useState<"approve" | "revise" | "reject" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAction(action: "approve" | "revise" | "reject") {
    setBusyAction(action);
    setError(null);

    const result =
      action === "approve"
        ? await approveProposal(proposalId)
        : action === "revise"
        ? await reviseProposal(proposalId)
        : await rejectProposal(proposalId);

    setBusyAction(null);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={busyAction !== null}
          onClick={() => void handleAction("approve")}
        >
          {busyAction === "approve" ? "Approving..." : "Approve"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={busyAction !== null}
          onClick={() => void handleAction("revise")}
        >
          {busyAction === "revise" ? "Marking..." : "Revise"}
        </Button>

        <Button
          variant="destructive"
          size="sm"
          disabled={busyAction !== null}
          onClick={() => void handleAction("reject")}
        >
          {busyAction === "reject" ? "Rejecting..." : "Reject"}
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
