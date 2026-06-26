"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Save, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import DomainSelect from "./DomainSelect";
import ProjectTypeSelect from "./ProjectTypeSelect";
import DeliverablesSection from "./DeliverablesSection";
import TargetAudienceSection from "./TargetAudienceSection";
import SuccessMetricsSection from "./SuccessMetricsSection";
import ProjectGoalInput from "./ProjectGoalInput";
import {
  EXPERIENCE_LEVEL_OPTIONS,
  EXPERIENCE_LEVEL_LABELS,
  BUDGET_RANGE_OPTIONS,
  BUDGET_RANGE_LABELS,
  getDomainLabel,
  getProjectTypeLabel,
  getDeliverableLabel,
  getTargetAudienceLabel,
  type ProjectDomain,
  type ProjectType,
  type ExperienceLevel,
  type BudgetRange,
  type Deliverable,
  type TargetAudience,
  type SuccessMetricInput,
} from "@/types/planning-types";

interface StructuredPlanningFormProps {
  projectId: string;
  initialData?: {
    domain: ProjectDomain | null;
    project_type: ProjectType | null;
    team_size: number | null;
    experience_level: ExperienceLevel | null;
    budget_range: BudgetRange | null;
    duration_days: number | null;
    main_goal: string | null;
    deliverables: Deliverable[];
    target_audience: TargetAudience[];
    success_metrics: SuccessMetricInput[];
  };
  isLeader: boolean;
  onSave: (data: PlanningFormData) => Promise<{ success: boolean; error?: string }>;
}

export interface PlanningFormData {
  domain: ProjectDomain | null;
  project_type: ProjectType | null;
  team_size: number | null;
  experience_level: ExperienceLevel | null;
  budget_range: BudgetRange | null;
  duration_days: number | null;
  main_goal: string | null;
  deliverables: Deliverable[];
  target_audience: TargetAudience[];
  success_metrics: SuccessMetricInput[];
}

export function isWorkflowReady(data: PlanningFormData): boolean {
  const deliverables = Array.isArray(data.deliverables) ? data.deliverables : [];
  return (
    data.domain !== null &&
    data.main_goal !== null &&
    data.main_goal.length >= 100 &&
    data.main_goal.length <= 300 &&
    data.duration_days !== null &&
    data.duration_days > 0 &&
    deliverables.length > 0
  );
}

export default function StructuredPlanningForm({
  projectId,
  initialData,
  isLeader,
  onSave,
}: StructuredPlanningFormProps) {
  const [isPending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const [domain, setDomain] = useState<ProjectDomain | null>(initialData?.domain ?? null);
  const [projectType, setProjectType] = useState<ProjectType | null>(initialData?.project_type ?? null);
  const [teamSize, setTeamSize] = useState<number | null>(initialData?.team_size ?? null);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(initialData?.experience_level ?? null);
  const [budgetRange, setBudgetRange] = useState<BudgetRange | null>(initialData?.budget_range ?? null);
  const [durationDays, setDurationDays] = useState<number | null>(initialData?.duration_days ?? null);
  const [mainGoal, setMainGoal] = useState<string>(initialData?.main_goal ?? "");
  const [deliverables, setDeliverables] = useState<Deliverable[]>(initialData?.deliverables ?? []);
  const [targetAudience, setTargetAudience] = useState<TargetAudience[]>(initialData?.target_audience ?? []);
  const [successMetrics, setSuccessMetrics] = useState<SuccessMetricInput[]>(initialData?.success_metrics ?? []);

  const formData: PlanningFormData = {
    domain,
    project_type: projectType,
    team_size: teamSize,
    experience_level: experienceLevel,
    budget_range: budgetRange,
    duration_days: durationDays,
    main_goal: mainGoal || null,
    deliverables,
    target_audience: targetAudience,
    success_metrics: successMetrics,
  };

  const workflowReady = isWorkflowReady(formData);

  const handleSave = () => {
    setError(null);
    setSaveStatus("saving");
    startTransition(async () => {
      try {
        const result = await onSave(formData);
        if (result.success) {
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 3000);
        } else {
          setSaveStatus("error");
          setError(result.error ?? "Lưu thất bại");
        }
      } catch (err) {
        setSaveStatus("error");
        setError(err instanceof Error ? err.message : "Lưu thất bại");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Domain & Project Type */}
      <div className="grid gap-4 sm:grid-cols-2">
        <DomainSelect value={domain} onChange={setDomain} disabled={!isLeader} />
        <ProjectTypeSelect value={projectType} onChange={setProjectType} disabled={!isLeader} />
      </div>

      {/* Team Size, Experience Level, Budget, Duration */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Quy mô đội ngũ</label>
          <Input
            type="number"
            min={1}
            max={100}
            placeholder="Số thành viên"
            value={teamSize ?? ""}
            onChange={(e) => setTeamSize(e.target.value ? parseInt(e.target.value) : null)}
            disabled={!isLeader}
            className="h-10"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Kinh nghiệm đội ngũ</label>
          <select
            value={experienceLevel ?? ""}
            onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel || null)}
            disabled={!isLeader}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Chọn...</option>
            {EXPERIENCE_LEVEL_OPTIONS.map((level) => (
              <option key={level} value={level}>
                {EXPERIENCE_LEVEL_LABELS[level]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Ngân sách</label>
          <select
            value={budgetRange ?? ""}
            onChange={(e) => setBudgetRange(e.target.value as BudgetRange || null)}
            disabled={!isLeader}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Chọn...</option>
            {BUDGET_RANGE_OPTIONS.map((range) => (
              <option key={range} value={range}>
                {BUDGET_RANGE_LABELS[range]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Thời gian (ngày)</label>
          <Input
            type="number"
            min={1}
            max={365}
            placeholder="Số ngày"
            value={durationDays ?? ""}
            onChange={(e) => setDurationDays(e.target.value ? parseInt(e.target.value) : null)}
            disabled={!isLeader}
            className="h-10"
          />
        </div>
      </div>

      {/* Main Goal */}
      <ProjectGoalInput value={mainGoal} onChange={setMainGoal} disabled={!isLeader} />

      {/* Deliverables */}
      <DeliverablesSection value={deliverables} onChange={setDeliverables} disabled={!isLeader} />

      {/* Target Audience */}
      <TargetAudienceSection value={targetAudience} onChange={setTargetAudience} disabled={!isLeader} />

      {/* Success Metrics */}
      <SuccessMetricsSection value={successMetrics} onChange={setSuccessMetrics} disabled={!isLeader} />

      {/* Workflow Readiness Indicator */}
      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Sẵn sàng tạo quy trình AI</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant={domain ? "approved" : "revise"}>
                  {domain ? `Lĩnh vực: ${getDomainLabel(domain)}` : "Chưa chọn lĩnh vực"}
                </Badge>
                <Badge variant={mainGoal.length >= 100 && mainGoal.length <= 300 ? "approved" : "revise"}>
                  {mainGoal.length >= 100 && mainGoal.length <= 300 ? "Mục tiêu OK" : "Cần mục tiêu (100-300 ký tự)"}
                </Badge>
                <Badge variant={durationDays !== null && durationDays > 0 ? "approved" : "revise"}>
                  {durationDays ? `${durationDays} ngày` : "Chưa có thời gian"}
                </Badge>
                <Badge variant={deliverables.length > 0 ? "approved" : "revise"}>
                  {deliverables.length > 0 ? `${deliverables.length} deliverables` : "Chưa chọn deliverables"}
                </Badge>
              </div>
            </div>
            {isLeader && (
              <div className="flex items-center gap-2">
                {saveStatus === "saving" && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Đang lưu...</span>
                  </div>
                )}
                {saveStatus === "saved" && (
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Đã lưu</span>
                  </div>
                )}
                {saveStatus === "error" && (
                  <div className="flex items-center gap-1 text-sm text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Lưu thất bại</span>
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={isPending}
                >
                  <Save className="mr-1 h-4 w-4" />
                  Lưu
                </Button>
              </div>
            )}
          </div>
          {error && (
            <p className="mt-2 text-sm text-destructive">{error}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}