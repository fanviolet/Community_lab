/**
 * Workspace Workflow Types
 * Shared types for workspace workflow actions
 * This file does NOT use "use server" directive
 */

export interface WorkflowPhase {
  phase_name: string;
  objective: string;
  duration: string;
  tasks: WorkflowTask[];
  risks: WorkflowRisk[];
  dependencies: WorkflowDependency[];
  success_metrics: WorkflowSuccessMetric[];
  progress?: number;
}

export interface WorkflowTask {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  suggested_role: string;
  selected?: boolean;
}

export interface WorkflowRisk {
  risk: string;
  impact: string;
  mitigation: string;
  severity: "low" | "medium" | "high";
}

export interface WorkflowDependency {
  description: string;
  type: "sequential" | "supporting" | "resource" | "external";
}

export interface WorkflowSuccessMetric {
  kpi: string;
  measurementMethod: string;
  targetValue: string;
}

export interface GeneratedWorkflow {
  workflow_title: string;
  executive_summary: string;
  project_summary: string;
  phases: WorkflowPhase[];
  team_structure: Array<{
    role: string;
    responsibilities: string[];
    count: number;
  }>;
  timeline: {
    estimated_start_date: string;
    estimated_end_date: string;
    total_duration: string;
  };
}

export interface WorkflowTaskImport {
  title: string;
  description: string;
  priority: string;
  suggested_role: string;
  phase_name: string;
}

export interface SavedWorkflow {
  id: string;
  project_id: string;
  workflow_json: GeneratedWorkflow;
  generated_by: string;
  created_at: string;
}
