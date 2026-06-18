"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PermissionGuard } from "@/components/rbac/PermissionGuard";
import { createProblemComment } from "@/app/dashboard/problems/actions";

interface CommentFormProps {
  problemId: string;
}

export function CommentForm({ problemId }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!content.trim()) {
      setError("Nội dung bình luận không được để trống.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createProblemComment({
        problem_id: problemId,
        content: content.trim(),
      });

      setContent("");
    } catch (submitError) {
      setError("Không thể đăng bình luận. Vui lòng thử lại.");
      console.error(submitError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PermissionGuard permission="comment.create">
    <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">Thêm bình luận</label>
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Viết suy nghĩ của bạn..."
          className="min-h-[140px]"
          aria-label="Nội dung bình luận"
        />
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">Bình luận sẽ hiển thị ngay cho người xem khác.</p>
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? "Đang đăng..." : "Đăng bình luận"}
        </Button>
      </div>
    </form>
    </PermissionGuard>
  );
}
