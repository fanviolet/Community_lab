export type ProblemPriority = "Low" | "Medium" | "High";

export type ProblemTag =
  | "Education"
  | "Environment"
  | "Community"
  | "Technology";

export type ProblemFilter = "All" | ProblemTag;

export interface Problem {
  id: string;
  title: string;
  description: string;
  votes: number;
  comments: number;
  tag: ProblemTag;
  priority: ProblemPriority;
}
