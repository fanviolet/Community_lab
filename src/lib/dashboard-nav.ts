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
  Lightbulb,
  BarChart3,
  User,
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

export type DashboardNavSection = {
  title: string;
  items: DashboardNavItem[];
};

export const dashboardNavSections: DashboardNavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "community.view" },
    ],
  },
  {
    title: "Community",
    items: [
      { label: "Problem Board", href: "/dashboard/problems", icon: Search, permission: "problem.view" },
      { label: "Discussion", href: "/dashboard/discussion", icon: MessageSquare, permission: "comment.view" },
      { label: "AI Insights", href: "/dashboard/insights", icon: Brain, permission: "insight.view" },
    ],
  },
  {
    title: "Projects",
    items: [
      { label: "Proposals", href: "/dashboard/pitch", icon: Lightbulb, permission: "pitch.view" },
      { label: "Project Workspace", href: "/dashboard/workspace", icon: LayoutGrid, roles: [RoleEnum.Member, RoleEnum.Expert, RoleEnum.Mentor, RoleEnum.Leader, RoleEnum.Admin] },
      { label: "KPI Tracking", href: "/dashboard/projects", icon: BarChart3, roles: [RoleEnum.Leader, RoleEnum.Admin] },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        label: "Mentors",
        href: "/dashboard/mentoring",
        icon: Users,
        permission: "task.assign",
        roles: [RoleEnum.Mentor, RoleEnum.Leader, RoleEnum.Admin],
      },
      {
        label: "Expert Analysis",
        href: "/dashboard/expert-analysis",
        icon: BarChart3,
        permission: "insight.expert_mode",
        roles: [RoleEnum.Expert, RoleEnum.Mentor, RoleEnum.Leader, RoleEnum.Admin],
      },
      {
        label: "Team Management",
        href: "/dashboard/team",
        icon: Users,
        permission: "member.manage",
        roles: [RoleEnum.Leader, RoleEnum.Admin],
      },
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
    ],
  },
  {
    title: "Personal",
    items: [
      { label: "Notifications", href: "/dashboard/notifications", icon: Archive, permission: "notifications.view" },
      { label: "Profile", href: "/dashboard/profile", icon: User, permission: "community.view" },
      { label: "Settings", href: "/dashboard/settings", icon: Settings, permission: "settings.view" },
    ],
  },
];

export const dashboardNavItems: DashboardNavItem[] = dashboardNavSections.flatMap(section => section.items);

export const dashboardPageTitles: Record<string, string> = {
  "/dashboard": "Bảng điều khiển",
  "/dashboard/profile": "Hồ sơ",
  "/dashboard/problems": "Bảng vấn đề",
  "/dashboard/discussion": "Thảo luận",
  "/dashboard/insights": "Trí tuệ nhân tạo",
  "/dashboard/pitch": "Đề xuất dự án",
  "/dashboard/workspace": "Dự án của tôi",
  "/dashboard/expert-analysis": "Phân tích chuyên gia",
  "/dashboard/mentoring": "Bảng điều khiển cố vấn",
  "/dashboard/projects": "Quản lý dự án",
  "/dashboard/team": "Quản lý đội nhóm",
  "/dashboard/admin": "Bảng quản trị viên",
  "/dashboard/admin/users": "Quản lý người dùng",
  "/dashboard/admin/settings": "Cài đặt hệ thống",
  "/dashboard/archive": "Lưu trữ",
};
