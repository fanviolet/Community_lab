"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PermissionGuard } from "@/components/rbac/PermissionGuard";

interface CommentFormProps {
  problemId: string;
}

export function CommentForm({ problemId }: CommentFormProps) {
  const supabase = createClient();

  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!content.trim()) {
      setError("Comment content cannot be empty.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError("You must be logged in to post a comment.");
        return;
      }

      const { error } = await supabase
        .from("problem_comments")
        .insert([
          {
            problem_id: problemId,
            user_id: user.id,
            content: content.trim(),
          },
        ]);

      if (error) {
        setError(error.message);
        return;
      }

      setContent("");
    } catch (submitError) {
      setError("Unable to post comment. Please try again.");
      console.error(submitError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PermissionGuard permission="comment.create">
    <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">Add a comment</label>
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Write your thoughts..."
          className="min-h-[140px]"
          aria-label="Comment content"
        />
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">Comments appear instantly for other viewers.</p>
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? "Posting..." : "Post Comment"}
        </Button>
      </div>
    </form>
    </PermissionGuard>
  );
}
