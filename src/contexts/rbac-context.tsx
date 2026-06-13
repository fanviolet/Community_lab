"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import {
  hasPermission,
  hasRole,
  type Permission,
  type RBACContext,
  Role,
} from "@/lib/rbac";

interface RBACContextValue extends RBACContext {
  hasPermission: (permission: Permission, overrides?: Partial<RBACContext>) => boolean;
  hasRole: (allowed: Role | Role[]) => boolean;
  withContext: (overrides: Partial<RBACContext>) => RBACContext;
}

const RbacReactContext = createContext<RBACContextValue | null>(null);

interface RBACProviderProps {
  children: ReactNode;
  role: Role;
  userId?: string;
}

export function RBACProvider({ children, role, userId }: RBACProviderProps) {
  const value = useMemo<RBACContextValue>(() => {
    const base: RBACContext = {
      role,
      userId,
      isAuthenticated: role !== Role.Guest && !!userId,
    };

    return {
      ...base,
      hasPermission: (permission, overrides = {}) =>
        hasPermission({ ...base, ...overrides }, permission),
      hasRole: (allowed) => hasRole(role, allowed),
      withContext: (overrides) => ({ ...base, ...overrides }),
    };
  }, [role, userId]);

  return (
    <RbacReactContext.Provider value={value}>{children}</RbacReactContext.Provider>
  );
}

export function useRBAC(): RBACContextValue {
  const context = useContext(RbacReactContext);

  if (!context) {
    throw new Error("useRBAC must be used within RBACProvider");
  }

  return context;
}
