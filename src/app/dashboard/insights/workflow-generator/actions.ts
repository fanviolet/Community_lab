"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { buildProjectTimelineContext, calculateDaysRemaining } from "@/lib/project-timeline";
import type { WorkflowInput, WorkflowOutput, SavedWorkflow, AIGeneratedTask, AIGeneratedMilestone, AIWorkflowOutput } from "./workflow-types";

// Re-export types for convenience
export type { WorkflowInput, WorkflowOutput, SavedWorkflow };

interface WorkflowRow {
  id: string;
  project_id: string | null;
  problem_title: string;
  problem_description: string | null;
  community_impact: string | null;
  expected_goal: string | null;
  estimated_team_size: number | null;
  workflow_title: string | null;
  project_summary: string | null;
  executive_summary: string | null;
  phases: WorkflowOutput["phases"] | null;
  tasks: WorkflowOutput["tasks"] | null;
  team_structure: WorkflowOutput["teamStructure"] | null;
  risks: WorkflowOutput["risks"] | null;
  dependencies: WorkflowOutput["dependencies"] | null;
  success_metrics: WorkflowOutput["successMetrics"] | null;
  ai_generated: AIWorkflowOutput | null;
  status: string | null;
  created_at: string | null;
}

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
    throw new Error("Unauthorized");
  }

  return { supabase, user };
}

// ============================================================================
// AI WORKFLOW GENERATION
// ============================================================================

/**
 * Call the AI API to generate a context-specific workflow
 * Passes comprehensive project context for accurate AI generation
 */
async function callWorkflowAI(data: {
  projectTitle: string;
  projectDescription: string;
  problemStatement?: string;
  objectives?: string;
  expectedResults?: string;
  startDate?: string;
  endDate?: string;
  teamSize?: number;
  categories?: string[];
  aiAnalytics?: string;
  existingTasks?: Array<{
    title: string;
    description?: string;
    status?: string;
    priority?: string;
  }>;
  members?: Array<{
    name: string;
    email: string;
    role: string;
  }>;
  recentActivities?: Array<{
    action: string;
    description?: string;
    createdAt: string;
  }>;
  pitchContent?: string;
  pitchAIAnalysis?: string;
}): Promise<AIWorkflowOutput> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  const response = await fetch(`${baseUrl}/api/workflow-ai`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI workflow generation failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  return result.result;
}

/**
 * Convert AI-generated tasks to legacy format for backward compatibility
 */
function convertAITasksToLegacyFormat(
  aiTasks: AIGeneratedTask[],
  aiMilestones: AIGeneratedMilestone[]
): WorkflowOutput["tasks"] {
  return aiTasks.map((task) => {
    // Find which milestone/phase this task belongs to
    const milestone = aiMilestones.find((m) => m.tasks.includes(task.title));
    
    return {
      title: task.title,
      description: task.description,
      phase: milestone?.name || "General",
      duration: `${task.estimated_days} days`,
      priority: task.priority.toLowerCase(),
    };
  });
}

/**
 * Convert AI-generated milestones to legacy phase format
 */
function convertAIMilestonesToPhases(aiMilestones: AIGeneratedMilestone[]): WorkflowOutput["phases"] {
  return aiMilestones.map((milestone, index) => ({
    name: milestone.name,
    objective: milestone.description,
    deliverables: milestone.tasks,
    suggestedTasks: milestone.tasks,
    estimatedDuration: `${milestone.target_date || "TBD"}`,
    responsibleRoles: ["Team Member", "Team Leader"],
    order: index + 1,
  }));
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
 * Generate risks based on timeline
 */
function generateRisks(daysRemaining: number | null) {
  const risks = [
    {
      risk: "Timeline delays",
      impact: "Medium to High",
      mitigation: "Regular progress monitoring and buffer time allocation",
      severity: "medium",
    },
    {
      risk: "Resource constraints",
      impact: "Medium",
      mitigation: "Early resource planning and contingency arrangements",
      severity: "medium",
    },
    {
      risk: "Scope creep",
      impact: "High",
      mitigation: "Clear requirements definition and change management",
      severity: "high",
    },
  ];

  if (daysRemaining !== null && daysRemaining <= 21) {
    risks.unshift({
      risk: "Tight project timeline",
      impact: "High risk of missing deliverables before the project end date",
      mitigation: "Prioritize critical path tasks, reduce scope, and review deadlines weekly",
      severity: daysRemaining <= 7 ? "high" : "medium",
    });
  }

  return risks;
}

/**
 * Generate dependencies based on tasks
 */
function generateDependencies(aiTasks: AIGeneratedTask[]): WorkflowOutput["dependencies"] {
  const dependencies = aiTasks
    .filter((task) => task.depends_on && task.depends_on.length > 0)
    .map((task) => ({
      description: `"${task.title}" depends on: ${task.depends_on.join(", ")}`,
      type: "sequential" as const,
    }));

  return dependencies.length > 0 ? dependencies : [
    { description: "Tasks should be executed in priority order", type: "sequential" },
  ];
}

/**
 * Generate success metrics
 */
function generateSuccessMetrics(): WorkflowOutput["successMetrics"] {
  return [
    {
      kpi: "Task Completion Rate",
      measurementMethod: "Project tracking system",
      targetValue: "> 90% of tasks completed",
    },
    {
      kpi: "Timeline Adherence",
      measurementMethod: "Milestone tracking",
      targetValue: "All milestones on time",
    },
    {
      kpi: "Team Collaboration",
      measurementMethod: "Team feedback and communication metrics",
      targetValue: "> 4/5 average rating",
    },
    {
      kpi: "Quality of Deliverables",
      measurementMethod: "Review and approval process",
      targetValue: "> 90% first-pass approval rate",
    },
  ];
}

export async function generateWorkflow(formData: FormData): Promise<WorkflowOutput> {
  const problemTitle = String(formData.get("problemTitle") ?? "").trim();
  const problemDescription = String(formData.get("problemDescription") ?? "").trim();
  const communityImpact = String(formData.get("communityImpact") ?? "").trim();
  const expectedGoal = String(formData.get("expectedGoal") ?? "").trim();
  const estimatedTeamSize = Number(formData.get("estimatedTeamSize") ?? "5");
  const projectId = String(formData.get("projectId") ?? "").trim() || undefined;

  if (!problemTitle || !problemDescription) {
    throw new Error("Problem title and description are required");
  }

  // Fetch project data if projectId is provided
  let projectData: any = null;
  let existingTasks: any[] = [];
  let members: any[] = [];
  let recentActivities: any[] = [];
  let pitchContent: string | undefined;
  let pitchAIAnalysis: string | undefined;

  if (projectId) {
    const { supabase, user } = await getSupabaseClient();

    // Check if user is a member
    const { data: membership } = await supabase
      .from("project_members")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      throw new Error("You must be a project member to generate workflows for this project");
    }

    const [projectResult, tasksResult, membersResult, activitiesResult, pitchResult, pitchAnalysisResult] = await Promise.all([
      supabase
        .from("projects")
        .select("id,title,description,status,start_date,end_date,created_at")
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
        .limit(10),
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

    if (projectResult.data) {
      projectData = projectResult.data;
    }
    if (tasksResult.data) {
      existingTasks = tasksResult.data;
    }
    if (membersResult.data) {
      members = membersResult.data;
    }
    if (activitiesResult.data) {
      recentActivities = activitiesResult.data;
    }
    if (pitchResult.data) {
      pitchContent = pitchResult.data.content;
    }
    if (pitchAnalysisResult.data) {
      pitchAIAnalysis = pitchAnalysisResult.data.analysis_summary;
    }
  }

  // Use project data if available, otherwise use form input
  const title = projectData?.title || problemTitle;
  const description = projectData?.description || problemDescription;
  const status = projectData?.status || "planning";
  const startDate = projectData?.start_date || undefined;
  const endDate = projectData?.end_date || undefined;

  // Calculate days remaining
  const daysRemaining = endDate ? calculateDaysRemaining(endDate) : null;

  // Prepare existing tasks for AI context
  const aiExistingTasks = existingTasks.map((task) => ({
    title: task.title,
    description: task.description || "",
    status: task.status || "",
    priority: task.priority || "",
  }));

  // Prepare members for AI context
  const aiMembers = members.map((m) => ({
    name: m.name || "",
    email: m.email || "",
    role: m.role || "Team Member",
  }));

  // Prepare recent activities for AI context
  const aiActivities = recentActivities.map((a) => ({
    action: a.action,
    description: a.description || "",
    createdAt: a.created_at,
  }));

  // Call AI to generate context-specific workflow with ALL project data
  const aiResult = await callWorkflowAI({
    projectTitle: title,
    projectDescription: description,
    problemStatement: problemDescription,
    objectives: expectedGoal,
    expectedResults: communityImpact,
    startDate,
    endDate,
    teamSize: members.length || estimatedTeamSize,
    categories: [], // Could be extended if project has categories
    aiAnalytics: undefined, // Could be extended if AI analytics exist
    existingTasks: aiExistingTasks,
    members: aiMembers,
    recentActivities: aiActivities,
    pitchContent: pitchContent,
    pitchAIAnalysis: pitchAIAnalysis,
  });

  // Convert AI output to legacy format for backward compatibility
  const phases = convertAIMilestonesToPhases(aiResult.milestones);
  const tasks = convertAITasksToLegacyFormat(aiResult.tasks, aiResult.milestones);
  const teamStructure = generateTeamStructure(members.length || estimatedTeamSize);
  const risks = generateRisks(daysRemaining);
  const dependencies = generateDependencies(aiResult.tasks);
  const successMetrics = generateSuccessMetrics();

  // Build project summary
  const timelineContext = projectData
    ? buildProjectTimelineContext({
        title: projectData.title,
        description: projectData.description,
        status: projectData.status,
        startDate: projectData.start_date,
        endDate: projectData.end_date,
      })
    : null;

  const workflowTitle = `${title} - AI-Generated Workflow`;
  const projectSummary = aiResult.project_understanding || 
    `This project aims to ${expectedGoal.toLowerCase()}. Current status: ${status}. The project involves ${members.length || estimatedTeamSize} team members.
${timelineContext ? `\n${timelineContext}\n` : ""}`;

  const executiveSummary = `${workflowTitle} provides an AI-generated, context-specific workflow for "${title}". Based on deep analysis of the project's goals, timeline (${daysRemaining !== null ? daysRemaining + " days remaining" : "timeline TBD"}), and team size (${members.length || estimatedTeamSize} people), this workflow includes ${phases.length} key milestones and ${aiResult.tasks.length} specific tasks. The AI has analyzed the project requirements and generated a tailored plan that avoids generic templates.`;

  const workflow: WorkflowOutput = {
    workflowTitle,
    projectSummary,
    executiveSummary,
    phases,
    tasks,
    teamStructure,
    risks,
    dependencies,
    successMetrics,
    aiGenerated: aiResult, // Include the full AI-generated output
  };

  return workflow;
}

// ============================================================================
// SAVE WORKFLOW
// ============================================================================

export async function saveWorkflow(
  input: WorkflowInput,
  output: WorkflowOutput,
  projectId?: string
): Promise<string> {
  const { supabase, user } = await getSupabaseClient();

  const { data, error } = await supabase
    .from("workflows")
    .insert({
      user_id: user.id,
      project_id: projectId || null,
      problem_title: input.problemTitle,
      problem_description: input.problemDescription,
      community_impact: input.communityImpact,
      expected_goal: input.expectedGoal,
      estimated_team_size: input.estimatedTeamSize,
      workflow_title: output.workflowTitle,
      project_summary: output.projectSummary,
      executive_summary: output.executiveSummary,
      phases: output.phases,
      tasks: output.tasks,
      team_structure: output.teamStructure,
      risks: output.risks,
      dependencies: output.dependencies,
      success_metrics: output.successMetrics,
      ai_generated: output.aiGenerated || null,
      status: "saved",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[saveWorkflow] Error:", error);
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/insights/workflow-generator");
  return data.id;
}

// ============================================================================
// GET WORKFLOWS
// ============================================================================

export async function getUserWorkflows() {
  const { supabase, user } = await getSupabaseClient();

  const { data, error } = await supabase
    .from("workflows")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getUserWorkflows] Error:", error);
    throw new Error(error.message);
  }

  const rows = (data ?? []) as WorkflowRow[];

  return rows.map((row): SavedWorkflow => ({
    id: row.id,
    projectId: row.project_id,
    status: row.status,
    createdAt: row.created_at,
    input: {
      problemTitle: row.problem_title,
      problemDescription: row.problem_description ?? "",
      communityImpact: row.community_impact ?? "",
      expectedGoal: row.expected_goal ?? "",
      estimatedTeamSize: row.estimated_team_size ?? 0,
    },
    output: {
      workflowTitle: row.workflow_title ?? "",
      projectSummary: row.project_summary ?? "",
      executiveSummary: row.executive_summary ?? "",
      phases: Array.isArray(row.phases) ? row.phases : [],
      tasks: Array.isArray(row.tasks) ? row.tasks : [],
      teamStructure: Array.isArray(row.team_structure) ? row.team_structure : [],
      risks: Array.isArray(row.risks) ? row.risks : [],
      dependencies: Array.isArray(row.dependencies) ? row.dependencies : [],
      successMetrics: Array.isArray(row.success_metrics) ? row.success_metrics : [],
      aiGenerated: row.ai_generated || undefined,
    },
  }));
}

export async function getWorkflowById(id: string) {
  const { supabase, user } = await getSupabaseClient();

  const { data, error } = await supabase
    .from("workflows")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[getWorkflowById] Error:", error);
    throw new Error(error.message);
  }

  return data;
}