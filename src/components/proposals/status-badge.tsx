import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/translate";
import type { ProposalStatus } from "@/types/proposal";

export const statusConfig = {
  pending: {
    labelKey: "proposals.status_submitted",
    className: "bg-yellow-100 text-yellow-800",
  },
  approved: {
    labelKey: "proposals.status_approved",
    className: "bg-green-100 text-green-800",
  },
  revise: {
    labelKey: "proposals.status_revision_required",
    className: "bg-blue-100 text-blue-800",
  },
  rejected: {
    labelKey: "proposals.status_rejected",
    className: "bg-red-100 text-red-800",
  },
} as const;

export type ProposalStatusLabel = keyof typeof statusConfig;

export function getStatusConfig(status?: ProposalStatus | string | null) {
  const normalizedStatus: ProposalStatusLabel | undefined =
    status === "pending" || status === "submitted"
      ? "pending"
      : status === "approved"
      ? "approved"
      : status === "revise"
      ? "revise"
      : status === "rejected"
      ? "rejected"
      : undefined;

  return normalizedStatus
    ? statusConfig[normalizedStatus]
    : { labelKey: "common.none", className: "bg-muted text-muted-foreground" };
}

type Props = {
  status?: string | null;
};

export default function StatusBadge({ status }: Props) {
  const config = getStatusConfig(status);

  return <Badge className={config.className}>{t(config.labelKey)}</Badge>;
}
