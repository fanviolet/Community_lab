export enum Role {
  Guest = "guest",
  Member = "member",
  Builder = "builder",
  Expert = "expert",
  Mentor = "mentor",
  Leader = "leader",
  Admin = "admin",
}

export const ALL_ROLES = Object.values(Role) as Role[];

export const ADMIN_ASSIGNABLE_ROLES: Role[] = [
  Role.Builder,
  Role.Expert,
  Role.Mentor,
  Role.Leader,
];

export const SELF_ASSIGNABLE_ROLES: Role[] = [Role.Member];

export type Permission =
  // Problem Board
  | "problem.view"
  | "problem.create"
  | "problem.edit.own"
  | "problem.edit.any"
  | "problem.delete.own"
  | "problem.delete.any"
  | "problem.categories.manage"
  | "problem.search"
  // Comments & Votes
  | "comment.view"
  | "comment.create"
  | "vote.create"
  | "comment.delete.others"
  | "discussion.ai_summary"
  // AI Insights
  | "insight.view"
  | "insight.generate"
  | "insight.regenerate"
  | "insight.expert_mode"
  // Project Pitch
  | "pitch.view"
  | "pitch.create"
  | "pitch.edit.own"
  | "pitch.approve"
  | "pitch.reject"
  | "pitch.feedback"
  // Project Workspace
  | "workspace.view"
  | "task.create"
  | "task.assign"
  | "task.update.own"
  | "workspace.progress.view"
  | "project.create"
  | "project.delete"
  | "project.edit"
  | "project.archive"
  | "member.manage"
  | "workflow.generate"
  | "report.generate"
  // Expert Analysis
  | "analysis.view"
  | "analysis.create"
  | "analysis.edit.own"
  | "analysis.edit.any"
  | "analysis.delete.own"
  | "analysis.delete.any"
  | "analysis.publish"
  | "analysis.scorecard.create"
  | "analysis.scorecard.edit.own"
  | "analysis.scorecard.edit.any"
  // Mentoring
  | "mentor.view"
  | "mentor.profile.create"
  | "mentor.profile.edit.own"
  | "mentorship.request.create"
  | "mentorship.request.view.own"
  | "mentorship.request.view.any"
  | "mentorship.request.manage"
  | "mentoring.session.create"
  | "mentoring.session.view.own"
  | "mentoring.session.edit.own"
  | "mentoring.progress.create"
  | "mentoring.progress.view.own"
  | "mentoring.progress.edit.own"
  | "mentoring.feedback.create"
  | "mentoring.communication.create"
  // Project Management
  | "task.view"
  | "task.create"
  | "task.edit.own"
  | "task.edit.any"
  | "task.delete.own"
  | "task.delete.any"
  | "task.assign"
  | "task.status.change"
  | "milestone.view"
  | "milestone.create"
  | "milestone.edit.own"
  | "milestone.edit.any"
  | "milestone.delete.own"
  | "milestone.delete.any"
  | "project.activity.view"
  | "project.metrics.view"
  // Pitch Management
  | "pitch.view"
  | "pitch.create"
  | "pitch.edit.own"
  | "pitch.edit.any"
  | "pitch.delete.own"
  | "pitch.delete.any"
  | "pitch.submit"
  | "pitch.start_review"
  | "pitch.convert"
  | "pitch.approve"
  | "pitch.reject"
  | "pitch.ai.analyze"
  | "pitch.feedback"
  // Team Management
  | "team.view"
  | "team.invite"
  | "team.remove"
  | "team.role.change"
  | "team.skills.view"
  | "team.skills.manage"
  | "team.availability.view"
  | "team.availability.manage"
  | "team.analytics.view"
  // Pitch Review
  | "pitch.review.view"
  | "pitch.review.create"
  | "pitch.review.edit.own"
  | "pitch.review.edit.any"
  | "pitch.review.submit"
  | "pitch.review.decide"
  | "pitch.review.history.view"
  // System Settings
  | "settings.view"
  | "settings.edit"
  | "settings.ai.manage"
  | "settings.workflow.manage"
  | "settings.notification.manage"
  | "settings.security.manage"
  | "audit.logs.view"
  // User Management
  | "users.view"
  | "users.edit"
  | "users.role.change"
  | "users.status.change"
  | "users.delete"
  // Community
  | "community.view"
  | "profile.edit.own"
  | "notifications.view"
  | "user.role.change"
  | "admin.panel.view"
  | "user.delete";

export interface RBACContext {
  role: Role;
  userId?: string;
  isAuthenticated: boolean;
  isProjectMember?: boolean;
  isProjectLeader?: boolean;
  isAssignee?: boolean;
  isOwner?: boolean;
  pitchStatus?: "pending" | "approved" | "rejected" | "draft" | "submitted";
}
