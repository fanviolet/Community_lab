export type AIInsightUrgency = "low" | "medium" | "high";

export interface AIInsight {
     rootCause: string;
     impact: string;
     suggestions: string[];
     urgency: AIInsightUrgency;
     tags: string[];
}
