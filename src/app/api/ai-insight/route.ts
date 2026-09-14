import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase-env";
import { generateGeminiText } from "@/lib/ai/gemini";
import { VIETNAMESE_SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import { createAuthenticatedContext, hasPermission } from "@/lib/rbac";
import { forbiddenResponse, getProfileRole } from "@/lib/rbac-server";
import type { AIInsight } from "@/types/ai-insight";

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

function extractInsightFromContent(content: string): AIInsight | null {
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
     return `${VIETNAMESE_SYSTEM_PROMPT}

Phân tích vấn đề cộng đồng này và trả về một đối tượng JSON với cấu trúc chính xác như sau:
{
  "rootCause": "Một câu mô tả nguyên nhân gốc rễ",
  "impact": "Một câu về ai bị ảnh hưởng và như thế nào",
  "suggestions": ["gợi ý 1", "gợi ý 2", "gợi ý 3"],
  "urgency": "low" | "medium" | "high",
  "tags": ["tag1", "tag2", "tag3"]
}

Tiêu đề vấn đề: ${params.title}
Danh mục: ${params.category}
Mô tả: ${params.description}
Lượt bình chọn cộng đồng: ${params.voteCount}
Số lượng bình luận: ${params.commentCount}

Chỉ trả về JSON hợp lệ. Không giải thích, không markdown.`;
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

     const role = await getProfileRole(supabase, user.id);
     const rbacCtx = createAuthenticatedContext(role, user.id);
     const regenerate = body?.regenerate === true;

     if (!hasPermission(rbacCtx, regenerate ? "insight.regenerate" : "insight.generate")) {
          return forbiddenResponse("You do not have permission to generate AI insights.");
     }

     const { data: problem, error: problemError } = await supabase
          .from("problems")
          .select("id, title, description, category, ai_summary")
          .eq("id", problemId)
          .single();

     if (problemError || !problem) {
          return NextResponse.json({ error: "Problem not found." }, { status: 404 });
     }

     // Return cached summary unless an explicit regenerate was requested
     if (!regenerate && problem.ai_summary) {
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

     const geminiResult = await generateGeminiText({
          prompt,
          json: true,
          maxOutputTokens: 1024,
          temperature: 0.2,
     });

     if (!geminiResult.ok) {
          return NextResponse.json(
               { error: geminiResult.error },
               { status: geminiResult.status }
          );
     }

     const insight = extractInsightFromContent(geminiResult.text);

     if (!insight) {
          return NextResponse.json(
               { error: "Gemini returned an invalid AI insight payload." },
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