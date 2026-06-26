export type PitchStatus = "draft" | "submitted" | "under_review" | "revision_required" | "approved" | "rejected" | "converted";
export type AnalysisType = "proposal_draft" | "proposal_improvement" | "kpi_suggestion" | "risk_analysis" | "timeline_generation" | "budget_generation";
export type FeedbackType = "approval" | "revision" | "rejection" | "comment";
export type HistoryAction = "created" | "updated" | "submitted" | "reviewed" | "status_changed";

export interface Pitch {
  id: string;
  problem_id: string | null;
  title: string;
  description: string | null;
  status: PitchStatus;
  ai_score: number | null;
  created_by: string;
  reviewed_by: string | null;
  review_notes: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PitchWithRelations extends Pitch {
  problem?: {
    id: string;
    title: string;
  };
  creator?: {
    id: string;
    display_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  reviewer?: {
    id: string;
    display_name: string | null;
    email: string;
  };
  latest_content?: PitchContent;
}

export interface PitchContent {
  id: string;
  pitch_id: string;
  version: number;
  
  // Step 1: Basic Information
  project_summary: string | null;
  target_audience: string | null;
  key_objectives: string[] | null;
  
  // Step 2: Problem Analysis
  problem_statement: string | null;
  root_cause_analysis: string | null;
  problem_validation: string | null;
  
  // Step 3: Solution Design
  solution_description: string | null;
  technical_approach: string | null;
  innovation_points: string[] | null;
  alternatives_considered: string[] | null;
  
  // Step 4: Impact Planning
  expected_impact: string | null;
  success_metrics: string[] | null;
  kpis: Record<string, unknown>;
  risk_analysis: Record<string, unknown>;
  
  // Step 5: Implementation
  implementation_plan: string | null;
  timeline: Record<string, unknown>;
  budget_estimate: Record<string, unknown>;
  resource_requirements: string[] | null;
  
  // Step 6: Team Information
  team_description: string | null;
  team_members: Record<string, unknown>[];
  skills_required: string[] | null;
  
  created_at: string;
}

export interface PitchAIAnalysis {
  id: string;
  pitch_id: string;
  analysis_type: AnalysisType;
  analysis_result: Record<string, unknown>;
  created_at: string;
}

export interface PitchHistory {
  id: string;
  pitch_id: string;
  user_id: string;
  action: HistoryAction;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
}

export interface PitchHistoryWithUser extends PitchHistory {
  user?: {
    id: string;
    display_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export interface PitchFeedback {
  id: string;
  pitch_id: string;
  reviewer_id: string;
  feedback_type: FeedbackType;
  feedback_text: string;
  section: string | null;
  created_at: string;
}

export interface PitchFeedbackWithReviewer extends PitchFeedback {
  reviewer?: {
    id: string;
    display_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export interface CreatePitchInput {
  problem_id?: string | null;
  title: string;
  description?: string;
}

export interface UpdatePitchInput extends Partial<CreatePitchInput> {
  status?: PitchStatus;
  ai_score?: number;
  reviewed_by?: string;
  review_notes?: string;
  submitted_at?: string;
  reviewed_at?: string;
}

export interface CreatePitchContentInput {
  pitch_id: string;
  version?: number;
  
  // Step 1: Basic Information
  project_summary?: string;
  target_audience?: string;
  key_objectives?: string[];
  
  // Step 2: Problem Analysis
  problem_statement?: string;
  root_cause_analysis?: string;
  problem_validation?: string;
  
  // Step 3: Solution Design
  solution_description?: string;
  technical_approach?: string;
  innovation_points?: string[];
  alternatives_considered?: string[];
  
  // Step 4: Impact Planning
  expected_impact?: string;
  success_metrics?: string[];
  kpis?: Record<string, unknown>;
  risk_analysis?: Record<string, unknown>;
  
  // Step 5: Implementation
  implementation_plan?: string;
  timeline?: Record<string, unknown>;
  budget_estimate?: Record<string, unknown>;
  resource_requirements?: string[];
  
  // Step 6: Team Information
  team_description?: string;
  team_members?: Record<string, unknown>[];
  skills_required?: string[];
}

export interface CreatePitchFeedbackInput {
  pitch_id: string;
  feedback_type: FeedbackType;
  feedback_text: string;
  section?: string;
}

export interface PitchMetrics {
  total_pitches: number;
  drafts: number;
  submitted: number;
  under_review: number;
  approved: number;
  rejected: number;
  revision_required: number;
  average_ai_score: number;
}
