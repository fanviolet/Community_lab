"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { buildProjectTimelineContext, calculateDaysRemaining } from "@/lib/project-timeline";
import { requireProjectPermission } from "@/lib/rbac-server";
import {
  buildWorkflowGenerationPrompt,
  validateAIWorkflowResponse,
  validateWorkflowQuality,
  calculateTaskCountRange,
  calculateDynamicTaskCount,
  generateFallbackWorkflow,
  isGenericTask,
  countGenericTasks,
  type ProjectContext,
  type AIWorkflowResult,
  type AIGeneratedTask,
  type AIGeneratedMilestone,
  type ValidationFailure,
} from "@/lib/workflow-ai-generator";
import type {
  WorkflowPhase,
  WorkflowTask,
  WorkflowRisk,
  WorkflowDependency,
  WorkflowSuccessMetric,
  GeneratedWorkflow,
  WorkflowTaskImport,
  SavedWorkflow,
} from "./workspace-workflow-types";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getSupabaseClient() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Không có quyền truy cập");
  }

  return { supabase, user };
}

// ============================================================================
// AI WORKFLOW GENERATION
// ============================================================================

/**
 * Call the AI API to generate a context-specific workflow
 */
async function callWorkflowAI(context: ProjectContext): Promise<AIWorkflowResult> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const response = await fetch(`${baseUrl}/api/workflow-ai`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      projectTitle: context.title,
      projectDescription: context.description,
      startDate: context.startDate || undefined,
      endDate: context.endDate || undefined,
      existingTasks: context.existingTasks,
      members: context.members.map((m) => ({
        name: m.name,
        email: m.email,
        role: m.role,
      })),
      recentActivities: context.recentActivities,
      pitchContent: context.pitchContent,
      pitchAIAnalysis: context.pitchAIAnalysis,
      // NEW: Structured planning fields
      domain: context.domain,
      projectType: context.project_type,
      teamSize: context.team_size,
      experienceLevel: context.experience_level,
      budgetRange: context.budget_range,
      durationDays: context.duration_days,
      mainGoal: context.main_goal,
      deliverables: context.deliverables,
      targetAudience: context.target_audience,
      successMetrics: context.success_metrics,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI workflow generation failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  return result.result;
}

/**
 * Convert AI-generated tasks to legacy WorkflowPhase format
 */
function convertAIToWorkflowPhases(
  aiResult: AIWorkflowResult,
  existingTasks: any[] = []
): WorkflowPhase[] {
  const phases: WorkflowPhase[] = aiResult.milestones.map((milestone, index) => {
    // Get tasks that belong to this milestone
    const milestoneTasks = aiResult.tasks
      .filter((task) => milestone.tasks.includes(task.title))
      .map((task) => ({
        title: task.title,
        description: task.description,
        priority: task.priority.toLowerCase() as "low" | "medium" | "high",
        suggested_role: task.assigneeType,
      }));

    // Calculate progress based on existing tasks
    const completedCount = milestoneTasks.filter((mt) =>
      existingTasks.some((et) => et.title === mt.title && et.status === "completed")
    ).length;
    const progress = milestoneTasks.length > 0 ? Math.round((completedCount / milestoneTasks.length) * 100) : 0;

    return {
      phase_name: milestone.name,
      objective: milestone.description,
      duration: "TBD",
      tasks: milestoneTasks,
      risks: aiResult.workflowRisks.slice(0, 2),
      dependencies: [],
      success_metrics: aiResult.successMetrics.slice(0, 2),
      progress,
    };
  });

  // If no milestones, create a default phase structure from tasks
  if (phases.length === 0) {
    phases.push({
      phase_name: "Thực hiện dự án",
      objective: "Triển khai các công việc chính của dự án",
      duration: "TBD",
      tasks: aiResult.tasks.map((task) => ({
        title: task.title,
        description: task.description,
        priority: task.priority.toLowerCase() as "low" | "medium" | "high",
        suggested_role: task.assigneeType,
      })),
      risks: aiResult.workflowRisks,
      dependencies: [],
      success_metrics: aiResult.successMetrics,
      progress: 0,
    });
  }

  return phases;
}

/**
 * Generate team structure based on team size
 */
function generateTeamStructure(teamSize: number) {
  return [
    {
      role: "Team Leader",
      responsibilities: ["Overall coordination", "Decision making", "Stakeholder management"],
      count: 1,
    },
    {
      role: "Team Member",
      responsibilities: ["Task execution", "Progress reporting", "Collaboration"],
      count: Math.max(1, teamSize - 2),
    },
    {
      role: "Mentor",
      responsibilities: ["Guidance", "Quality assurance", "Knowledge transfer"],
      count: 1,
    },
  ];
}

/**
 * Generate dependencies from AI task data
 */
function generateDependencies(tasks: AIGeneratedTask[]): WorkflowDependency[] {
  const dependencies = tasks
    .filter((task) => task.dependsOn.length > 0)
    .map((task) => ({
      description: `"${task.title}" depends on: ${task.dependsOn.join(", ")}`,
      type: "sequential" as const,
    }));

  return dependencies.length > 0 ? dependencies : [
    { description: "Tasks should be executed in priority order", type: "sequential" },
  ];
}

// ============================================================================
// MAIN WORKFLOW GENERATION FUNCTION
// ============================================================================

/**
 * Generate workflow using AI analysis of project content
 * This is the PRIMARY method - AI-driven, not template-based
 * 
 * The function:
 * 1. Gathers all project data (title, description, dates, tasks, members, activities)
 * 2. Builds comprehensive context for AI analysis
 * 3. Calls AI to generate customized workflow
 * 4. Validates AI response
 * 5. Falls back to template only if AI fails completely
 */
export async function generateWorkflow(projectId: string): Promise<GeneratedWorkflow> {
  await requireProjectPermission(projectId, "workflow.generate");

  const { supabase, user } = await getSupabaseClient();

  // Fetch ALL project data for comprehensive AI analysis
  const [
    projectResult,
    tasksResult,
    membersResult,
    activitiesResult,
    pitchResult,
    pitchAnalysisResult,
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("id,title,description,status,start_date,end_date,created_at,domain,project_type,team_size,experience_level,budget_range,duration_days,main_goal,deliverables,target_audience,success_metrics")
      .eq("id", projectId)
      .maybeSingle(),
    supabase
      .from("tasks")
      .select("id,title,description,status,priority,assigned_to,assigned_user,due_date")
      .eq("project_id", projectId),
    supabase
      .from("project_members")
      .select("id,user_id,name,email,role")
      .eq("project_id", projectId),
    supabase
      .from("activities")
      .select("id,action,description,created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("pitches")
      .select("id,content")
      .eq("project_id", projectId)
      .maybeSingle(),
    supabase
      .from("pitch_ai_analyses")
      .select("id,analysis_summary")
      .eq("project_id", projectId)
      .maybeSingle(),
  ]);

  if (projectResult.error || !projectResult.data) {
    throw new Error(projectResult.error?.message ?? "Project not found");
  }

  const project = projectResult.data;
  const tasks = tasksResult.data ?? [];
  const members = membersResult.data ?? [];
  const activities = activitiesResult.data ?? [];
  const pitch = pitchResult.data;
  const pitchAnalysis = pitchAnalysisResult.data;

  // Log planning data
  console.log("[generateWorkflow] Planning data:", {
    domain: project.domain,
    project_type: project.project_type,
    team_size: project.team_size,
    experience_level: project.experience_level,
    budget_range: project.budget_range,
    duration_days: project.duration_days,
    main_goal: project.main_goal,
    deliverables: project.deliverables,
    target_audience: project.target_audience,
    success_metrics: project.success_metrics,
  });

  // Build comprehensive project context
  const projectContext: ProjectContext = {
    title: project.title,
    description: project.description || "",
    status: project.status || "planning",
    startDate: project.start_date || null,
    endDate: project.end_date || null,
    existingTasks: tasks.map((task: any) => ({
      title: task.title,
      description: task.description || "",
      status: task.status || "",
      priority: task.priority || "",
      dueDate: task.due_date || "",
      assignedTo: task.assigned_user || "",
    })),
    members: members.map((m: any) => ({
      userId: m.user_id,
      name: m.name || "",
      email: m.email || "",
      role: m.role || "Team Member",
    })),
    recentActivities: activities.map((a: any) => ({
      action: a.action,
      description: a.description || "",
      createdAt: a.created_at,
    })),
    pitchContent: pitch?.content || undefined,
    pitchAIAnalysis: pitchAnalysis?.analysis_summary || undefined,
    // NEW: Structured planning fields from project data
    domain: project.domain,
    project_type: project.project_type,
    team_size: project.team_size,
    experience_level: project.experience_level,
    budget_range: project.budget_range,
    duration_days: project.duration_days,
    main_goal: project.main_goal,
    deliverables: project.deliverables as string[] | undefined,
    target_audience: project.target_audience as string[] | undefined,
    success_metrics: project.success_metrics as Array<{ metric: string; target: number }> | undefined,
  };

  // Log AI context
  console.log("[generateWorkflow] AI context built:", {
    hasDomain: !!projectContext.domain,
    hasProjectType: !!projectContext.project_type,
    hasDeliverables: !!projectContext.deliverables && projectContext.deliverables.length > 0,
    deliverablesCount: projectContext.deliverables?.length || 0,
    hasTargetAudience: !!projectContext.target_audience && projectContext.target_audience.length > 0,
    targetAudienceCount: projectContext.target_audience?.length || 0,
    hasSuccessMetrics: !!projectContext.success_metrics && projectContext.success_metrics.length > 0,
    successMetricsCount: projectContext.success_metrics?.length || 0,
    hasBudget: !!projectContext.budget_range,
    hasDuration: !!projectContext.duration_days,
    hasMainGoal: !!projectContext.main_goal,
  });

  const daysRemaining = calculateDaysRemaining(project.end_date || "");
  const taskCountRange = calculateTaskCountRange(daysRemaining);

  // Calculate dynamic requirements based on project data
  const dynamicCount = calculateDynamicTaskCount({
    duration_days: project.duration_days,
    team_size: project.team_size ?? members.length,
    project_type: project.project_type,
    deliverables: project.deliverables as string[] | undefined,
  });

  const validationRequirements = {
    minPhases: 4,
    minTasks: Math.max(10, dynamicCount.min),
    minMilestones: Math.max(4, dynamicCount.suggested_phases - 1),
    minRisks: 3,
    minSuccessMetrics: 3,
    minDeliverables: 2,
  };

  // Try AI generation first with retry logic
  let aiResult: AIWorkflowResult | null = null;
  let usedFallback = false;
  const validationFailures: ValidationFailure[] = [];
  let attemptNumber = 0;
  const maxAttempts = 2; // Try AI twice before falling back

  while (attemptNumber < maxAttempts && !aiResult) {
    attemptNumber++;
    
    try {
      console.log(`[generateWorkflow] AI attempt ${attemptNumber}/${maxAttempts} for project: ${project.title}`);
      aiResult = await callWorkflowAI(projectContext);

      // Log AI response
      console.log("[generateWorkflow] AI response received:", {
        hasProjectUnderstanding: !!aiResult?.projectUnderstanding,
        projectUnderstanding: aiResult?.projectUnderstanding?.substring(0, 100),
        deliverablesCount: aiResult?.keyDeliverables?.length || 0,
        deliverables: aiResult?.keyDeliverables,
        milestonesCount: aiResult?.milestones?.length || 0,
        milestones: aiResult?.milestones?.map(m => m.name),
        tasksCount: aiResult?.tasks?.length || 0,
        tasks: aiResult?.tasks?.map(t => t.title),
        risksCount: aiResult?.workflowRisks?.length || 0,
        successMetricsCount: aiResult?.successMetrics?.length || 0,
      });

      // Validate AI result
      if (aiResult) {
        // Check for generic tasks
        const genericCount = countGenericTasks(aiResult.tasks);
        const totalTasks = aiResult.tasks.length;
        const genericRatio = totalTasks > 0 ? genericCount / totalTasks : 0;

        if (genericRatio > 0.3) {
          const failure: ValidationFailure = {
            reason: "Too many generic tasks",
            details: [`${genericCount}/${totalTasks} tasks are generic (${Math.round(genericRatio * 100)}%)`],
            timestamp: new Date().toISOString(),
            attemptNumber,
          };
          validationFailures.push(failure);
          console.warn(
            `[generateWorkflow] Attempt ${attemptNumber}: Too many generic tasks (${genericCount}/${totalTasks}).`
          );
          aiResult = null;
          continue;
        }

        // Validate against minimum requirements
        const qualityValidation = validateWorkflowQuality(
          {
            milestones: aiResult.milestones,
            tasks: aiResult.tasks,
            workflowRisks: aiResult.workflowRisks,
            successMetrics: aiResult.successMetrics,
            keyDeliverables: aiResult.keyDeliverables,
          }
        );

        if (!qualityValidation.valid) {
          const failure: ValidationFailure = {
            reason: "Workflow quality validation failed",
            details: qualityValidation.errors,
            timestamp: new Date().toISOString(),
            attemptNumber,
          };
          validationFailures.push(failure);
          console.warn(
            `[generateWorkflow] Attempt ${attemptNumber}: Quality validation failed:`,
            qualityValidation.errors
          );
          aiResult = null;
          continue;
        }

        // Check task count is within reasonable range
        if (aiResult.tasks.length < dynamicCount.min * 0.7) {
          const failure: ValidationFailure = {
            reason: "Too few tasks generated",
            details: [`Generated ${aiResult.tasks.length} tasks, expected at least ${Math.round(dynamicCount.min * 0.7)}`],
            timestamp: new Date().toISOString(),
            attemptNumber,
          };
          validationFailures.push(failure);
          console.warn(
            `[generateWorkflow] Attempt ${attemptNumber}: Too few tasks (${aiResult.tasks.length}). Expected at least ${Math.round(dynamicCount.min * 0.7)}.`
          );
          aiResult = null;
          continue;
        }

        // AI result passed all validations
        console.log(
          `[generateWorkflow] Attempt ${attemptNumber}: AI generation successful with ${aiResult.tasks.length} tasks`
        );
        break;
      }
    } catch (error) {
      const failure: ValidationFailure = {
        reason: error instanceof Error ? error.message : "Unknown error",
        details: [String(error)],
        timestamp: new Date().toISOString(),
        attemptNumber,
      };
      validationFailures.push(failure);
      console.error(`[generateWorkflow] Attempt ${attemptNumber}: AI generation failed:`, error);
      aiResult = null;
    }
  }

  // Fallback to template-based generation if AI fails after all attempts
  if (!aiResult) {
    usedFallback = true;
    const fallbackReason = validationFailures.length > 0 
      ? validationFailures.map(f => `${f.reason}: ${f.details.join(', ')}`).join('; ')
      : 'Unknown error';
    
    console.error(
      `[generateWorkflow] FALLBACK TRIGGERED for project: ${project.title}`
    );
    console.error(`[generateWorkflow] Attempts: ${attemptNumber}/${maxAttempts}`);
    console.error(`[generateWorkflow] Fallback reason: ${fallbackReason}`);
    console.error(`[generateWorkflow] Validation failures:`, validationFailures);
    console.error(`[generateWorkflow] Project context that was sent to AI:`, {
      domain: projectContext.domain,
      project_type: projectContext.project_type,
      deliverables: projectContext.deliverables,
      target_audience: projectContext.target_audience,
      success_metrics: projectContext.success_metrics,
      budget_range: projectContext.budget_range,
      duration_days: projectContext.duration_days,
      main_goal: projectContext.main_goal,
    });
    
    aiResult = generateFallbackWorkflow(
      project.title,
      project.description || "",
      daysRemaining,
      {
        domain: project.domain,
        project_type: project.project_type,
        team_size: project.team_size,
        duration_days: project.duration_days,
        deliverables: project.deliverables as string[] | undefined,
        main_goal: project.main_goal,
      }
    );
  }

  // At this point, aiResult is guaranteed to be non-null (fallback ensures this)
  const workflowResult: AIWorkflowResult = aiResult;

  // Convert AI result to workflow phases
  const phases = convertAIToWorkflowPhases(workflowResult, tasks);

  // Build team structure
  const teamStructure = generateTeamStructure(members.length || 5);

  // Build timeline context
  const timelineContext = buildProjectTimelineContext({
    title: project.title,
    description: project.description,
    status: project.status,
    startDate: project.start_date,
    endDate: project.end_date,
  });

  // Build project summary
  const projectSummary = `${workflowResult.projectUnderstanding}

${timelineContext}

**Đội ngũ:** ${members.length} thành viên
**Công việc hiện có:** ${tasks.length} task
**Thời gian còn lại:** ${daysRemaining !== null ? daysRemaining + " ngày" : "Chưa xác định"}
**Số task đề xuất:** ${workflowResult.tasks.length} task (${taskCountRange.min}-${taskCountRange.max} theo timeline)
${usedFallback ? "\n⚠️ Lưu ý: Quy trình được tạo từ template do AI không tạo được kết quả phù hợp." : ""}`;

  const executiveSummary = `${workflowResult.projectUnderstanding}

**Deliverables chính:**
${workflowResult.keyDeliverables.map((d, i) => `  ${i + 1}. ${d}`).join("\n")}

**Cấu trúc quy trình:**
- ${workflowResult.milestones.length} cột mốc chính
- ${workflowResult.tasks.length} công việc cụ thể
- ${workflowResult.workflowRisks.length} rủi ro đã được xác định
- ${workflowResult.successMetrics.length} chỉ số thành công

${usedFallback ? "⚠️ Quy trình này được tạo từ template do AI không tạo được kết quả phù hợp." : "✅ Quy trình này được tạo hoàn toàn bởi AI dựa trên phân tích nội dung dự án."}`;

  const workflow: GeneratedWorkflow = {
    workflow_title: `${project.title} - AI-Generated Workflow`,
    executive_summary: executiveSummary,
    project_summary: projectSummary,
    phases,
    team_structure: teamStructure,
    timeline: {
      estimated_start_date: project.start_date || new Date().toISOString(),
      estimated_end_date: project.end_date || new Date().toISOString(),
      total_duration: daysRemaining !== null ? `${daysRemaining} days` : "TBD",
    },
  };

  // Save workflow to database
  const { error: saveError } = await supabase.from("ai_workflows").insert({
    project_id: projectId,
    workflow_json: workflow as any,
    generated_by: user.id,
    ai_generated: workflowResult as any,
    used_fallback: usedFallback,
    validation_failures: validationFailures.length > 0 ? validationFailures : null,
    generation_attempts: attemptNumber,
  });

  if (saveError) {
    console.error("[generateWorkflow] Failed to save workflow:", saveError);
  }

  revalidatePath(`/dashboard/workspace/${projectId}`);

  return workflow;
}

// ============================================================================
// WORKFLOW MANAGEMENT FUNCTIONS
// ============================================================================

export async function getProjectWorkflows(projectId: string): Promise<SavedWorkflow[]> {
  const { supabase, user } = await getSupabaseClient();

  // Check if user is a member
  const { data: membership } = await supabase
    .from("project_members")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    throw new Error("Bạn phải là thành viên dự án để xem quy trình");
  }

  const { data, error } = await supabase
    .from("ai_workflows")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item: any) => ({
    id: item.id,
    project_id: item.project_id,
    workflow_json: item.workflow_json as GeneratedWorkflow,
    generated_by: item.generated_by,
    created_at: item.created_at,
  }));
}

export async function getLatestWorkflow(projectId: string): Promise<GeneratedWorkflow | null> {
  const { supabase, user } = await getSupabaseClient();

  // Check if user is a member
  const { data: membership } = await supabase
    .from("project_members")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    throw new Error("Bạn phải là thành viên dự án để xem quy trình");
  }

  const { data, error } = await supabase
    .from("ai_workflows")
    .select("workflow_json")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.workflow_json as GeneratedWorkflow ?? null;
}

export async function saveWorkflow(projectId: string, workflow: GeneratedWorkflow): Promise<void> {
  await requireProjectPermission(projectId, "workflow.generate");

  const { supabase, user } = await getSupabaseClient();

  // Check if workflow already exists for this project
  const { data: existingWorkflow } = await supabase
    .from("ai_workflows")
    .select("id")
    .eq("project_id", projectId)
    .maybeSingle();

  const workflowData = {
    project_id: projectId,
    workflow_json: workflow as any,
    workflow_name: workflow.workflow_title,
    ai_prompt: `Generate workflow for project: ${workflow.workflow_title}`,
    generated_by: user.id,
  };

  if (existingWorkflow) {
    // Update existing workflow
    const { error } = await supabase
      .from("ai_workflows")
      .update({
        workflow_json: workflow as any,
        workflow_name: workflow.workflow_title,
        ai_prompt: `Generate workflow for project: ${workflow.workflow_title}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingWorkflow.id);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    // Insert new workflow
    const { error } = await supabase.from("ai_workflows").insert(workflowData);

    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath(`/dashboard/workspace/${projectId}`);
}

export async function deleteWorkflow(workflowId: string, projectId: string): Promise<void> {
  await requireProjectPermission(projectId, "workflow.generate");

  const { supabase } = await getSupabaseClient();

  const { error } = await supabase
    .from("ai_workflows")
    .delete()
    .eq("id", workflowId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/workspace/${projectId}`);
}

export async function importTasks(
  projectId: string,
  selectedTasks: WorkflowTaskImport[]
): Promise<void> {
  await requireProjectPermission(projectId, "task.create");

  const { supabase, user } = await getSupabaseClient();

  // Insert tasks
  const tasksToInsert = selectedTasks.map((task) => ({
    project_id: projectId,
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: "todo",
    created_by: user.id,
  }));

  const { error } = await supabase.from("tasks").insert(tasksToInsert);

  if (error) {
    throw new Error(error.message);
  }

  // Log activity
  await supabase.from("activities").insert({
    project_id: projectId,
    user_id: user.id,
    user_name: user.email?.split("@")[0] ?? "Unknown",
    action: "tasks_imported",
    description: `Imported ${selectedTasks.length} tasks from workflow`,
  });

  revalidatePath(`/dashboard/workspace/${projectId}`);
}

export async function calculatePhaseProgress(
  projectId: string,
  phaseName: string
): Promise<number> {
  const { supabase } = await getSupabaseClient();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("status,title,description")
    .eq("project_id", projectId);

  if (!tasks) return 0;

  const phaseTasks = tasks.filter((task: any) =>
    task.title.toLowerCase().includes(phaseName.toLowerCase()) ||
    task.description?.toLowerCase().includes(phaseName.toLowerCase())
  );

  if (phaseTasks.length === 0) return 0;

  const completedTasks = phaseTasks.filter((task: any) => task.status === "completed").length;
  return Math.round((completedTasks / phaseTasks.length) * 100);
}