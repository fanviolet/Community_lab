import { ArrowUpRight, MessageCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Problem, ProblemPriority } from "@/types/problem";
import { cn } from "@/lib/utils";

const priorityStyles: Record<ProblemPriority, string> = {
  Low: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  Medium: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  High: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400",
};

type ProblemCardProps = {
  problem: Problem;
};

export function ProblemCard({ problem }: ProblemCardProps) {
  return (
    <Card className="group flex h-full flex-col border-0 bg-card shadow-sm ring-1 ring-foreground/10 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:ring-primary/20">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-full">
            {problem.tag}
          </Badge>
          <Badge
            className={cn("rounded-full border-0", priorityStyles[problem.priority])}
          >
            {problem.priority}
          </Badge>
        </div>
        <CardTitle className="text-base leading-snug font-semibold">
          {problem.title}
        </CardTitle>
        <CardDescription className="line-clamp-3 text-sm leading-relaxed">
          {problem.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="mt-auto flex items-center gap-4 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <ArrowUpRight className="size-4 text-primary" />
          <span className="font-medium text-foreground">{problem.votes}</span>
          votes
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MessageCircle className="size-4" />
          <span className="font-medium text-foreground">{problem.comments}</span>
          comments
        </span>
      </CardContent>

      <CardFooter className="pt-0">
        <Button
          variant="outline"
          className="w-full rounded-xl transition-colors group-hover:border-primary/30 group-hover:bg-primary/5"
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
