"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  AlertTriangle,
  Target,
  Link2,
  Download,
  History,
  Sparkles,
  RefreshCw,
  Trash2,
  Save,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RoleBadge } from "@/components/common/role-badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  generateWorkflow,
  getProjectWorkflows,
  getLatestWorkflow,
  deleteWorkflow,
  saveWorkflow,
  importTasks,
  calculatePhaseProgress,
} from "@/app/dashboard/workspace/[id]/workflow-actions";
import type {
  GeneratedWorkflow,
  WorkflowPhase,
  WorkflowTask,
} from "@/app/dashboard/workspace/[id]/workspace-workflow-types";

interface ProjectWorkflowProps {
  projectId: string;
  isLeader: boolean;
}

export default function ProjectWorkflow({
  projectId,
  isLeader,
}: ProjectWorkflowProps) {
  const [isPending, startTransition] = useTransition();
  const [workflow, setWorkflow] = useState<GeneratedWorkflow | null>(null);
  const [workflowHistory, setWorkflowHistory] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"generate" | "view" | "history" | "import">("generate");
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error" | "unsaved" | null>(null);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-load latest workflow on mount
  useEffect(() => {
    startTransition(async () => {
      try {
        const latest = await getLatestWorkflow(projectId);
        if (latest) {
          setWorkflow(latest);
          setViewMode("view");
          setSaveStatus("saved");
        } else {
          setSaveStatus(null);
        }
      } catch (err) {
        console.error("Failed to load latest workflow:", err);
      }
    });
  }, [projectId]);

  // Auto-save after 5 seconds if workflow changes
  useEffect(() => {
    if (!workflow || !isLeader) return;

    setSaveStatus("unsaved");

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        setSaveStatus("saving");
        await saveWorkflow(projectId, workflow);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus(null), 3000);
      } catch (err) {
        setSaveStatus("error");
        console.error("Auto-save failed:", err);
      }
    }, 5000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [workflow, projectId, isLeader]);

  const handleGenerate = () => {
    setError(null);
    setShowRegenerateConfirm(false);
    startTransition(async () => {
      try {
        const result = await generateWorkflow(projectId);
        setWorkflow(result);
        setViewMode("view");
        setSaveStatus("saved");
        const history = await getProjectWorkflows(projectId);
        setWorkflowHistory(history);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate workflow");
      }
    });
  };

  const handleManualSave = () => {
    if (!workflow || !isLeader) return;
    
    setError(null);
    setSaveStatus("saving");
    startTransition(async () => {
      try {
        await saveWorkflow(projectId, workflow);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus(null), 3000);
      } catch (err) {
        setSaveStatus("error");
        setError(err instanceof Error ? err.message : "Failed to save workflow");
      }
    });
  };

  const handleLoadLatest = () => {
    startTransition(async () => {
      try {
        const latest = await getLatestWorkflow(projectId);
        if (latest) {
          setWorkflow(latest);
          setViewMode("view");
        } else {
          setError("No saved workflow found");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load workflow");
      }
    });
  };

  const handleViewHistory = () => {
    startTransition(async () => {
      try {
        const history = await getProjectWorkflows(projectId);
        setWorkflowHistory(history);
        setViewMode("history");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load workflow history");
      }
    });
  };

  const handleDeleteWorkflow = (workflowId: string) => {
    startTransition(async () => {
      try {
        await deleteWorkflow(workflowId, projectId);
        const history = await getProjectWorkflows(projectId);
        setWorkflowHistory(history);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete workflow");
      }
    });
  };

  const handleRestoreWorkflow = (workflowJson: GeneratedWorkflow) => {
    setWorkflow(workflowJson);
    setViewMode("view");
  };

  const handleSelectTask = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const handleTogglePhase = (phaseName: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseName)) {
      newExpanded.delete(phaseName);
    } else {
      newExpanded.add(phaseName);
    }
    setExpandedPhases(newExpanded);
  };

  const handleProceedToImport = () => {
    setViewMode("import");
  };

  const handleRegenerateClick = () => {
    if (workflow) {
      setShowRegenerateConfirm(true);
    } else {
      handleGenerate();
    }
  };

  const handleConfirmImport = () => {
    setError(null);
    startTransition(async () => {
      try {
        const tasksToImport: any[] = [];
        selectedTasks.forEach((taskId) => {
          const [phaseName, taskTitle] = taskId.split("-");
          const phase = workflow?.phases.find((p: WorkflowPhase) => p.phase_name === phaseName);
          const task = phase?.tasks.find((t: WorkflowTask) => t.title === taskTitle);
          if (task) {
            tasksToImport.push({
              title: task.title,
              description: task.description,
              priority: task.priority,
              suggested_role: task.suggested_role,
              phase_name: phaseName,
            });
          }
        });

        if (tasksToImport.length === 0) {
          setError("Vui lòng chọn ít nhất một công việc để thêm");
          return;
        }

        await importTasks(projectId, tasksToImport);
        setSelectedTasks(new Set());
        setViewMode("view");
        setError(null);
        // Trigger page revalidation to refresh Task Board
        window.location.reload();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể thêm công việc");
      }
    });
  };

  const handleRefreshProgress = () => {
    if (!workflow) return;
    startTransition(async () => {
      try {
        const updatedPhases = await Promise.all(
          workflow.phases.map(async (phase: any) => {
            const progress = await calculatePhaseProgress(projectId, phase.phase_name);
            return { ...phase, progress };
          })
        );
        setWorkflow({ ...workflow, phases: updatedPhases });
      } catch (err) {
        console.error("Failed to refresh progress:", err);
      }
    });
  };

  if (viewMode === "history") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Workflow History</h2>
            <p className="text-sm text-muted-foreground">View and manage saved workflows</p>
          </div>
          <Button variant="outline" onClick={() => setViewMode("generate")}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate New
          </Button>
        </div>

        {workflowHistory.length === 0 ? (
          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardContent className="py-12 text-center">
              <History className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No workflows generated yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {workflowHistory.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4 hover:bg-muted transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">Workflow</Badge>
                    <span className="font-medium">{item.workflow_json.workflow_title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Generated {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestoreWorkflow(item.workflow_json)}
                  >
                    View
                  </Button>
                  {isLeader && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteWorkflow(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (viewMode === "import") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Import Tasks</h2>
            <p className="text-sm text-muted-foreground">
              {selectedTasks.size} tasks selected
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setViewMode("view")}>
              Back
            </Button>
            <Button onClick={handleConfirmImport} disabled={isPending || selectedTasks.size === 0}>
              {isPending ? "Importing..." : "Confirm Import"}
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Selected Tasks Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from(selectedTasks).map((taskId) => {
                const [phaseName, taskTitle] = taskId.split("-");
                const phase = workflow?.phases.find((p: WorkflowPhase) => p.phase_name === phaseName);
                const task = phase?.tasks.find((t: WorkflowTask) => t.title === taskTitle);

                if (!task) return null;

                return (
                  <div key={taskId} className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{task.priority}</Badge>
                        <RoleBadge role={task.suggested_role} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (viewMode === "view" && workflow) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">{workflow.workflow_title}</h2>
            <p className="text-sm text-muted-foreground">
              {workflow.phases.length} phases • {workflow.phases.reduce((sum: number, p: any) => sum + p.tasks.length, 0)} tasks
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {saveStatus === "unsaved" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>Unsaved Changes</span>
                </div>
              )}
              {saveStatus === "saving" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </div>
              )}
              {saveStatus === "saved" && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Saved</span>
                </div>
              )}
              {saveStatus === "error" && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Save Failed</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRefreshProgress}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Progress
              </Button>
              <Button variant="outline" onClick={handleViewHistory}>
                <History className="mr-2 h-4 w-4" />
                History
              </Button>
              {isLeader && (
                <>
                  <Button variant="outline" onClick={handleManualSave} disabled={saveStatus === "saving"}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Workflow
                  </Button>
                  <Button variant="outline" onClick={handleRegenerateClick}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Regenerate
                  </Button>
                  <Button onClick={handleProceedToImport} disabled={selectedTasks.size === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Import Tasks ({selectedTasks.size})
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Project Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{workflow.project_summary}</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Workflow Timeline</CardTitle>
            <CardDescription>Project phases and progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workflow.phases.map((phase: any, index: number) => {
                const isExpanded = expandedPhases.has(phase.phase_name);

                return (
                  <div key={phase.phase_name} className="border border-border rounded-lg overflow-hidden">
                    <div
                      className="flex items-center justify-between p-4 bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => handleTogglePhase(phase.phase_name)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold">{phase.phase_name}</h3>
                          <p className="text-sm text-muted-foreground">{phase.duration}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{phase.tasks.length} tasks</Badge>
                        {phase.progress !== undefined && (
                          <Badge
                            variant={phase.progress >= 80 ? "approved" : phase.progress >= 50 ? "pending" : "revise"}
                          >
                            {phase.progress}%
                          </Badge>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-4 space-y-4 border-t border-border">
                        <div>
                          <p className="text-sm font-medium mb-1">Objective</p>
                          <p className="text-sm text-muted-foreground">{phase.objective}</p>
                        </div>

                        {phase.progress !== undefined && (
                          <div>
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{phase.progress}%</span>
                            </div>
                            <Progress value={phase.progress} className="h-2" />
                          </div>
                        )}

                        <div>
                          <p className="text-sm font-medium mb-2">Tasks</p>
                          <div className="space-y-2">
                            {phase.tasks.map((task: any) => {
                              const taskId = `${phase.phase_name}-${task.title}`;
                              const isSelected = selectedTasks.has(taskId);

                              return (
                                <div
                                  key={taskId}
                                  className={`flex items-start gap-3 rounded-lg border p-3 ${
                                    isSelected ? "border-primary bg-primary/5" : "border-border bg-muted/30"
                                  }`}
                                >
                                  {isLeader && (
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleSelectTask(taskId)}
                                      className="mt-1 h-4 w-4"
                                    />
                                  )}
                                  <div className="flex-1 space-y-2">
                                    <p className="font-medium text-sm">{task.title}</p>
                                    <p className="text-sm text-muted-foreground">{task.description}</p>
                                    <div className="flex gap-2">
                                      <Badge variant="outline">{task.priority}</Badge>
                                      <Badge variant="secondary" className="text-xs">
                                        {task.suggested_role}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {phase.risks && phase.risks.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Risks</p>
                            <div className="space-y-2">
                              {phase.risks.map((risk: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3"
                                >
                                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-medium">{risk.risk}</p>
                                      <Badge
                                        variant={
                                          risk.severity === "high"
                                            ? "revise"
                                            : risk.severity === "medium"
                                              ? "secondary"
                                              : "outline"
                                        }
                                        className="text-xs"
                                      >
                                        {risk.severity}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Mitigation: {risk.mitigation}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {phase.dependencies && phase.dependencies.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Dependencies</p>
                            <div className="space-y-2">
                              {phase.dependencies.map((dep: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3"
                                >
                                  <Link2 className="h-4 w-4 text-blue-600 mt-0.5" />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm font-medium">{dep.description}</p>
                                      <Badge variant="outline" className="text-xs">
                                        {dep.type}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {phase.success_metrics && phase.success_metrics.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Success Metrics</p>
                            <div className="space-y-2">
                              {phase.success_metrics.map((metric: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3"
                                >
                                  <Target className="h-4 w-4 text-green-600 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{metric.kpi}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Target: {metric.targetValue}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">AI Workflow Generator</h2>
        <p className="text-sm text-muted-foreground">
          Generate context-aware project workflows using real data
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {!workflow && (
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardContent className="py-12 text-center">
            <Sparkles className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No workflow has been created yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Generate a workflow to get started with your project planning
            </p>
            <Button onClick={handleGenerate} disabled={isPending || !isLeader}>
              {isPending ? "Generating..." : "Generate Workflow"}
            </Button>
          </CardContent>
        </Card>
      )}

      {workflowHistory.length > 0 && (
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Recent Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handleViewHistory}>
              <History className="mr-2 h-4 w-4" />
              View Workflow History ({workflowHistory.length})
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Regenerate Confirmation Modal */}
      {showRegenerateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Confirm Regenerate</CardTitle>
              <CardDescription>
                This will replace the current workflow with a new one. Continue?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowRegenerateConfirm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleGenerate}>
                  Regenerate
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {workflowHistory.length > 0 && (
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Recent Workflows</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handleViewHistory}>
              <History className="mr-2 h-4 w-4" />
              View Workflow History ({workflowHistory.length})
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
