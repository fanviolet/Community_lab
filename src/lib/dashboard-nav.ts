import {
  Archive,
  Brain,
  FileText,
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
  { label: "Discussion", href: "/discussion", icon: MessageSquare },
  { label: "AI Insights", href: "/insights", icon: Brain },
  { label: "Proposal Builder", href: "/proposals", icon: FileText },
  { label: "Workspace", href: "/workspace", icon: LayoutGrid },
  { label: "Archive", href: "/archive", icon: Archive },
];

export const dashboardPageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/problems": "Problem Board",
  "/discussion": "Discussion",
  "/insights": "AI Insights",
  "/proposals": "Proposal Builder",
  "/workspace": "Workspace",
  "/archive": "Archive",
};
