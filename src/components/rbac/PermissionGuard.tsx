"use client";

import type { ReactNode } from "react";

import { useRBAC } from "@/contexts/rbac-context";
import type { Permission, RBACContext } from "@/lib/rbac";

interface PermissionGuardProps {
  permission: Permission;
  context?: Partial<RBACContext>;
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGuard({
  permission,
  context,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const rbac = useRBAC();

  if (!rbac.hasPermission(permission, context)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
