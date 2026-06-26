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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { createPitch, createPitchContent } from "../actions";
import { AIAssistant } from "./ai-assistant";

interface CreatePitchFormProps {
  userId: string;
  problems: { id: string; title: string }[];
}

const STEPS = [
  "Thông tin cơ bản",
  "Phân tích vấn đề",
  "Thiết kế giải pháp",
  "Lập kế hoạch tác động",
  "Triển khai",
  "Thông tin nhóm",
];

export function CreatePitchForm({ userId, problems }: CreatePitchFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pitchId, setPitchId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    problem_id: "",
    title: "",
    description: "",
    project_summary: "",
    target_audience: "",
    key_objectives: [] as string[],

    // Step 2: Problem Analysis
    problem_statement: "",
    root_cause_analysis: "",
    problem_validation: "",

    // Step 3: Solution Design
    solution_description: "",
    technical_approach: "",
    innovation_points: [] as string[],
    alternatives_considered: [] as string[],

    // Step 4: Impact Planning
    expected_impact: "",
    success_metrics: [] as string[],

    // Step 5: Implementation
    implementation_plan: "",
    resource_requirements: [] as string[],

    // Step 6: Team Information
    team_description: "",
    skills_required: [] as string[],
  });

  const handleNext = async () => {
    if (currentStep === 0 && !pitchId) {
      // Create pitch on first step
      setIsSubmitting(true);
      try {
        const pitch = await createPitch({
          problem_id:
            formData.problem_id === "none"
              ? null
              : formData.problem_id || undefined,
          title: formData.title,
          description: formData.description,
        });
        setPitchId(pitch.id);
        setCurrentStep(currentStep + 1);
      } catch (error) {
        console.error("Failed to create pitch:", error);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!pitchId) return;

    setIsSubmitting(true);
    try {
      await createPitchContent({
        pitch_id: pitchId,
        version: 1,
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
      });
      router.push(`/dashboard/pitch/${pitchId}`);
    } catch (error) {
      console.error("Failed to save pitch content:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAIAssist = async (type: string) => {
    if (!pitchId) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/pitch-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pitchId,
          type,
          formData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate AI assistance");
      }

      const result = await response.json();

      // Apply AI suggestions to form data based on type
      if (result.result && result.result.json) {
        const json = result.result.json;

        switch (type) {
          case "draft":
            if (json.problem_statement)
              setFormData((prev) => ({
                ...prev,
                problem_statement: json.problem_statement,
              }));
            if (json.solution)
              setFormData((prev) => ({
                ...prev,
                solution_description: json.solution,
              }));
            if (json.impact)
              setFormData((prev) => ({
                ...prev,
                expected_impact: json.impact,
              }));
            if (json.implementation)
              setFormData((prev) => ({
                ...prev,
                implementation_plan: json.implementation,
              }));
            break;
          case "improve":
            if (json.improved_summary)
              setFormData((prev) => ({
                ...prev,
                project_summary: json.improved_summary,
              }));
            break;
          case "kpis":
            if (json.kpis && Array.isArray(json.kpis)) {
              const kpiNames = json.kpis.map((k: any) => k.name);
              setFormData((prev) => ({
                ...prev,
                success_metrics: [...(prev.success_metrics || []), ...kpiNames],
              }));
            }
            break;
          case "risks":
            // Store risks in a separate field or show in modal
            console.log("Risks analysis:", json.risks);
            break;
          case "timeline":
            // Store timeline in a separate field or show in modal
            console.log("Timeline phases:", json.phases);
            break;
          case "budget":
            // Store budget in a separate field or show in modal
            console.log("Budget categories:", json.categories);
            break;
        }
      }

      // Show success message
      alert("Đã tạo hỗ trợ AI thành công!");
    } catch (error) {
      console.error("AI assist error:", error);
      alert(error instanceof Error ? error.message : "Không thể tạo hỗ trợ AI");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
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

      <AIAssistant
        pitchId={pitchId}
        currentStep={currentStep}
        formData={formData}
        onAIAssist={handleAIAssist}
      />

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
                <Label htmlFor="solution_description">Mô tả giải pháp *</Label>
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
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Trước
            </Button>

            {currentStep === STEPS.length - 1 ? (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Đang gửi..." : "Gửi đề xuất"}
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={isSubmitting}>
                {isSubmitting ? "Đang tạo..." : "Tiếp theo"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
