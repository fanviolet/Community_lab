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

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";

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

  const groqApiKey = process.env.GROQ_API_KEY;

  if (!groqApiKey) {
    return NextResponse.json(
      { error: "GROQ_API_KEY is not configured." },
      { status: 500 }
    );
  }

  try {
    const groqResponse = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: "You are a helpful AI assistant. Always respond in Vietnamese." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: 8000,
        temperature: 0.7,
      }),
    });

    if (!groqResponse.ok) {
      const text = await groqResponse.text();
      return NextResponse.json(
        { error: `Groq request failed: ${groqResponse.statusText || text}` },
        { status: 502 }
      );
    }

    const groqBody = await groqResponse.json().catch(() => null);

    if (!groqBody || !groqBody.choices || !groqBody.choices[0]) {
      return NextResponse.json(
        { error: "Groq returned an invalid response." },
        { status: 502 }
      );
    }

    const content = groqBody.choices[0].message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Groq returned empty content." },
        { status: 502 }
      );
    }

    // Parse the response
    const parsed = parseAIResponse(content);

    if (!parsed) {
      return NextResponse.json(
        { error: "Failed to parse AI response as JSON. Please try again." },
        { status: 500 }
      );
    }

    // Validate the response structure
    const validation = validateAIWorkflowResponse(parsed);

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