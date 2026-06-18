"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { ExpertAnalysisWithRelations } from "@/types/expert-analysis";
import { createScorecard, updateScorecard } from "../actions";

interface AnalysisDetailProps {
  analysis: ExpertAnalysisWithRelations;
  canEdit: boolean;
}

export function AnalysisDetail({ analysis, canEdit }: AnalysisDetailProps) {
  const [showScorecardForm, setShowScorecardForm] = useState(!analysis.scorecard && canEdit);
  const [scorecardData, setScorecardData] = useState(
    analysis.scorecard || {
      impact_score: 5,
      innovation_score: 5,
      feasibility_score: 5,
      sustainability_score: 5,
      notes: "",
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleScorecardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (analysis.scorecard) {
        await updateScorecard(analysis.scorecard.id, scorecardData);
      } else {
        await createScorecard({
          analysis_id: analysis.id,
          ...scorecardData,
        });
      }
      setShowScorecardForm(false);
      window.location.reload();
    } catch (error) {
      console.error("Failed to save scorecard:", error);
      alert("Không thể lưu bảng đánh giá. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Tóm tắt</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{analysis.summary}</p>
          </CardContent>
        </Card>

        {analysis.problem && (
          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardHeader>
              <CardTitle>Vấn đề liên quan</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="link" asChild className="p-0 h-auto">
                <a href={`/dashboard/problems/${analysis.problem.id}`}>
                  {analysis.problem.title}
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        {analysis.project && (
          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardHeader>
              <CardTitle>Dự án liên quan</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="link" asChild className="p-0 h-auto">
                <a href={`/dashboard/workspace/${analysis.project.id}`}>
                  {analysis.project.title}
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Điểm mạnh</CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.strengths.length > 0 ? (
              <ul className="space-y-2">
                {analysis.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có điểm mạnh nào</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Điểm yếu</CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.weaknesses.length > 0 ? (
              <ul className="space-y-2">
                {analysis.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <TrendingDown className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có điểm yếu nào</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Rủi ro</CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.risks.length > 0 ? (
              <ul className="space-y-2">
                {analysis.risks.map((risk, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có rủi ro nào</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Khuyến nghị</CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.recommendations.length > 0 ? (
              <ul className="space-y-2">
                {analysis.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Chưa có khuyến nghị nào</p>
            )}
          </CardContent>
        </Card>

        {analysis.impact_assessment && (
          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardHeader>
              <CardTitle>Đánh giá tác động</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{analysis.impact_assessment}</p>
            </CardContent>
          </Card>
        )}

        {analysis.feasibility_assessment && (
          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardHeader>
              <CardTitle>Đánh giá tính khả thi</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{analysis.feasibility_assessment}</p>
            </CardContent>
          </Card>
        )}

        {analysis.sustainability_assessment && (
          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardHeader>
              <CardTitle>Đánh giá tính bền vững</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{analysis.sustainability_assessment}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-6">
        {analysis.scorecard ? (
          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardHeader>
              <CardTitle>Bảng đánh giá chuyên gia</CardTitle>
              <CardDescription>
                Điểm tổng hợp: {analysis.scorecard.overall_score.toFixed(1)}/10
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tác động</span>
                  <span className="font-medium">{analysis.scorecard.impact_score}/10</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all"
                    style={{ width: `${analysis.scorecard.impact_score * 10}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Đổi mới</span>
                  <span className="font-medium">{analysis.scorecard.innovation_score}/10</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-600 transition-all"
                    style={{ width: `${analysis.scorecard.innovation_score * 10}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tính khả thi</span>
                  <span className="font-medium">{analysis.scorecard.feasibility_score}/10</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-600 transition-all"
                    style={{ width: `${analysis.scorecard.feasibility_score * 10}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tính bền vững</span>
                  <span className="font-medium">{analysis.scorecard.sustainability_score}/10</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-600 transition-all"
                    style={{ width: `${analysis.scorecard.sustainability_score * 10}%` }}
                  />
                </div>
              </div>

              {analysis.scorecard.notes && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">{analysis.scorecard.notes}</p>
                </div>
              )}

              {canEdit && (
                <Button variant="outline" className="w-full" onClick={() => setShowScorecardForm(true)}>
                  Chỉnh sửa bảng đánh giá
                </Button>
              )}
            </CardContent>
          </Card>
        ) : canEdit && showScorecardForm ? (
          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardHeader>
              <CardTitle>Tạo bảng đánh giá</CardTitle>
              <CardDescription>
                Đánh giá phân tích này theo các chỉ số chính (1-10)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleScorecardSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="impact_score">Tác động (1-10)</Label>
                  <Input
                    id="impact_score"
                    type="number"
                    min="1"
                    max="10"
                    value={scorecardData.impact_score}
                    onChange={(e) =>
                      setScorecardData({
                        ...scorecardData,
                        impact_score: parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="innovation_score">Đổi mới (1-10)</Label>
                  <Input
                    id="innovation_score"
                    type="number"
                    min="1"
                    max="10"
                    value={scorecardData.innovation_score}
                    onChange={(e) =>
                      setScorecardData({
                        ...scorecardData,
                        innovation_score: parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feasibility_score">Tính khả thi (1-10)</Label>
                  <Input
                    id="feasibility_score"
                    type="number"
                    min="1"
                    max="10"
                    value={scorecardData.feasibility_score}
                    onChange={(e) =>
                      setScorecardData({
                        ...scorecardData,
                        feasibility_score: parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sustainability_score">Tính bền vững (1-10)</Label>
                  <Input
                    id="sustainability_score"
                    type="number"
                    min="1"
                    max="10"
                    value={scorecardData.sustainability_score}
                    onChange={(e) =>
                      setScorecardData({
                        ...scorecardData,
                        sustainability_score: parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Ghi chú</Label>
                  <Textarea
                    id="notes"
                    value={scorecardData.notes ?? ""}
                    onChange={(e) => setScorecardData({ ...scorecardData, notes: e.target.value })}
                    rows={3}
                    placeholder="Ghi chú thêm về bảng đánh giá này"
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Đang lưu..." : "Lưu bảng đánh giá"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowScorecardForm(false)}
                  >
                    Hủy
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : canEdit ? (
          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Chưa có bảng đánh giá</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Tạo bảng đánh giá để đánh giá phân tích này.
              </p>
              <Button onClick={() => setShowScorecardForm(true)}>
                Tạo bảng đánh giá
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
