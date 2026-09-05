"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { reviewJoinRequest } from "@/app/dashboard/groups/actions";
import type { GroupJoinRequest } from "@/lib/groups/types";

interface JoinRequestsPanelProps {
  requests: GroupJoinRequest[];
}

export function JoinRequestsPanel({ requests }: JoinRequestsPanelProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (requests.length === 0) {
    return null;
  }

  const handleReview = (requestId: string, approve: boolean, userName: string) => {
    startTransition(async () => {
      const result = await reviewJoinRequest(requestId, approve);
      if (result.success) {
        toast.success(
          approve
            ? `${userName} has been added to the group`
            : `Request from ${userName} has been rejected`
        );
      } else {
        toast.error(result.error || "Failed to process request. Please try again.");
      }
      router.refresh();
    });
  };

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold">Pending join requests</h3>
      <ul className="space-y-3">
        {requests.map((request) => {
          const userName = request.profile?.display_name || request.profile?.email || "Unknown user";
          return (
            <li
              key={request.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 p-3"
            >
              <div>
                <p className="text-sm font-medium">{userName}</p>
                {request.message && (
                  <p className="text-xs text-muted-foreground">{request.message}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => handleReview(request.id, false, userName)}
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  disabled={pending}
                  onClick={() => handleReview(request.id, true, userName)}
                >
                  Approve
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
