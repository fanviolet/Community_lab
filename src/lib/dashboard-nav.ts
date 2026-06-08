import {
  Archive,
  Brain,
  LayoutDashboard,
  LayoutGrid,
  MessageSquare,
  Search,
  type LucideIcon,
} from "lucide-react";

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const dashboardNavItems: DashboardNavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Problem Board", href: "/dashboard/problems", icon: Search },
  { label: "Discussion", href: "/dashboard/discussion", icon: MessageSquare },
  { label: "AI Insights", href: "/dashboard/insights", icon: Brain },
  { label: "Workspace", href: "/dashboard/workspace", icon: LayoutGrid },
  { label: "Archive", href: "/dashboard/archive", icon: Archive },
];

export const dashboardPageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/problems": "Problem Board",
  "/dashboard/discussion": "Discussion",
  "/dashboard/insights": "AI Insights",
  "/dashboard/workspace": "Workspace",
  "/dashboard/archive": "Archive",
};
