import { Badge } from "@/components/ui/badge";

type Props = {
  status: string;
};

export default function StatusBadge({ status }: Props) {
  const s = status ?? "draft";

  const variant =
    s === "draft"
      ? "secondary"
      : s === "pending"
      ? "pending"
      : s === "approved"
      ? "approved"
      : s === "rejected"
      ? "rejected"
      : "default";

  // Human-friendly label
  const label = s === "draft" ? "Draft" : s.charAt(0).toUpperCase() + s.slice(1);

  return <Badge variant={variant}>{label}</Badge>;
}
