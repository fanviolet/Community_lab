export type AnalysisType = "problem" | "project" | "proposal" | "trend";
export type AnalysisStatus = "draft" | "submitted" | "reviewed" | "published" | "archived";

export interface ExpertAnalysis {
  id: string;
  title: string;
  problem_id: string | null;
  project_id: string | null;
  analysis_type: AnalysisType;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  recommendations: string[];
  impact_assessment: string | null;
  feasibility_assessment: string | null;
  sustainability_assessment: string | null;
  ai_generated: boolean;
  ai_prompt: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  status: AnalysisStatus;
}

export interface ExpertScorecard {
  id: string;
  analysis_id: string;
  impact_score: number;
  innovation_score: number;
  feasibility_score: number;
  sustainability_score: number;
  overall_score: number;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ExpertAnalysisWithRelations extends ExpertAnalysis {
  problem?: {
    id: string;
    title: string;
  };
  project?: {
    id: string;
    title: string;
  };
  author?: {
    id: string;
    full_name: string | null;
    email: string;
  };
  scorecard?: ExpertScorecard;
}

export interface CreateAnalysisInput {
  title: string;
  problem_id?: string;
  project_id?: string;
  analysis_type: AnalysisType;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  recommendations: string[];
  impact_assessment?: string;
  feasibility_assessment?: string;
  sustainability_assessment?: string;
  ai_prompt?: string;
}

export interface UpdateAnalysisInput extends Partial<CreateAnalysisInput> {
  status?: AnalysisStatus;
}

export interface CreateScorecardInput {
  analysis_id: string;
  impact_score: number;
  innovation_score: number;
  feasibility_score: number;
  sustainability_score: number;
  notes?: string | null;
}

export interface UpdateScorecardInput extends Partial<CreateScorecardInput> {}
