import { NextResponse } from "next/server";
import {
  buildWorkflowGenerationPrompt,
  validateAIWorkflowResponse,
  type ProjectContext,
  type AIWorkflowResult,
} from "@/lib/workflow-ai-generator";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase-env";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isFeatureEnabled, getDisabledFeatureMessage } from "@/lib/feature-flags";
import { generateGeminiText } from "@/lib/ai/gemini";

interface WorkflowAIRequest {
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
  // NEW: Structured planning fields (note: teamSize already exists above)
  domain?: string;
  projectType?: string;
  experienceLevel?: string;
  budgetRange?: string;
  durationDays?: number;
  mainGoal?: string;
  deliverables?: string[];
  targetAudience?: string[];
  successMetrics?: Array<{ metric: string; target: number }>;
}

/**
 * Build ProjectContext from request data
 */
function buildProjectContext(data: WorkflowAIRequest): ProjectContext {
  return {
    title: data.projectTitle,
    description: data.projectDescription,
    status: "planning",
    startDate: data.startDate || null,
    endDate: data.endDate || null,
    existingTasks: (data.existingTasks || []).map((task) => ({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
    })),
    members: (data.members || []).map((m) => ({
      userId: "",
      name: m.name,
      email: m.email,
      role: m.role,
    })),
    recentActivities: (data.recentActivities || []).map((a) => ({
      action: a.action,
      description: a.description,
      createdAt: a.createdAt,
    })),
    pitchContent: data.pitchContent,
    pitchAIAnalysis: data.pitchAIAnalysis,
    // NEW: Pass structured planning fields through to prompt
    domain: data.domain,
    project_type: data.projectType,
    team_size: data.teamSize,
    experience_level: data.experienceLevel,
    budget_range: data.budgetRange,
    duration_days: data.durationDays,
    main_goal: data.mainGoal,
    deliverables: data.deliverables,
    target_audience: data.targetAudience,
    success_metrics: data.successMetrics,
  };
}

/**
 * Parse JSON response from AI, handling common formatting issues
 */
function parseAIResponse(content: string): any {
  // Try to extract JSON from markdown code blocks
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : content;

  try {
    return JSON.parse(jsonStr);
  } catch {
    // Try to fix common JSON issues
    const fixed = jsonStr
      .replace(/,\s*}/g, "}") // Remove trailing commas
      .replace(/,\s*]/g, "]")
      .replace(/'/g, '"') // Replace single quotes with double
      .replace(/(\w+):/g, '"$1":'); // Add quotes to keys

    try {
      return JSON.parse(fixed);
    } catch {
      return null;
    }
  }
}

export async function POST(request: Request) {
  // Feature flag check
  if (!isFeatureEnabled("AI_WORKFLOW_GENERATION")) {
    return NextResponse.json(
      { error: getDisabledFeatureMessage("AI_WORKFLOW_GENERATION") },
      { status: 403 }
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase environment is not configured." },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null) as WorkflowAIRequest;

  if (!body || !body.projectTitle || !body.projectDescription) {
    return NextResponse.json(
      { error: "Missing projectTitle or projectDescription in request body." },
      { status: 400 }
    );
  }

  // Authentication check
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Authentication required to generate AI workflow." },
      { status: 401 }
    );
  }

  // Build project context and prompt
  const projectContext = buildProjectContext(body);
  const prompt = buildWorkflowGenerationPrompt(projectContext);

  try {
    const geminiResult = await generateGeminiText({
      prompt,
      systemInstruction: "You are a helpful AI assistant. Always respond in Vietnamese.",
      json: true,
      maxOutputTokens: 8000,
      temperature: 0.7,
    });

    if (!geminiResult.ok) {
      return NextResponse.json(
        { error: geminiResult.error },
        { status: geminiResult.status }
      );
    }

    const content = geminiResult.text;

    // Parse the response
    const parsed = parseAIResponse(content);

    if (!parsed) {
      return NextResponse.json(
        { error: "Failed to parse AI response as JSON. Please try again." },
        { status: 500 }
      );
    }

    // Define validation requirements
    const validationRequirements = {
      minPhases: 4,
      minTasks: 10,
      minMilestones: 4,
      minRisks: 3,
      minSuccessMetrics: 3,
      minDeliverables: 2,
    };

    // Validate the response structure
    const validation = validateAIWorkflowResponse(parsed, validationRequirements);

    if (!validation.valid) {
      console.error("[workflow-ai] Validation errors:", validation.errors);
      return NextResponse.json(
        { 
          error: "AI generated invalid workflow structure.",
          details: validation.errors 
        },
        { status: 500 }
      );
    }

    // Convert to our internal format
    const result: AIWorkflowResult = validation.sanitized as AIWorkflowResult;

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error in workflow AI:", error);
    return NextResponse.json(
      { error: "Failed to generate AI workflow." },
      { status: 500 }
    );
  }
}