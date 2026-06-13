"use client";

import type { ReactNode } from "react";

import { useRBAC } from "@/contexts/rbac-context";
import { Role } from "@/lib/rbac";

interface RoleGuardProps {
  roles: Role | Role[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function RoleGuard({ roles, fallback = null, children }: RoleGuardProps) {
  const rbac = useRBAC();

  if (!rbac.hasRole(roles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
