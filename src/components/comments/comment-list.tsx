"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import type { ProblemComment } from "@/types/comment";

interface CommentListProps {
  initialComments: ProblemComment[];
  problemId: string;
}

export function CommentList({ initialComments, problemId }: CommentListProps) {
  const [comments, setComments] = useState<ProblemComment[]>(initialComments ?? []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`problem-comments-${problemId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "problem_comments",
          filter: `problem_id=eq.${problemId}`,
        },
        (payload) => {
          const newComment = payload.new as ProblemComment;

          setComments((current) => {
            if (current.some((comment) => comment.id === newComment.id)) {
              return current;
            }

            return [newComment, ...current];
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [problemId]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Bình luận ({comments.length})</h2>
          <p className="text-sm text-muted-foreground">
            {comments.length === 0 ? "Chưa có bình luận." : `${comments.length} bình luận`}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-background p-6 text-center text-sm text-muted-foreground">
            Chưa có bình luận. Thêm bình luận đầu tiên để bắt đầu thảo luận.
          </div>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className="border border-border bg-background">
              <CardContent className="space-y-3">
                <p className="text-base leading-7 text-foreground">{comment.content}</p>
                <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                  <span>Đăng vào {new Date(comment.created_at).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </section>
  );
}
