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
      alert("Failed to save scorecard. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{analysis.summary}</p>
          </CardContent>
        </Card>

        {analysis.problem && (
          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardHeader>
              <CardTitle>Related Problem</CardTitle>
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
              <CardTitle>Related Project</CardTitle>
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
            <CardTitle>Strengths</CardTitle>
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
              <p className="text-sm text-muted-foreground">No strengths listed</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Weaknesses</CardTitle>
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
              <p className="text-sm text-muted-foreground">No weaknesses listed</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Risks</CardTitle>
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
              <p className="text-sm text-muted-foreground">No risks listed</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
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
              <p className="text-sm text-muted-foreground">No recommendations listed</p>
            )}
          </CardContent>
        </Card>

        {analysis.impact_assessment && (
          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardHeader>
              <CardTitle>Impact Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{analysis.impact_assessment}</p>
            </CardContent>
          </Card>
        )}

        {analysis.feasibility_assessment && (
          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardHeader>
              <CardTitle>Feasibility Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{analysis.feasibility_assessment}</p>
            </CardContent>
          </Card>
        )}

        {analysis.sustainability_assessment && (
          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardHeader>
              <CardTitle>Sustainability Assessment</CardTitle>
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
              <CardTitle>Expert Scorecard</CardTitle>
              <CardDescription>
                Overall Score: {analysis.scorecard.overall_score.toFixed(1)}/10
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Impact</span>
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
                  <span>Innovation</span>
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
                  <span>Feasibility</span>
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
                  <span>Sustainability</span>
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
                  Edit Scorecard
                </Button>
              )}
            </CardContent>
          </Card>
        ) : canEdit && showScorecardForm ? (
          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardHeader>
              <CardTitle>Create Scorecard</CardTitle>
              <CardDescription>
                Rate this analysis on key metrics (1-10)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleScorecardSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="impact_score">Impact (1-10)</Label>
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
                  <Label htmlFor="innovation_score">Innovation (1-10)</Label>
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
                  <Label htmlFor="feasibility_score">Feasibility (1-10)</Label>
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
                  <Label htmlFor="sustainability_score">Sustainability (1-10)</Label>
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
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={scorecardData.notes ?? ""}
                    onChange={(e) => setScorecardData({ ...scorecardData, notes: e.target.value })}
                    rows={3}
                    placeholder="Additional notes about this scorecard"
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Scorecard"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowScorecardForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : canEdit ? (
          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Scorecard Yet</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Create a scorecard to rate this analysis.
              </p>
              <Button onClick={() => setShowScorecardForm(true)}>
                Create Scorecard
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
