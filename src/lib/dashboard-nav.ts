import {
  Archive,
  Brain,
  LayoutDashboard,
  LayoutGrid,
  MessageSquare,
  Search,
  Shield,
  Users,
  Settings,
  FileText,
  Lightbulb,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

import type { Permission, Role } from "@/types/rbac";
import { Role as RoleEnum } from "@/types/rbac";

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: Permission;
  roles?: Role[];
};

export const dashboardNavItems: DashboardNavItem[] = [
  // Common for all authenticated users
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "community.view" },
  { label: "Problem Board", href: "/dashboard/problems", icon: Search, permission: "problem.view" },
  { label: "Discussion", href: "/dashboard/discussion", icon: MessageSquare, permission: "comment.view" },
  { label: "AI Insights", href: "/dashboard/insights", icon: Brain, permission: "insight.view" },
  { label: "Pitch", href: "/dashboard/pitch", icon: Lightbulb, permission: "pitch.view" },
  { label: "My Projects", href: "/dashboard/workspace", icon: LayoutGrid, permission: "workspace.view" },

  // Expert-specific
  {
    label: "Expert Analysis",
    href: "/dashboard/expert-analysis",
    icon: BarChart3,
    permission: "insight.expert_mode",
    roles: [RoleEnum.Expert, RoleEnum.Mentor, RoleEnum.Leader, RoleEnum.Admin],
  },

  // Mentor-specific
  {
    label: "Mentoring",
    href: "/dashboard/mentoring",
    icon: Users,
    permission: "task.assign",
    roles: [RoleEnum.Mentor, RoleEnum.Leader, RoleEnum.Admin],
  },

  // Leader-specific
  {
    label: "Project Management",
    href: "/dashboard/projects",
    icon: LayoutGrid,
    permission: "project.create",
    roles: [RoleEnum.Leader, RoleEnum.Admin],
  },
  {
    label: "Team Management",
    href: "/dashboard/team",
    icon: Users,
    permission: "member.manage",
    roles: [RoleEnum.Leader, RoleEnum.Admin],
  },

  // Admin-specific
  {
    label: "Admin Panel",
    href: "/dashboard/admin",
    icon: Shield,
    permission: "admin.panel.view",
    roles: [RoleEnum.Admin],
  },
  {
    label: "User Management",
    href: "/dashboard/admin/users",
    icon: Users,
    permission: "user.role.change",
    roles: [RoleEnum.Admin],
  },
  {
    label: "System Settings",
    href: "/dashboard/admin/settings",
    icon: Settings,
    permission: "admin.panel.view",
    roles: [RoleEnum.Admin],
  },

  // Archive (for all)
  { label: "Archive", href: "/dashboard/archive", icon: Archive, permission: "workspace.progress.view" },
];

export const dashboardPageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/problems": "Problem Board",
  "/dashboard/discussion": "Discussion",
  "/dashboard/insights": "AI Insights",
  "/dashboard/pitch": "Project Pitch",
  "/dashboard/workspace": "My Projects",
  "/dashboard/expert-analysis": "Expert Analysis",
  "/dashboard/mentoring": "Mentoring Dashboard",
  "/dashboard/projects": "Project Management",
  "/dashboard/team": "Team Management",
  "/dashboard/admin": "Admin Panel",
  "/dashboard/admin/users": "User Management",
  "/dashboard/admin/settings": "System Settings",
  "/dashboard/archive": "Archive",
};
