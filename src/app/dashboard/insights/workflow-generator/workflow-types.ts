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

/**
 * AI-generated task structure with full details
 * Note: Field names match the AI API response format (snake_case)
 */
export interface AIGeneratedTask {
  title: string;
  description: string;
  priority: "Low" | "Medium" | "High" | "Important";
  estimated_days: number;
  assignee_type: "Team Leader" | "Team Member" | "Mentor";
  depends_on: string[];
  /** @deprecated Use depends_on instead */
  dependencies?: string[];
}

/**
 * AI-generated milestone structure
 */
export interface AIGeneratedMilestone {
  name: string;
  description: string;
  target_date?: string;
  tasks: string[];
}

/**
 * AI-generated workflow output structure
 * Includes comprehensive workflow analysis
 */
export interface AIWorkflowOutput {
  project_understanding: string;
  key_deliverables: string[];
  milestones: AIGeneratedMilestone[];
  tasks: AIGeneratedTask[];
  workflow_risks?: Array<{
    risk: string;
    impact: string;
    mitigation: string;
    severity: "low" | "medium" | "high";
  }>;
  success_metrics?: Array<{
    kpi: string;
    measurement_method: string;
    target_value: string;
  }>;
}

/**
 * Legacy task structure for backward compatibility
 */
export interface LegacyTask {
  title: string;
  description: string;
  phase: string;
  duration: string;
  priority: string;
}

/**
 * Legacy phase structure for backward compatibility
 */
export interface LegacyPhase {
  name: string;
  objective: string;
  deliverables: string[];
  suggestedTasks: string[];
  estimatedDuration: string;
  responsibleRoles: string[];
  order: number;
}

/**
 * Legacy workflow output structure for backward compatibility
 */
export interface LegacyWorkflowOutput {
  workflowTitle: string;
  projectSummary: string;
  executiveSummary: string;
  phases: LegacyPhase[];
  tasks: LegacyTask[];
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

/**
 * Unified workflow output that supports both AI-generated and legacy formats
 */
export interface WorkflowOutput {
  workflowTitle: string;
  projectSummary: string;
  executiveSummary: string;
  phases: LegacyPhase[];
  tasks: LegacyTask[];
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
  // AI-generated content (new format)
  aiGenerated?: AIWorkflowOutput;
}

export interface SavedWorkflow {
  id: string;
  projectId: string | null;
  status: string | null;
  createdAt: string | null;
  input: WorkflowInput;
  output: WorkflowOutput;
}