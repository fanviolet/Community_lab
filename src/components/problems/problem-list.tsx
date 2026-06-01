"use client";

import Link from "next/link";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface Problem {
  id: string;
  title: string;
  description: string;
  priority: string;
  category: string;
  created_at: string;
  vote_count?: number;
}

interface ProblemListProps {
  problems: Problem[];
}

export function ProblemList({ problems }: ProblemListProps) {
  if (problems.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center">
        <h3 className="text-lg font-semibold">No problems yet</h3>

        <p className="mt-2 text-sm text-muted-foreground">
          Be the first person to post a community problem.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {problems.map((problem) => (
        <Link key={problem.id} href={`/dashboard/problems/${problem.id}`}>
          <Card className="transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-xl font-semibold">{problem.title}</h3>

                <div className="flex items-center gap-2">
                  <span className="rounded-full border px-3 py-1 text-xs font-medium">
                    {problem.category}
                  </span>

                  <span className="rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
                    {problem.priority}
                  </span>
                </div>
              </div>

              <p className="line-clamp-2 text-sm text-muted-foreground">
                {problem.description}
              </p>
            </CardHeader>

            <CardContent className="space-y-2">
              <p className="text-sm font-medium">
                👍 {problem.vote_count ?? 0} votes
              </p>

              <p className="text-xs text-muted-foreground">
                Created: {new Date(problem.created_at).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
