/**
 * Workflow Types
 * Shared types for workflow generator
 * This file does NOT use "use server" directive
 */

export interface WorkflowInput {
  problemTitle: string;
  problemDescription: string;
  communityImpact: string;
  expectedGoal: string;
  estimatedTeamSize: number;
  projectId?: string;
}

export interface WorkflowOutput {
  workflowTitle: string;
  projectSummary: string;
  executiveSummary: string;
  phases: Array<{
    name: string;
    objective: string;
    deliverables: string[];
    suggestedTasks: string[];
    estimatedDuration: string;
    responsibleRoles: string[];
    order: number;
  }>;
  tasks: Array<{
    title: string;
    description: string;
    phase: string;
    duration: string;
    priority: string;
  }>;
  teamStructure: Array<{
    role: string;
    responsibilities: string[];
    count: number;
  }>;
  risks: Array<{
    risk: string;
    impact: string;
    mitigation: string;
    severity: string;
  }>;
  dependencies: Array<{
    description: string;
    type: string;
  }>;
  successMetrics: Array<{
    kpi: string;
    measurementMethod: string;
    targetValue: string;
  }>;
}

export interface SavedWorkflow {
  id: string;
  projectId: string | null;
  status: string | null;
  createdAt: string | null;
  input: WorkflowInput;
  output: WorkflowOutput;
}
