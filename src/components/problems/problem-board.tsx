"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus, LayoutGrid, List, ArrowUpDown } from "lucide-react";

import { ProblemList } from "@/components/problems/problem-list";
import { PermissionGuard } from "@/components/rbac/PermissionGuard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";

import { createClient } from "@/lib/supabase/client";

const filters = [
  "Tất cả",
  "Giáo dục",
  "Môi trường",
  "Sức khỏe tinh thần",
  "Cộng đồng",
  "Công nghệ",
];

const sortOptions = [
  { value: "newest", label: "Mới nhất" },
  { value: "most_votes", label: "Nhiều bình chọn nhất" },
  { value: "most_discussed", label: "Thảo luận nhiều nhất" },
  { value: "ai_recommended", label: "AI đề xuất" },
];

interface ProblemBoardItem {
  id: string;
  title: string;
  description: string;
  priority: string;
  category: string;
  created_at: string;
  vote_count?: number;
  comment_count?: number;
  ai_score?: number;
}

export function ProblemBoard() {
  const [activeFilter, setActiveFilter] = useState("Tất cả");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
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

      const problemsWithCounts = await Promise.all(
        (data || []).map(async (problem: any) => {
          const [{ count: voteCount }, { count: commentCount }] =
            await Promise.all([
              supabase
                .from("problem_votes")
                .select("*", {
                  count: "exact",
                  head: true,
                })
                .eq("problem_id", problem.id),
              supabase
                .from("problem_comments")
                .select("*", {
                  count: "exact",
                  head: true,
                })
                .eq("problem_id", problem.id),
            ]);

          return {
            ...problem,
            vote_count: voteCount ?? 0,
            comment_count: commentCount ?? 0,
          };
        }),
      );

      setProblems(problemsWithCounts);
      setLoading(false);
    }

    fetchProblems();
  }, []);

  const filteredAndSortedProblems = useMemo(() => {
    let filtered = problems;

    if (activeFilter !== "Tất cả") {
      filtered = filtered.filter(
        (problem) => problem.category === activeFilter,
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "most_votes":
          return (b.vote_count || 0) - (a.vote_count || 0);
        case "most_discussed":
          return (b.comment_count || 0) - (a.comment_count || 0);
        case "ai_recommended":
          return (b.ai_score || 0) - (a.ai_score || 0);
        case "newest":
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
    });

    return sorted;
  }, [activeFilter, sortBy, problems]);

  return (
    <PageContainer>
      <PageHeader
        title="Bảng vấn đề"
        description="Thành viên cộng đồng có thể đăng và thảo luận về các vấn đề địa phương."
      >
        <PermissionGuard permission="problem.create">
          <Button
            asChild
            className="h-10 shrink-0 rounded-xl px-4 shadow-sm shadow-primary/15"
          >
            <Link href="/dashboard/problems/new">
              <Plus className="size-4" />
              Vấn đề mới
            </Link>
          </Button>
        </PermissionGuard>
      </PageHeader>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={activeFilter}
          onValueChange={(value) => setActiveFilter(value)}
          className="flex-1"
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

        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]">
              <ArrowUpDown className="mr-2 size-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex rounded-lg border border-border">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className="rounded-l-lg rounded-r-none"
            >
              <LayoutGrid className="size-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="rounded-r-lg rounded-l-none"
            >
              <List className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-48 rounded-2xl border border-border/50 bg-muted/30 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <ProblemList problems={filteredAndSortedProblems} viewMode={viewMode} />
      )}
    </PageContainer>
  );
}
