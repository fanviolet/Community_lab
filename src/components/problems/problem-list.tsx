"use client";

import { ProblemCard } from "@/components/dashboard/ProblemCard";

interface Problem {
  id: string;
  title: string;
  description: string;
  priority: string;
  category: string;
  created_at: string;
  vote_count?: number;
  comment_count?: number;
  ai_summary?: string | null;
}

interface ProblemListProps {
  problems: Problem[];
  viewMode?: "grid" | "list";
}

export function ProblemList({ problems, viewMode = "grid" }: ProblemListProps) {
  if (problems.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
        <h3 className="text-lg font-semibold text-foreground">Chưa có vấn đề nào</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Hãy là người đầu tiên đăng một vấn đề của cộng đồng.
        </p>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="space-y-2">
        {problems.map((problem) => (
          <ProblemCard
            key={problem.id}
            id={problem.id}
            title={problem.title}
            description={problem.description}
            category={problem.category}
            voteCount={problem.vote_count ?? 0}
            commentCount={problem.comment_count ?? 0}
            aiAnalysisStatus={problem.ai_summary ? "analyzed" : "none"}
            createdAt={problem.created_at}
            compact
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {problems.map((problem) => (
        <ProblemCard
          key={problem.id}
          id={problem.id}
          title={problem.title}
          description={problem.description}
          category={problem.category}
          voteCount={problem.vote_count ?? 0}
          commentCount={problem.comment_count ?? 0}
          aiAnalysisStatus={problem.ai_summary ? "analyzed" : "none"}
          createdAt={problem.created_at}
        />
      ))}
    </div>
  );
}
