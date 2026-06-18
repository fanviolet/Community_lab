"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createProject } from "@/app/dashboard/workspace/actions";

interface ProjectFormProps {
  onSuccess?: () => void;
}

export default function ProjectForm({ onSuccess }: ProjectFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await createProject(formData);
      if (!result.success) {
        setError(result.error ?? "Không thể tạo dự án");
      } else if (onSuccess) {
        onSuccess();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <div className="space-y-2">
        <label className="text-sm font-medium">Tiêu đề dự án</label>
        <Input name="title" placeholder="Nhập tiêu đề dự án..." required />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Mô tả</label>
        <Textarea name="description" placeholder="Mô tả dự án..." rows={4} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Ngày bắt đầu</label>
          <Input name="startDate" type="date" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Ngày kết thúc</label>
          <Input name="endDate" type="date" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Đang tạo..." : "Tạo dự án"}
        </Button>
      </div>
    </form>
  );
}
