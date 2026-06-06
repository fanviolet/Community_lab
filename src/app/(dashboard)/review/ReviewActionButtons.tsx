import { Button } from "@/components/ui/button";
import {
  approveProposalAction,
  rejectProposalAction,
  reviseProposalAction,
} from "./action";

interface ReviewActionButtonsProps {
  proposalId: string;
}

export function ReviewActionButtons({ proposalId }: ReviewActionButtonsProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <form action={approveProposalAction} className="inline">
          <input type="hidden" name="id" value={proposalId} />
          <Button size="sm" type="submit">
            Approve
          </Button>
        </form>

        <form action={reviseProposalAction} className="inline">
          <input type="hidden" name="id" value={proposalId} />
          <Button variant="outline" size="sm" type="submit">
            Revise
          </Button>
        </form>

        <form action={rejectProposalAction} className="inline">
          <input type="hidden" name="id" value={proposalId} />
          <Button variant="destructive" size="sm" type="submit">
            Reject
          </Button>
        </form>
      </div>
    </div>
  );
}
