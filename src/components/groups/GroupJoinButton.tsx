"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { requestJoinGroup } from "@/app/dashboard/groups/actions";
import type { GroupMembershipState } from "@/lib/groups/types";

interface GroupJoinButtonProps {
  groupId: string;
  membershipState: GroupMembershipState;
}

export function GroupJoinButton({
  groupId,
  membershipState,
}: GroupJoinButtonProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (membershipState === "member") {
    return (
      <Button variant="secondary" disabled>
        Member
      </Button>
    );
  }

  if (membershipState === "pending") {
    return (
      <Button variant="secondary" disabled>
        Request pending
      </Button>
    );
  }

  return (
    <Button
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await requestJoinGroup(groupId);
          if (result.success) {
            toast.success("Request sent successfully. Your request is pending approval.");
          } else {
            toast.error(result.error || "Failed to send request. Please try again.");
          }
          router.refresh();
        });
      }}
    >
      {pending ? "Sending..." : "Request to join"}
    </Button>
  );
}
