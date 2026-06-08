"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { ProblemList } from "@/components/problems/problem-list";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";

import { createClient } from "@/lib/supabase/client";

const filters = ["All", "Education", "Environment", "Community", "Technology"];

interface ProblemBoardItem {
  id: string;
  title: string;
  description: string;
  priority: string;
  category: string;
  created_at: string;
  vote_count?: number;
}

export function ProblemBoard() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [problems, setProblems] = useState<ProblemBoardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchProblems() {
      setLoading(true);

      const { data, error } = await supabase
        .from("problems")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error("Error loading problems:", error);
        setLoading(false);
        return;
      }

      const problemsWithVotes = await Promise.all(
        (data || []).map(async (problem) => {
          const { count, error: voteError } = await supabase
            .from("problem_votes")
            .select("*", {
              count: "exact",
              head: true,
            })
            .eq("problem_id", problem.id);

          if (voteError) {
            console.error(
              `Error counting votes for ${problem.title}:`,
              voteError,
            );
          }

          return {
            ...problem,
            vote_count: count ?? 0,
          };
        }),
      );

      console.log("Problems with votes:", problemsWithVotes);

      setProblems(problemsWithVotes);
      setLoading(false);
    }

    fetchProblems();
  }, []);

  const filteredProblems = useMemo(() => {
    if (activeFilter === "All") {
      return problems;
    }

    return problems.filter((problem) => problem.category === activeFilter);
  }, [activeFilter, problems]);

  return (
    <PageContainer>
      <PageHeader
        title="Problem Board"
        description="Community members can post and discuss real local problems."
      >
        <Button
          asChild
          className="h-10 shrink-0 rounded-xl px-4 shadow-sm shadow-primary/15"
        >
          <Link href="/dashboard/problems/new">
            <Plus className="size-4" />
            Post New Problem
          </Link>
        </Button>
      </PageHeader>

      <Tabs
        value={activeFilter}
        onValueChange={(value) => setActiveFilter(value)}
      >
        <TabsList
          variant="line"
          className="h-auto w-full flex-wrap justify-start gap-1 rounded-none border-b border-border bg-transparent p-0"
        >
          {filters.map((filter) => (
            <TabsTrigger
              key={filter}
              value={filter}
              className="rounded-none px-3 py-2 after:bottom-0"
            >
              {filter}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading problems...</p>
      ) : (
        <ProblemList problems={filteredProblems} />
      )}
    </PageContainer>
  );
}
