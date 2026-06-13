/**
 * Report Types
 * Shared types for report generator
 * This file does NOT use "use server" directive
 */

export type ReportPeriodType = "weekly" | "monthly" | "custom";

export interface ProjectOption {
  id: string;
  title: string;
  status: string | null;
}

export interface ReportInput {
  projectId: string;
  periodType: ReportPeriodType;
  startDate?: string;
  endDate?: string;
}

export interface ReportMetricsData {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  activeMembers: number;
  projectStatus: string;
  delayedTasks: number;
  activitiesConducted: number;
}

export interface ReportAchievement {
  id: string;
  title: string;
  description: string;
  date: string | null;
}

export interface ReportChallenge {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
}

export interface ReportRecommendation {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
}

export interface GeneratedReport {
  project: {
    id: string;
    title: string;
    description: string | null;
    status: string | null;
  };
  period: {
    label: string;
    startDate: string | null;
    endDate: string | null;
  };
  overview: string;
  metrics: ReportMetricsData;
  achievements: ReportAchievement[];
  challenges: ReportChallenge[];
  communityImpact: string;
  recommendations: ReportRecommendation[];
}
