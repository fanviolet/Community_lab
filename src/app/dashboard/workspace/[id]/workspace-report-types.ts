/**
 * Workspace Report Types
 * Shared types for workspace report actions
 * This file does NOT use "use server" directive
 */

export type ReportType = "weekly" | "monthly" | "full";

export interface ReportInput {
  projectId: string;
  reportType: ReportType;
  startDate?: string;
  endDate?: string;
}

export interface ReportMetrics {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  highPriorityTasks: number;
  completionRate: number;
  taskVelocity: number;
  activeMemberRatio: number;
  overdueTaskRatio: number;
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

export interface ProjectHealthScore {
  score: number;
  category: "Healthy" | "Good" | "At Risk" | "Critical";
  explanation: string;
}

export interface GeneratedReport {
  project: {
    id: string;
    title: string;
    description: string | null;
    status: string | null;
    start_date: string | null;
    end_date: string | null;
  };
  reportType: ReportType;
  period: {
    label: string;
    startDate: string;
    endDate: string;
  };
  executiveSummary: string;
  metrics: ReportMetrics;
  achievements: ReportAchievement[];
  challenges: ReportChallenge[];
  recommendations: ReportRecommendation[];
  healthScore: ProjectHealthScore;
  workflow?: {
    phases: Array<{
      name: string;
      progress: number;
      tasks: number;
    }>;
  };
  generatedAt: string;
}

export interface ReportHistoryItem {
  id: string;
  reportType: ReportType;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
}
