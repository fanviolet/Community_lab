import { Badge } from "@/components/ui/badge";
import { Role } from "@/types/rbac";
import { cn } from "@/lib/utils";

interface RoleBadgeProps {
  role: Role | string;
  className?: string;
}

const ROLE_CONFIG: Record<Role, { label: string; variant: "default" | "secondary" | "outline" | "muted"; className: string }> = {
  [Role.Guest]: {
    label: "Guest",
    variant: "muted",
    className: "bg-gray-100 text-gray-700 hover:bg-gray-200",
  },
  [Role.Member]: {
    label: "Member",
    variant: "default",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-200",
  },
  [Role.Builder]: {
    label: "Builder",
    variant: "default",
    className: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200",
  },
  [Role.Expert]: {
    label: "Expert",
    variant: "default",
    className: "bg-purple-100 text-purple-700 hover:bg-purple-200",
  },
  [Role.Mentor]: {
    label: "Mentor",
    variant: "default",
    className: "bg-teal-100 text-teal-700 hover:bg-teal-200",
  },
  [Role.Leader]: {
    label: "Leader",
    variant: "default",
    className: "bg-amber-100 text-amber-700 hover:bg-amber-200",
  },
  [Role.Admin]: {
    label: "Admin",
    variant: "outline",
    className: "bg-red-100 text-red-700 hover:bg-red-200",
  },
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const normalizedRole = role.toLowerCase() as Role;
  const config = ROLE_CONFIG[normalizedRole] || ROLE_CONFIG[Role.Member];

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}

export function getRoleLabel(role: Role | string): string {
  const normalizedRole = role.toLowerCase() as Role;
  return ROLE_CONFIG[normalizedRole]?.label || role;
}

export function getRoleColor(role: Role | string): string {
  const normalizedRole = role.toLowerCase() as Role;
  return ROLE_CONFIG[normalizedRole]?.className || ROLE_CONFIG[Role.Member].className;
}
