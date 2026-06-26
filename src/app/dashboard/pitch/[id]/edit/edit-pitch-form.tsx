"use client";

import { useState, useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Save, X } from "lucide-react";
import { toast } from "sonner";
import { updatePitchWithNotification } from "../../actions";
import { getProblems } from "../../actions";
import type {
  PitchWithRelations,
  PitchContent,
} from "@/types/pitch-management";

interface EditPitchFormProps {
  pitch: PitchWithRelations;
  content: PitchContent | null;
  userId: string;
  isAdmin: boolean;
}

const STEPS = [
  "Thông tin cơ bản",
  "Phân tích vấn đề",
  "Thiết kế giải pháp",
  "Lập kế hoạch tác động",
  "Triển khai",
  "Thông tin nhóm",
];

export function EditPitchForm({
  pitch,
  content,
  userId,
  isAdmin,
}: EditPitchFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [problems, setProblems] = useState<{ id: string; title: string }[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    problem_id: pitch.problem_id || "",
    title: pitch.title,
    description: pitch.description || "",
    project_summary: content?.project_summary || "",
    target_audience: content?.target_audience || "",
    key_objectives: content?.key_objectives || [],

    // Step 2: Problem Analysis
    problem_statement: content?.problem_statement || "",
    root_cause_analysis: content?.root_cause_analysis || "",
    problem_validation: content?.problem_validation || "",

    // Step 3: Solution Design
    solution_description: content?.solution_description || "",
    technical_approach: content?.technical_approach || "",
    innovation_points: content?.innovation_points || [],
    alternatives_considered: content?.alternatives_considered || [],

    // Step 4: Impact Planning
    expected_impact: content?.expected_impact || "",
    success_metrics: content?.success_metrics || [],

    // Step 5: Implementation
    implementation_plan: content?.implementation_plan || "",
    resource_requirements: content?.resource_requirements || [],

    // Step 6: Team Information
    team_description: content?.team_description || "",
    skills_required: content?.skills_required || [],
  });

  useEffect(() => {
    getProblems().then(setProblems);
  }, []);

  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [formData]);

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true);
    } else {
      router.push(`/dashboard/pitch/${pitch.id}`);
    }
  };

  const handleConfirmCancel = () => {
    setShowUnsavedWarning(false);
    router.push(`/dashboard/pitch/${pitch.id}`);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Update pitch with notification
      await updatePitchWithNotification(
        pitch.id,
        {
          problem_id:
            formData.problem_id === "none"
              ? null
              : formData.problem_id || undefined,
          title: formData.title,
          description: formData.description,
        },
        content?.id || null,
        {
          project_summary: formData.project_summary,
          target_audience: formData.target_audience,
          key_objectives: formData.key_objectives,
          problem_statement: formData.problem_statement,
          root_cause_analysis: formData.root_cause_analysis,
          problem_validation: formData.problem_validation,
          solution_description: formData.solution_description,
          technical_approach: formData.technical_approach,
          innovation_points: formData.innovation_points,
          alternatives_considered: formData.alternatives_considered,
          expected_impact: formData.expected_impact,
          success_metrics: formData.success_metrics,
          implementation_plan: formData.implementation_plan,
          resource_requirements: formData.resource_requirements,
          team_description: formData.team_description,
          skills_required: formData.skills_required,
        },
      );

      toast.success("Đề xuất của bạn đã được cập nhật thành công.");
      setHasUnsavedChanges(false);
      router.push(`/dashboard/pitch/${pitch.id}`);
    } catch (error) {
      console.error("Failed to update pitch:", error);
      toast.error("Không thể cập nhật đề xuất. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <>
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              Bước {currentStep + 1} / {STEPS.length}
            </span>
            <span className="text-muted-foreground">{STEPS[currentStep]}</span>
          </div>
          <Progress value={progress} />
        </div>

        <Card className="border-0 bg-muted/30">
          <CardHeader>
            <CardTitle className="text-lg">{STEPS[currentStep]}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentStep === 0 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="problem_id">
                    Vấn đề liên quan (không bắt buộc)
                  </Label>
                  <Select
                    value={formData.problem_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, problem_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn một vấn đề" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không có</SelectItem>
                      {problems.map((problem) => (
                        <SelectItem key={problem.id} value={problem.id}>
                          {problem.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Tiêu đề đề xuất *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Nhập tiêu đề thu hút"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Mô tả</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Mô tả ngắn về đề xuất của bạn"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project_summary">Tóm tắt dự án</Label>
                  <Textarea
                    id="project_summary"
                    value={formData.project_summary}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        project_summary: e.target.value,
                      })
                    }
                    placeholder="Tóm tắt dự án trong 2-3 câu"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_audience">Đối tượng mục tiêu</Label>
                  <Textarea
                    id="target_audience"
                    value={formData.target_audience}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        target_audience: e.target.value,
                      })
                    }
                    placeholder="Ai sẽ hưởng lợi từ dự án này?"
                    rows={2}
                  />
                </div>
              </>
            )}

            {currentStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="problem_statement">Mô tả vấn đề *</Label>
                  <Textarea
                    id="problem_statement"
                    value={formData.problem_statement}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        problem_statement: e.target.value,
                      })
                    }
                    placeholder="Nêu rõ vấn đề bạn đang giải quyết"
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="root_cause_analysis">
                    Phân tích nguyên nhân gốc rễ
                  </Label>
                  <Textarea
                    id="root_cause_analysis"
                    value={formData.root_cause_analysis}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        root_cause_analysis: e.target.value,
                      })
                    }
                    placeholder="Phân tích nguyên nhân gốc rễ của vấn đề"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="problem_validation">Xác thực vấn đề</Label>
                  <Textarea
                    id="problem_validation"
                    value={formData.problem_validation}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        problem_validation: e.target.value,
                      })
                    }
                    placeholder="Bạn đã xác thực vấn đề này như thế nào?"
                    rows={3}
                  />
                </div>
              </>
            )}

            {currentStep === 2 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="solution_description">
                    Mô tả giải pháp *
                  </Label>
                  <Textarea
                    id="solution_description"
                    value={formData.solution_description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        solution_description: e.target.value,
                      })
                    }
                    placeholder="Mô tả chi tiết giải pháp của bạn"
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="technical_approach">
                    Cách tiếp cận kỹ thuật
                  </Label>
                  <Textarea
                    id="technical_approach"
                    value={formData.technical_approach}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        technical_approach: e.target.value,
                      })
                    }
                    placeholder="Bạn sẽ triển khai kỹ thuật như thế nào?"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="innovation_points">
                    Điểm đổi mới (mỗi dòng một ý)
                  </Label>
                  <Textarea
                    id="innovation_points"
                    value={formData.innovation_points.join("\n")}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        innovation_points: e.target.value
                          .split("\n")
                          .filter(Boolean),
                      })
                    }
                    placeholder="Điều gì làm cho giải pháp này mang tính đổi mới?"
                    rows={3}
                  />
                </div>
              </>
            )}

            {currentStep === 3 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="expected_impact">Tác động kỳ vọng *</Label>
                  <Textarea
                    id="expected_impact"
                    value={formData.expected_impact}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expected_impact: e.target.value,
                      })
                    }
                    placeholder="Dự án này sẽ tạo ra tác động gì?"
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="success_metrics">
                    Chỉ số thành công (mỗi dòng một ý)
                  </Label>
                  <Textarea
                    id="success_metrics"
                    value={formData.success_metrics.join("\n")}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        success_metrics: e.target.value
                          .split("\n")
                          .filter(Boolean),
                      })
                    }
                    placeholder="Bạn sẽ đo lường thành công như thế nào?"
                    rows={3}
                  />
                </div>
              </>
            )}

            {currentStep === 4 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="implementation_plan">
                    Kế hoạch triển khai *
                  </Label>
                  <Textarea
                    id="implementation_plan"
                    value={formData.implementation_plan}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        implementation_plan: e.target.value,
                      })
                    }
                    placeholder="Bạn sẽ triển khai dự án này như thế nào?"
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resource_requirements">
                    Nguồn lực cần thiết (mỗi dòng một ý)
                  </Label>
                  <Textarea
                    id="resource_requirements"
                    value={formData.resource_requirements.join("\n")}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        resource_requirements: e.target.value
                          .split("\n")
                          .filter(Boolean),
                      })
                    }
                    placeholder="Bạn cần những nguồn lực nào?"
                    rows={3}
                  />
                </div>
              </>
            )}

            {currentStep === 5 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="team_description">Mô tả nhóm</Label>
                  <Textarea
                    id="team_description"
                    value={formData.team_description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        team_description: e.target.value,
                      })
                    }
                    placeholder="Mô tả cấu trúc nhóm của bạn"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skills_required">
                    Kỹ năng cần có (mỗi dòng một ý)
                  </Label>
                  <Textarea
                    id="skills_required"
                    value={formData.skills_required.join("\n")}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        skills_required: e.target.value
                          .split("\n")
                          .filter(Boolean),
                      })
                    }
                    placeholder="Cần những kỹ năng nào?"
                    rows={3}
                  />
                </div>
              </>
            )}

            <div className="flex justify-between pt-4">
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  <X className="mr-2 h-4 w-4" />
                  Hủy
                </Button>
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Trước
                </Button>
              </div>

              {currentStep === STEPS.length - 1 ? (
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Tiếp theo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {showUnsavedWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Thay đổi chưa lưu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời đi không?
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowUnsavedWarning(false)}
                >
                  Ở lại
                </Button>
                <Button variant="destructive" onClick={handleConfirmCancel}>
                  Rời đi
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
