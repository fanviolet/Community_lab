"use client";

import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import WorkflowInputForm from "@/components/workflow/WorkflowInputForm";
import WorkflowKanban from "@/components/workflow/WorkflowKanban";
import WorkflowMetrics from "@/components/workflow/WorkflowMetrics";
import WorkflowRisks from "@/components/workflow/WorkflowRisks";
import WorkflowTimeline from "@/components/workflow/WorkflowTimeline";
import WorkflowDependencies from "@/components/workflow/WorkflowDependencies";
import {
  generateWorkflow,
  getUserWorkflows,
  saveWorkflow,
} from "./actions";
import type {
  SavedWorkflow,
  WorkflowInput,
  WorkflowOutput,
} from "./workflow-types";

function formatDate(value: string | null) {
  if (!value) return "Ngày không rõ";

  return new Date(value).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function WorkflowViewer({ workflow }: { workflow: WorkflowOutput }) {
  const phases = workflow.phases.map((phase) => phase.name);

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>{workflow.workflowTitle}</CardTitle>
          <CardDescription>Tóm tắt dự án</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{workflow.projectSummary}</p>
        </CardContent>
      </Card>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Tóm tắt điều hành</CardTitle>
          <CardDescription>Tổng quan về dự án đề xuất</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{workflow.executiveSummary}</p>
        </CardContent>
      </Card>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Cấu trúc đội ngũ đề xuất</CardTitle>
          <CardDescription>Vai trò và trách nhiệm đề xuất</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workflow.teamStructure.map((role, index) => (
              <div
                key={`${role.role}-${index}`}
                className="space-y-3 rounded-lg border border-border/60 bg-muted p-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{role.role}</h3>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {role.count}
                  </div>
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {role.responsibilities.map((responsibility) => (
                    <li key={responsibility} className="flex items-start gap-2">
                      <span className="text-primary">-</span>
                      <span>{responsibility}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <WorkflowTimeline phases={workflow.phases} />
      <WorkflowKanban tasks={workflow.tasks} phases={phases} />
      <WorkflowDependencies dependencies={workflow.dependencies} />
      <WorkflowRisks risks={workflow.risks} />
      <WorkflowMetrics metrics={workflow.successMetrics} />
    </div>
  );
}

export default function WorkflowGeneratorPage() {
  const [isPending, startTransition] = useTransition();
  const [workflow, setWorkflow] = useState<WorkflowOutput | null>(null);
  const [inputData, setInputData] = useState<WorkflowInput | null>(null);
  const [savedWorkflows, setSavedWorkflows] = useState<SavedWorkflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<SavedWorkflow | null>(null);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startTransition(async () => {
      try {
        const workflows = await getUserWorkflows();
        setSavedWorkflows(workflows);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể tải quy trình đã lưu");
      } finally {
        setLoadingSaved(false);
      }
    });
  }, []);

  const handleGenerate = (formData: FormData) => {
    setError(null);
    setSelectedWorkflow(null);

    startTransition(async () => {
      try {
        const result = await generateWorkflow(formData);
        setWorkflow(result);
        setInputData({
          problemTitle: String(formData.get("problemTitle") ?? ""),
          problemDescription: String(formData.get("problemDescription") ?? ""),
          communityImpact: String(formData.get("communityImpact") ?? ""),
          expectedGoal: String(formData.get("expectedGoal") ?? ""),
          estimatedTeamSize: Number(formData.get("estimatedTeamSize") ?? "0"),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể tạo quy trình làm việc");
      }
    });
  };

  const handleSave = () => {
    if (!workflow || !inputData) return;

    setError(null);

    startTransition(async () => {
      try {
        const savedId = await saveWorkflow(inputData, workflow);
        const workflows = await getUserWorkflows();
        setSavedWorkflows(workflows);
        setSelectedWorkflow(workflows.find((item) => item.id === savedId) ?? null);
        setWorkflow(null);
        setInputData(null);
        alert("Đã lưu quy trình làm việc thành công!");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể lưu quy trình làm việc");
      }
    });
  };

  const handleGenerateNew = () => {
    setWorkflow(null);
    setInputData(null);
    setSelectedWorkflow(null);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Trình tạo quy trình làm việc AI</h1>
          <p className="text-sm text-muted-foreground">
            Chuyển đổi vấn đề cộng đồng thành kế hoạch dự án khả thi với AI
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {!workflow ? (
        <>
          <WorkflowInputForm onGenerate={handleGenerate} isGenerating={isPending} />

          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardHeader>
              <CardTitle>Quy trình đã lưu</CardTitle>
              <CardDescription>Mở kế hoạch quy trình đã tạo trước đây</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingSaved ? (
                <p className="text-sm text-muted-foreground">Đang tải quy trình đã lưu...</p>
              ) : savedWorkflows.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Chưa có quy trình nào được lưu. Tạo và lưu một quy trình để xem ở đây.
                </p>
              ) : (
                savedWorkflows.map((saved) => (
                  <button
                    key={saved.id}
                    type="button"
                    onClick={() => setSelectedWorkflow(saved)}
                    className="flex w-full flex-col gap-2 rounded-lg border border-border/60 bg-muted p-4 text-left transition hover:border-primary/40 hover:bg-primary/5"
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <span className="font-medium">{saved.input.problemTitle}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(saved.createdAt)}
                      </span>
                    </div>
                    <span className="line-clamp-2 text-sm text-muted-foreground">
                      {saved.input.expectedGoal || saved.output.executiveSummary}
                    </span>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {selectedWorkflow ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold">{selectedWorkflow.input.problemTitle}</h2>
                <p className="text-sm text-muted-foreground">
                  Đã lưu vào {formatDate(selectedWorkflow.createdAt)}
                </p>
              </div>
              <WorkflowViewer workflow={selectedWorkflow.output} />
            </div>
          ) : null}
        </>
      ) : (
        <>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleGenerateNew}>
              Tạo quy trình mới
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "Đang lưu..." : "Lưu quy trình làm việc"}
            </Button>
          </div>

          <WorkflowViewer workflow={workflow} />
        </>
      )}
    </div>
  );
}
