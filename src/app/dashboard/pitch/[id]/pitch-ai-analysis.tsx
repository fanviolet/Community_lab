import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

interface PitchAIAnalysisProps {
  pitchId: string;
}

export async function PitchAIAnalysis({ pitchId }: PitchAIAnalysisProps) {
  const supabase = await createClient();

  const { data: analyses, error } = await supabase
    .from("pitch_ai_analysis")
    .select("*")
    .eq("pitch_id", pitchId)
    .order("created_at", { ascending: false });

  if (error || !analyses || analyses.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="border-0 bg-gradient-to-br from-purple-50 to-blue-50 ring-1 ring-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              AI Analysis
            </CardTitle>
            <CardDescription>
              AI-powered insights and suggestions for your pitch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8">
              <Sparkles className="h-12 w-12 text-purple-300 mb-4" />
              <p className="text-sm text-muted-foreground text-center">
                Chưa có phân tích AI. Sử dụng Trợ lý AI trong quá trình tạo đề xuất để tạo thông tin chi tiết.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const typeLabels: Record<string, string> = {
    proposal_draft: "Bản dự thảo",
    proposal_improvement: "Cải thiện đề xuất",
    kpi_suggestion: "Gợi ý KPI",
    risk_analysis: "Phân tích rủi ro",
    timeline_generation: "Lộ trình thực hiện",
    budget_generation: "Ước tính ngân sách",
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-gradient-to-br from-purple-50 to-blue-50 ring-1 ring-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI Analysis
          </CardTitle>
          <CardDescription>
            Phân tích và gợi ý AI cho đề xuất của bạn
          </CardDescription>
        </CardHeader>
      </Card>

      {analyses.map((analysis: any) => (
        <Card key={analysis.id} className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {typeLabels[analysis.analysis_type] || analysis.analysis_type}
              </CardTitle>
              <Badge variant="secondary">
                {new Date(analysis.created_at).toLocaleDateString("vi-VN")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {analysis.analysis_result && typeof analysis.analysis_result === "object" ? (
              <>
                {analysis.analysis_result.markdown && (
                  <div className="prose prose-sm max-w-none mb-4">
                    <div dangerouslySetInnerHTML={{ __html: analysis.analysis_result.markdown.replace(/\n/g, "<br>") }} />
                  </div>
                )}
                {analysis.analysis_result.json && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                      Xem dữ liệu JSON
                    </summary>
                    <pre className="mt-2 p-4 bg-muted rounded-lg text-xs overflow-auto">
                      {JSON.stringify(analysis.analysis_result.json, null, 2)}
                    </pre>
                  </details>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Không có dữ liệu phân tích
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
