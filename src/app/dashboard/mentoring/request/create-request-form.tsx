"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createMentorshipRequest } from "../actions";

interface CreateMentorshipRequestFormProps {
  projects: Array<{ id: string; title: string }>;
  mentors: Array<{ id: string; full_name: string | null; email: string }>;
  defaultMentorId?: string;
}

export function CreateMentorshipRequestForm({
  projects,
  mentors,
  defaultMentorId,
}: CreateMentorshipRequestFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    project_id: "",
    mentor_id: defaultMentorId || "",
    challenge_description: "",
    expected_outcome: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createMentorshipRequest(formData);
      router.push("/dashboard/mentoring/my-mentorships");
    } catch (error) {
      console.error("Failed to create mentorship request:", error);
      alert("Không thể tạo yêu cầu quan hệ cố vấn. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="project_id">Dự án *</Label>
          <Select
            value={formData.project_id}
            onValueChange={(value) => setFormData({ ...formData, project_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn một dự án" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mentor_id">Cố vấn *</Label>
          <Select
            value={formData.mentor_id}
            onValueChange={(value) => setFormData({ ...formData, mentor_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn một cố vấn" />
            </SelectTrigger>
            <SelectContent>
              {mentors.map((mentor) => (
                <SelectItem key={mentor.id} value={mentor.id}>
                  {mentor.full_name || mentor.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="challenge_description">Mô tả Khó khăn *</Label>
        <Textarea
          id="challenge_description"
          value={formData.challenge_description}
          onChange={(e) => setFormData({ ...formData, challenge_description: e.target.value })}
          required
          rows={4}
          placeholder="Mô tả các khó khăn dự án của bạn đang gặp phải và nơi bạn cần hướng dẫn"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="expected_outcome">Kết quả mong đợi</Label>
        <Textarea
          id="expected_outcome"
          value={formData.expected_outcome}
          onChange={(e) => setFormData({ ...formData, expected_outcome: e.target.value })}
          rows={3}
          placeholder="Bạn hy vọng đạt được điều gì thông qua quan hệ cố vấn này?"
        />
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Hủy bỏ
        </Button>
      </div>
    </form>
  );
}
