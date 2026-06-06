/**
 * Role-based permission utilities for project access control
 * 
 * Roles:
 * - leader: Full project management access
 * - member: Can view and work on tasks
 * - non-member: No access
 */

export type ProjectRole = 'leader' | 'member' | null;

export interface PermissionContext {
     isLeader: boolean;
     isMember: boolean;
     isAssignee?: boolean; // For task-specific permissions
     userId?: string; // For task assignment checks
}

/**
 * Check if user can view the project
 * - Leaders: Yes
 * - Members: Yes
 * - Non-members: No
 */
export function canViewProject(isMember: boolean): boolean {
     return isMember;
}

/**
 * Check if user can edit project settings
 * - Leaders: Yes
 * - Members: No
 */
export function canEditProject(isLeader: boolean): boolean {
     return isLeader;
}

/**
 * Check if user can archive/delete the project
 * - Leaders: Yes
 * - Members: No
 */
export function canArchiveProject(isLeader: boolean): boolean {
     return isLeader;
}

/**
 * Check if user can manage project members (add, remove, change roles)
 * - Leaders: Yes
 * - Members: No
 */
export function canManageMembers(isLeader: boolean): boolean {
     return isLeader;
}

/**
 * Check if user can create tasks
 * - Leaders: Yes
 * - Members: Yes
 * - Non-members: No
 */
export function canCreateTask(isMember: boolean): boolean {
     return isMember;
}

/**
 * Check if user can edit a task
 * - Leaders: Yes (any task)
 * - Members: Yes (only their own assigned tasks)
 * - Non-members: No
 */
export function canEditTask(isLeader: boolean, isAssignee: boolean): boolean {
     return isLeader || isAssignee;
}

/**
 * Check if user can delete a task
 * - Leaders: Yes
 * - Members: No
 */
export function canDeleteTask(isLeader: boolean): boolean {
     return isLeader;
}

/**
 * Check if user can update task status (toggle complete)
 * - Leaders: Yes (any task)
 * - Members: Yes (only their own assigned tasks)
 * - Non-members: No
 */
export function canUpdateTaskStatus(isLeader: boolean, isAssignee: boolean): boolean {
     return isLeader || isAssignee;
}

/**
 * Check if user can view project members
 * - Leaders: Yes
 * - Members: Yes
 * - Non-members: No
 */
export function canViewMembers(isMember: boolean): boolean {
     return isMember;
}

/**
 * Check if user can view project tasks
 * - Leaders: Yes
 * - Members: Yes
 * - Non-members: No
 */
export function canViewTasks(isMember: boolean): boolean {
     return isMember;
}

/**
 * Check if user can view project activity feed
 * - Leaders: Yes
 * - Members: Yes
 * - Non-members: No
 */
export function canViewActivity(isMember: boolean): boolean {
     return isMember;
}

/**
 * Get all permissions for a user in a project
 */
export function getProjectPermissions(context: PermissionContext) {
     const { isLeader, isMember, isAssignee = false } = context;

     return {
          // Project permissions
          canViewProject: canViewProject(isMember),
          canEditProject: canEditProject(isLeader),
          canArchiveProject: canArchiveProject(isLeader),

          // Member management permissions
          canManageMembers: canManageMembers(isLeader),
          canViewMembers: canViewMembers(isMember),

          // Task permissions
          canViewTasks: canViewTasks(isMember),
          canCreateTask: canCreateTask(isMember),
          canEditTask: (taskId: string, taskAssigneeId: string | null) =>
               canEditTask(isLeader, isAssignee || taskAssigneeId === context.userId),
          canDeleteTask: canDeleteTask(isLeader),
          canUpdateTaskStatus: (isTaskAssignee: boolean) =>
               canUpdateTaskStatus(isLeader, isTaskAssignee || isAssignee),

          // Activity permissions
          canViewActivity: canViewActivity(isMember),
     };
}

/**
 * Create permission context from membership data
 */
export function createPermissionContext(
     userRole: ProjectRole,
     isTaskAssignee: boolean = false
): PermissionContext {
     return {
          isLeader: userRole === 'leader',
          isMember: userRole === 'leader' || userRole === 'member',
          isAssignee: isTaskAssignee,
     };
}