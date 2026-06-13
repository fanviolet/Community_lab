"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/components/rbac/PermissionGuard";

interface VoteButtonProps {
  problemId: string;
  initialVotes: number;
}

export function VoteButton({ problemId, initialVotes }: VoteButtonProps) {
  const [votes, setVotes] = useState(initialVotes);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const handleVote = async () => {
    try {
      setLoading(true);

      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("Please login first");
        return;
      }

      // Kiểm tra đã vote chưa
      const { data: existingVote } = await supabase
        .from("problem_votes")
        .select("id")
        .eq("problem_id", problemId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingVote) {
        alert("You already voted");
        return;
      }

      // Thêm vote
      const { error } = await supabase.from("problem_votes").insert({
        problem_id: problemId,
        user_id: user.id,
      });
      await supabase.rpc("increment_problem_vote", {
        problem_id_input: problemId,
      });

      if (error) {
        console.error(error);
        alert("Vote failed");
        return;
      }

      setVotes((prev) => prev + 1);
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PermissionGuard permission="vote.create">
      <Button onClick={handleVote} disabled={loading}>
        👍 {votes}
      </Button>
    </PermissionGuard>
  );
}
