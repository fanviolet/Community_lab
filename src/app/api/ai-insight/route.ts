import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase-env";
import type { AIInsight } from "@/types/ai-insight";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";

function isAIInsight(value: unknown): value is AIInsight {
     if (typeof value !== "object" || value === null) return false;

     const insight = value as Record<string, unknown>;
     const isStringArray = (item: unknown): item is string[] =>
          Array.isArray(item) && item.every((entry) => typeof entry === "string");

     return (
          typeof insight.rootCause === "string" &&
          typeof insight.impact === "string" &&
          isStringArray(insight.suggestions) &&
          (insight.urgency === "low" ||
               insight.urgency === "medium" ||
               insight.urgency === "high") &&
          isStringArray(insight.tags)
     );
}

function extractInsightFromResponse(responseBody: unknown): AIInsight | null {
     if (typeof responseBody !== "object" || responseBody === null) return null;

     const body = responseBody as Record<string, unknown>;
     const choices = body.choices;

     if (!Array.isArray(choices) || choices.length === 0) return null;

     const message = (choices[0] as Record<string, unknown>).message;
     if (typeof message !== "object" || message === null) return null;

     const content = (message as Record<string, unknown>).content;
     if (typeof content !== "string") return null;

     try {
          const parsed = JSON.parse(content);
          if (isAIInsight(parsed)) return parsed;
     } catch {
          return null;
     }

     return null;
}

function buildPrompt(params: {
     title: string;
     description: string;
     category: string;
     voteCount: number;
     commentCount: number;
}) {
     return `You are an AI assistant helping a student community platform analyze problems submitted by users.

Analyze this community problem and return a JSON object with exactly this structure:
{
  "rootCause": "One sentence describing the core root cause",
  "impact": "One sentence on who is affected and how",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "urgency": "low" | "medium" | "high",
  "tags": ["tag1", "tag2", "tag3"]
}

Problem Title: ${params.title}
Category: ${params.category}
Description: ${params.description}
Community votes: ${params.voteCount}
Number of comments: ${params.commentCount}

Return ONLY valid JSON. No explanation, no markdown.`;
}

export async function POST(request: Request) {
     if (!isSupabaseConfigured()) {
          return NextResponse.json(
               { error: "Supabase environment is not configured." },
               { status: 500 }
          );
     }

     const body = await request.json().catch(() => null);
     const problemId =
          typeof body?.problemId === "string" ? body.problemId : null;

     if (!problemId) {
          return NextResponse.json(
               { error: "Missing problemId in request body." },
               { status: 400 }
          );
     }

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
               { error: "Authentication required to generate AI insight." },
               { status: 401 }
          );
     }

     const { data: problem, error: problemError } = await supabase
          .from("problems")
          .select("id, title, description, category, ai_summary")
          .eq("id", problemId)
          .single();

     if (problemError || !problem) {
          return NextResponse.json({ error: "Problem not found." }, { status: 404 });
     }

     // Return cached summary if exists
     if (problem.ai_summary) {
          try {
               const cachedInsight = JSON.parse(problem.ai_summary);
               if (isAIInsight(cachedInsight)) {
                    return NextResponse.json({ insight: cachedInsight });
               }
          } catch {
               // Cache malformed, regenerate below
          }
     }

     const { count: voteCount } = await supabase
          .from("problem_votes")
          .select("*", { count: "exact", head: true })
          .eq("problem_id", problemId);

     const { count: commentCount } = await supabase
          .from("problem_comments")
          .select("*", { count: "exact", head: true })
          .eq("problem_id", problemId);

     const prompt = buildPrompt({
          title: problem.title,
          category: problem.category ?? "Unknown",
          description: problem.description ?? "",
          voteCount: voteCount ?? 0,
          commentCount: commentCount ?? 0,
     });

     const groqApiKey = process.env.GROQ_API_KEY;

     if (!groqApiKey) {
          return NextResponse.json(
               { error: "GROQ_API_KEY is not configured." },
               { status: 500 }
          );
     }

     const groqResponse = await fetch(GROQ_ENDPOINT, {
          method: "POST",
          headers: {
               Authorization: `Bearer ${groqApiKey}`,
               "Content-Type": "application/json",
          },
          body: JSON.stringify({
               model: GROQ_MODEL,
               messages: [{ role: "user", content: prompt }],
               response_format: { type: "json_object" },
               max_tokens: 500,
               temperature: 0.2,
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
     const insight = extractInsightFromResponse(groqBody);

     if (!insight) {
          return NextResponse.json(
               { error: "Groq returned an invalid AI insight payload." },
               { status: 502 }
          );
     }

     const { error: updateError } = await supabase
          .from("problems")
          .update({
               ai_summary: JSON.stringify(insight),
               ai_generated_at: new Date().toISOString(),
          })
          .eq("id", problemId);

     if (updateError) {
          return NextResponse.json(
               { error: "Unable to cache AI insight in the database." },
               { status: 500 }
          );
     }

     return NextResponse.json({ insight });
}