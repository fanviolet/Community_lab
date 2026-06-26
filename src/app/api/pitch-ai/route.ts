import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase-env";
import { VIETNAMESE_SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import { createAuthenticatedContext, hasPermission } from "@/lib/rbac";
import { forbiddenResponse, getProfileRole } from "@/lib/rbac-server";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";

interface PitchAIRequest {
  pitchId: string;
  type: "draft" | "improve" | "kpis" | "risks" | "timeline" | "budget";
  formData?: Record<string, unknown>;
}

interface PitchAIResponse {
  markdown: string;
  json: Record<string, unknown>;
}

function buildPrompt(type: string, data: Record<string, unknown>): string {
  const basePrompt = `${VIETNAMESE_SYSTEM_PROMPT}

Bạn là một chuyên gia tư vấn dự án cộng đồng tại Việt Nam. Hãy phân tích đề xuất dự án này và cung cấp thông tin chi tiết bằng tiếng Việt.

`;

  switch (type) {
    case "draft":
      return `${basePrompt}
Hãy viết bản dự thảo đề xuất dự án hoàn chỉnh dựa trên thông tin sau:

Tiêu đề: ${data.title || "Chưa có"}
Mô tả: ${data.description || "Chưa có"}
Tóm tắt dự án: ${data.project_summary || "Chưa có"}
Khán giả mục tiêu: ${data.target_audience || "Chưa có"}

Yêu cầu:
- Viết bằng tiếng Việt, ngắn gọn, dễ hiểu cho người không chuyên
- Cấu trúc rõ ràng với các phần: Vấn đề, Giải pháp, Tác động, Kế hoạch thực hiện
- Trả về JSON với cấu trúc:
{
  "markdown": "Nội dung đề xuất đầy đủ bằng markdown",
  "json": {
    "problem_statement": "Câu mô tả vấn đề",
    "solution": "Mô tả giải pháp",
    "impact": "Tác động dự kiến",
    "implementation": "Kế hoạch thực hiện tóm tắt"
  }
}`;

    case "improve":
      return `${basePrompt}
Hãy cải thiện đề xuất dự án sau:

Tiêu đề: ${data.title || "Chưa có"}
Mô tả hiện tại: ${data.description || "Chưa có"}
Tóm tắt dự án: ${data.project_summary || "Chưa có"}
Vấn đề: ${data.problem_statement || "Chưa có"}
Giải pháp: ${data.solution_description || "Chưa có"}

Yêu cầu:
- Cung cấp gợi ý cải thiện cụ thể
- Nhấn mạnh các điểm mạnh và đề xuất khắc phục điểm yếu
- Trả về JSON với cấu trúc:
{
  "markdown": "Phân tích cải thiện bằng markdown",
  "json": {
    "strengths": ["điểm mạnh 1", "điểm mạnh 2"],
    "weaknesses": ["điểm yếu 1", "điểm yếu 2"],
    "suggestions": ["gợi ý 1", "gợi ý 2"],
    "improved_summary": "Tóm tắt cải thiện"
  }
}`;

    case "kpis":
      return `${basePrompt}
Hãy đề xuất các chỉ số hiệu quả chính (KPIs) cho dự án sau:

Tiêu đề: ${data.title || "Chưa có"}
Tóm tắt dự án: ${data.project_summary || "Chưa có"}
Tác động dự kiến: ${data.expected_impact || "Chưa có"}
Mục tiêu hiện tại: ${Array.isArray(data.key_objectives) ? data.key_objectives.join(", ") : "Chưa có"}

Yêu cầu:
- Đề xuất 5-8 KPIs cụ thể, có thể đo lường
- Mỗi KPI bao gồm: tên, đơn vị đo, mục tiêu, cách đo lường
- Trả về JSON với cấu trúc:
{
  "markdown": "Danh sách KPIs bằng markdown",
  "json": {
    "kpis": [
      {
        "name": "Tên KPI",
        "unit": "Đơn vị đo",
        "target": "Mục tiêu",
        "measurement": "Cách đo lường"
      }
    ]
  }
}`;

    case "risks":
      return `${basePrompt}
Hãy phân tích rủi ro cho dự án sau:

Tiêu đề: ${data.title || "Chưa có"}
Tóm tắt dự án: ${data.project_summary || "Chưa có"}
Kế hoạch thực hiện: ${data.implementation_plan || "Chưa có"}
Nguồn lực cần thiết: ${Array.isArray(data.resource_requirements) ? data.resource_requirements.join(", ") : "Chưa có"}

Yêu cầu:
- Xác định 5-7 rủi ro chính
- Mỗi rủi ro bao gồm: mô tả, mức độ (thấp/trung bình/cao), biện pháp giảm thiểu
- Trả về JSON với cấu trúc:
{
  "markdown": "Phân tích rủi ro bằng markdown",
  "json": {
    "risks": [
      {
        "description": "Mô tả rủi ro",
        "level": "thấp|trung bình|cao",
        "mitigation": "Biện pháp giảm thiểu"
      }
    ]
  }
}`;

    case "timeline":
      return `${basePrompt}
Hãy đề xuất lộ trình thực hiện cho dự án sau:

Tiêu đề: ${data.title || "Chưa có"}
Tóm tắt dự án: ${data.project_summary || "Chưa có"}
Kế hoạch thực hiện: ${data.implementation_plan || "Chưa có"}

Yêu cầu:
- Đề xuất lộ trình với các giai đoạn chính
- Mỗi giai đoạn bao gồm: tên, thời gian, đầu ra
- Trả về JSON với cấu trúc:
{
  "markdown": "Lộ trình thực hiện bằng markdown",
  "json": {
    "phases": [
      {
        "name": "Tên giai đoạn",
        "duration": "Thời gian",
        "deliverables": ["đầu ra 1", "đầu ra 2"]
      }
    ]
  }
}`;

    case "budget":
      return `${basePrompt}
Hãy ước tính ngân sách cho dự án sau:

Tiêu đề: ${data.title || "Chưa có"}
Tóm tắt dự án: ${data.project_summary || "Chưa có"}
Kế hoạch thực hiện: ${data.implementation_plan || "Chưa có"}
Nguồn lực cần thiết: ${Array.isArray(data.resource_requirements) ? data.resource_requirements.join(", ") : "Chưa có"}

Yêu cầu:
- Ước tính ngân sách theo các danh mục chính
- Mỗi danh mục bao gồm: tên, ước tính, ghi chú
- Trả về JSON với cấu trúc:
{
  "markdown": "Ước tính ngân sách bằng markdown",
  "json": {
    "categories": [
      {
        "name": "Tên danh mục",
        "estimate": "Ước tính",
        "notes": "Ghi chú"
      }
    ],
    "total_estimate": "Tổng ước tính"
  }
}`;

    default:
      return basePrompt;
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase environment is not configured." },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null) as PitchAIRequest;

  if (!body || !body.pitchId || !body.type) {
    return NextResponse.json(
      { error: "Missing pitchId or type in request body." },
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
      { error: "Authentication required to generate AI assistance." },
      { status: 401 }
    );
  }

  const role = await getProfileRole(supabase, user.id);
  const rbacCtx = createAuthenticatedContext(role, user.id);

  if (!hasPermission(rbacCtx, "pitch.view")) {
    return forbiddenResponse("You do not have permission to use AI assistance.");
  }

  // Get pitch data
  const { data: pitch, error: pitchError } = await supabase
    .from("pitches")
    .select(`
      *,
      pitch_content (*)
    `)
    .eq("id", body.pitchId)
    .single();

  if (pitchError || !pitch) {
    return NextResponse.json({ error: "Không tìm thấy đề xuất." }, { status: 404 });
  }

  // Check if user owns the pitch or has permission
  if (pitch.created_by !== user.id && role !== "admin" && role !== "leader") {
    return NextResponse.json(
      { error: "You do not have permission to access this pitch." },
      { status: 403 }
    );
  }

  // Combine pitch data with form data
  const content = pitch.pitch_content?.[0] || {};
  const data = {
    title: pitch.title,
    description: pitch.description,
    ...content,
    ...body.formData,
  };

  const prompt = buildPrompt(body.type, data);

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
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 2000,
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

    const parsed = JSON.parse(content) as PitchAIResponse;

    // Store AI analysis in database
    const { error: insertError } = await supabase
      .from("pitch_ai_analysis")
      .insert({
        pitch_id: body.pitchId,
        analysis_type: body.type === "draft" ? "proposal_draft" :
                     body.type === "improve" ? "proposal_improvement" :
                     body.type === "kpis" ? "kpi_suggestion" :
                     body.type === "risks" ? "risk_analysis" :
                     body.type === "timeline" ? "timeline_generation" :
                     "budget_generation",
        analysis_result: parsed,
      });

    if (insertError) {
      console.error("Error storing AI analysis:", insertError);
    }

    return NextResponse.json({ result: parsed });
  } catch (error) {
    console.error("Error in pitch AI:", error);
    return NextResponse.json(
      { error: "Failed to generate AI assistance." },
      { status: 500 }
    );
  }
}
