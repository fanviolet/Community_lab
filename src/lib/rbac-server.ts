import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getAuthSession, getCachedProfileRole } from "@/lib/auth/server";
import {
  createAuthenticatedContext,
  createGuestContext,
  hasPermission,
  parseRole,
  type Permission,
  type RBACContext,
  Role,
} from "@/lib/rbac";

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Không có quyền truy cập") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function getProfileRole(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<Role> {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return parseRole(data?.role);
}

export async function getProjectMembership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  projectId: string
): Promise<{ isProjectMember: boolean; isProjectLeader: boolean }> {
  const { data } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  return {
    isProjectMember: !!data,
    isProjectLeader: data?.role === "leader",
  };
}

export async function buildRBACContext(
  overrides: Partial<RBACContext> = {}
): Promise<RBACContext> {
  const { user } = await getAuthSession();

  if (!user) {
    return createGuestContext();
  }

  const role = await getCachedProfileRole(user.id);

  return createAuthenticatedContext(role, user.id, overrides);
}

export async function buildProjectRBACContext(
  projectId: string,
  overrides: Partial<RBACContext> = {}
): Promise<RBACContext> {
  const { supabase, user } = await getAuthSession();

  if (!user) {
    return createGuestContext();
  }

  const [globalRole, membership] = await Promise.all([
    getCachedProfileRole(user.id),
    getProjectMembership(supabase, user.id, projectId),
  ]);

  // Workspace role overrides global role
  let effectiveRole = globalRole;

  if (membership.isProjectLeader) {
    effectiveRole = Role.Leader;
  }

  return createAuthenticatedContext(effectiveRole, user.id, {
    ...membership,
    ...overrides,
  });
}

export function assertPermission(
  ctx: RBACContext,
  permission: Permission
): void {
  if (!ctx.isAuthenticated) {
    throw new UnauthorizedError();
  }

  if (!hasPermission(ctx, permission)) {
    throw new ForbiddenError(`Missing permission: ${permission}`);
  }
}

export function forbiddenResponse(message = "Forbidden") {
  return NextResponse.json(
    { error: message },
    { status: 403 }
  );
}

export function unauthorizedResponse(
  message = "Không có quyền truy cập"
) {
  return NextResponse.json(
    { error: message },
    { status: 401 }
  );
}

export async function requireAuthContext(): Promise<RBACContext> {
  const ctx = await buildRBACContext();

  if (!ctx.isAuthenticated) {
    throw new UnauthorizedError();
  }

  return ctx;
}

export async function requirePermission(
  permission: Permission,
  overrides: Partial<RBACContext> = {}
): Promise<RBACContext> {
  const ctx = await buildRBACContext(overrides);
  assertPermission(ctx, permission);
  return ctx;
}

export async function requireProjectPermission(
  projectId: string,
  permission: Permission,
  overrides: Partial<RBACContext> = {}
): Promise<RBACContext> {
  const ctx = await buildProjectRBACContext(projectId, overrides);
  assertPermission(ctx, permission);
  return ctx;
}