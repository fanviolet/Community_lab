import {
  Archive,
  Brain,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LayoutGrid,
  MessageSquare,
  Search,
  Sparkles,
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
  { label: "AI Insights", href: "/insights", icon: Brain },
  { label: "Workspace", href: "/dashboard/workspace", icon: LayoutGrid },
  { label: "Archive", href: "/dashboard/archive", icon: Archive },
];

export const dashboardPageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/problems": "Problem Board",
  "/discussion": "Discussion",
  "/insights": "AI Insights",
  "/dashboard/workspace": "Workspace",
  "/dashboard/archive": "Archive",
};
