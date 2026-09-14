import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { VoteButton } from "@/components/problems/VoteButton";
import { AIInsightCard } from "@/components/AIInsightCard";
import { CommentForm } from "@/components/comments/comment-form";
import { CommentList } from "@/components/comments/comment-list";
import { getGroupById, getGroupMembershipState } from "@/lib/groups/server";
import { getAuthSession } from "@/lib/auth/server";
import type { ProblemComment } from "@/types/comment";

interface GroupProblemPageProps {
  params: Promise<{
    id: string;
    problemId: string;
  }>;
}

interface ProblemRecord {
  id: string;
  title: string;
  description: string | null;
  ai_summary: string | null;
  group_id: string;
}

export default async function GroupProblemPage({ params }: GroupProblemPageProps) {
  const { id: groupId, problemId } = await params;

  const supabase = await createClient();
  const { user } = await getAuthSession();

  if (!user) {
    redirect("/login");
  }

  const group = await getGroupById(groupId);
  if (!group) {
    notFound();
  }

  const membershipState = await getGroupMembershipState(groupId, user.id);
  const isMember = membershipState === "member";

  if (!isMember) {
    redirect(`/dashboard/groups/${groupId}`);
  }

  const { data: problemData } = await supabase
    .from("problems")
    .select("id,title,description,ai_summary,group_id")
    .eq("id", problemId)
    .eq("group_id", groupId)
    .single();

  if (!problemData) {
    notFound();
  }

  const { count: voteCount } = await supabase
    .from("problem_votes")
    .select("*", { count: "exact", head: true })
    .eq("problem_id", problemId);

  const { data: commentData } = await supabase
    .from("problem_comments")
    .select("*")
    .eq("problem_id", problemId)
    .order("created_at", { ascending: false });

  const problem = problemData as ProblemRecord;
  const comments = (commentData ?? []) as ProblemComment[];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">{problem.title}</h1>
        <p className="text-muted-foreground">{problem.description}</p>
      </div>

      <div className="border rounded-xl p-4">
        <h2 className="font-semibold mb-3">Kiểm tra bình chọn</h2>
        <VoteButton problemId={problem.id} initialVotes={voteCount ?? 0} />
      </div>

      <AIInsightCard problemId={problem.id} initialAiSummary={problem.ai_summary ?? null} />

      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <CommentForm problemId={problem.id} />
        <div className="mt-6">
          <CommentList initialComments={comments ?? []} problemId={problem.id} />
        </div>
      </div>
    </div>
  );
}