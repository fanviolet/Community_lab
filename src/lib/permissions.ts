/**
 * @deprecated Use @/lib/rbac and @/lib/rbac-server instead.
 * Kept for backward compatibility with workspace components.
 */
import {
  getWorkspacePermissions,
  hasPermission,
  Role,
  type RBACContext,
} from "@/lib/rbac";

export type ProjectRole = "leader" | "member" | null;

export interface PermissionContext {
  isLeader: boolean;
  isMember: boolean;
  isAssignee?: boolean;
  userId?: string;
}

export function createPermissionContext(
  userRole: ProjectRole,
  isTaskAssignee = false,
  userId?: string
): PermissionContext {
  return {
    isLeader: userRole === "leader",
    isMember: userRole === "leader" || userRole === "member",
    isAssignee: isTaskAssignee,
    userId,
  };
}

export function getProjectPermissions(context: PermissionContext) {
  const rbacCtx: RBACContext = {
    role: context.isLeader ? Role.Leader : context.isMember ? Role.Member : Role.Guest,
    userId: context.userId,
    isAuthenticated: context.isMember || context.isLeader,
    isProjectMember: context.isMember,
    isProjectLeader: context.isLeader,
    isAssignee: context.isAssignee,
  };

  const perms = getWorkspacePermissions(rbacCtx);

  return {
    canViewProject: perms.canViewWorkspace,
    canEditProject: perms.canEditProject,
    canArchiveProject: perms.canArchiveProject,
    canManageMembers: perms.canManageMembers,
    canViewMembers: perms.canViewWorkspace,
    canViewTasks: perms.canViewWorkspace,
    canCreateTask: perms.canCreateTask,
    canEditTask: (_taskId: string, taskAssigneeId: string | null) =>
      hasPermission(
        { ...rbacCtx, isAssignee: context.isAssignee || taskAssigneeId === context.userId },
        "task.update.own"
      ) || perms.canManageMembers,
    canDeleteTask: perms.canManageMembers,
    canUpdateTaskStatus: (isTaskAssignee: boolean) =>
      hasPermission(
        { ...rbacCtx, isAssignee: isTaskAssignee || context.isAssignee },
        "task.update.own"
      ) || perms.canManageMembers,
    canViewActivity: perms.canViewWorkspace,
  };
}
