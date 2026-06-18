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

export const dashboardNavItems: DashboardNavItem[] = [
  // Common for all authenticated users
  { label: "Bảng điều khiển", href: "/dashboard", icon: LayoutDashboard, permission: "community.view" },
  { label: "Hồ sơ", href: "/dashboard/profile", icon: User, permission: "community.view" },
  { label: "Bảng vấn đề", href: "/dashboard/problems", icon: Search, permission: "problem.view" },
  { label: "Thảo luận", href: "/dashboard/discussion", icon: MessageSquare, permission: "comment.view" },
  { label: "Trí tuệ nhân tạo", href: "/dashboard/insights", icon: Brain, permission: "insight.view" },
  { label: "Đề xuất", href: "/dashboard/pitch", icon: Lightbulb, permission: "pitch.view" },
  { label: "Dự án của tôi", href: "/dashboard/workspace", icon: LayoutGrid, roles: [RoleEnum.Member, RoleEnum.Expert, RoleEnum.Mentor, RoleEnum.Leader, RoleEnum.Admin] },

  // Expert-specific
  {
    label: "Phân tích chuyên gia",
    href: "/dashboard/expert-analysis",
    icon: BarChart3,
    permission: "insight.expert_mode",
    roles: [RoleEnum.Expert, RoleEnum.Mentor, RoleEnum.Leader, RoleEnum.Admin],
  },

  // Mentor-specific
  {
    label: "Cố vấn",
    href: "/dashboard/mentoring",
    icon: Users,
    permission: "task.assign",
    roles: [RoleEnum.Mentor, RoleEnum.Leader, RoleEnum.Admin],
  },

  // Leader-specific
  {
    label: "Quản lý dự án",
    href: "/dashboard/projects",
    icon: LayoutGrid,
    permission: "project.create",
    roles: [RoleEnum.Leader, RoleEnum.Admin],
  },
  {
    label: "Quản lý đội nhóm",
    href: "/dashboard/team",
    icon: Users,
    permission: "member.manage",
    roles: [RoleEnum.Leader, RoleEnum.Admin],
  },

  // Admin-specific
  {
    label: "Bảng quản trị viên",
    href: "/dashboard/admin",
    icon: Shield,
    permission: "admin.panel.view",
    roles: [RoleEnum.Admin],
  },
  {
    label: "Quản lý người dùng",
    href: "/dashboard/admin/users",
    icon: Users,
    permission: "user.role.change",
    roles: [RoleEnum.Admin],
  },
  {
    label: "Cài đặt hệ thống",
    href: "/dashboard/admin/settings",
    icon: Settings,
    permission: "admin.panel.view",
    roles: [RoleEnum.Admin],
  },

  // Archive (for all)
  { label: "Lưu trữ", href: "/dashboard/archive", icon: Archive, permission: "workspace.progress.view" },
];

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
