"use client";

import { useState, useTransition } from "react";
import { 
  BarChart3, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Users, 
  AlertTriangle, 
  Lightbulb, 
  TrendingUp,
  Download,
  FileText,
  Presentation,
  History,
  Sparkles
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { 
  GeneratedReport, 
  ReportType,
  generateProjectReport,
  getProjectReports,
  getSavedReport,
  deleteReport
} from "@/app/dashboard/workspace/[id]/report-actions";

interface ProjectReportProps {
  projectId: string;
  isLeader: boolean;
  generateReport: typeof generateProjectReport;
  getReports: typeof getProjectReports;
  getReport: typeof getSavedReport;
  deleteReport: typeof deleteReport;
}

export default function ProjectReport({
  projectId,
  isLeader,
  generateReport,
  getReports,
  getReport,
  deleteReport,
}: ProjectReportProps) {
  const [isPending, startTransition] = useTransition();
  const [reportType, setReportType] = useState<ReportType>("weekly");
  const [currentReport, setCurrentReport] = useState<GeneratedReport | null>(null);
  const [reportHistory, setReportHistory] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"generate" | "view" | "history">("generate");
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = () => {
    setError(null);
    startTransition(async () => {
      try {
        const report = await generateReport({
          projectId,
          reportType,
        });
        setCurrentReport(report);
        setViewMode("view");
        // Refresh history
        const history = await getReports(projectId);
        setReportHistory(history);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to generate report");
      }
    });
  };

  const handleViewHistory = () => {
    startTransition(async () => {
      try {
        const history = await getReports(projectId);
        setReportHistory(history);
        setViewMode("history");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load report history");
      }
    });
  };

  const handleLoadReport = (reportId: string) => {
    startTransition(async () => {
      try {
        const report = await getReport(reportId);
        setCurrentReport(report);
        setViewMode("view");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load report");
      }
    });
  };

  const handleDeleteReport = (reportId: string) => {
    startTransition(async () => {
      try {
        await deleteReport(reportId, projectId);
        // Refresh history
        const history = await getReports(projectId);
        setReportHistory(history);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete report");
      }
    });
  };

  const exportReport = (format: "pdf" | "docx" | "presentation") => {
    if (!currentReport) return;

    const content = generateExportContent(currentReport, format);
    const filename = `${currentReport.project.title.replace(/\s+/g, "-").toLowerCase()}-${currentReport.period.startDate}`;
    
    const blob = new Blob([content], { 
      type: format === "presentation" ? "text/plain" : "text/html" 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.${format === "pdf" ? "html" : format === "docx" ? "html" : "txt"}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const generateExportContent = (report: GeneratedReport, format: string) => {
    if (format === "presentation") {
      return [
        `${report.project.title} - Presentation Summary`,
        `${report.period.label}: ${report.period.startDate} to ${report.period.endDate}`,
        "",
        "Slide 1: Executive Summary",
        report.executiveSummary,
        "",
        "Slide 2: Project Health",
        `Health Score: ${report.healthScore.score}/100 (${report.healthScore.category})`,
        report.healthScore.explanation,
        "",
        "Slide 3: Key Metrics",
        `Completion Rate: ${report.metrics.completionRate}%`,
        `Total Tasks: ${report.metrics.totalTasks}`,
        `Completed: ${report.metrics.completedTasks}`,
        `Overdue: ${report.metrics.overdueTasks}`,
        `Task Velocity: ${report.metrics.taskVelocity.toFixed(1)}/week`,
        "",
        "Slide 4: Achievements",
        ...report.achievements.slice(0, 5).map((a: any) => `- ${a.title}: ${a.description}`),
        "",
        "Slide 5: Challenges",
        ...report.challenges.slice(0, 5).map((c: any) => `- ${c.title}: ${c.description}`),
        "",
        "Slide 6: Recommendations",
        ...report.recommendations.slice(0, 5).map((r: any) => `- ${r.title}: ${r.description}`),
      ].join("\n");
    }

    // HTML for PDF/DOCX
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${report.project.title} - ${report.period.label}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #333; line-height: 1.6; }
    h1 { color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
    h2 { color: #334155; margin-top: 30px; }
    .header { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
    .metric { display: inline-block; margin: 10px 20px 10px 0; }
    .metric-value { font-size: 32px; font-weight: bold; color: #3b82f6; }
    .metric-label { font-size: 14px; color: #64748b; }
    .health-score { background: ${report.healthScore.score >= 70 ? '#dcfce7' : report.healthScore.score >= 50 ? '#fef9c3' : '#fee2e2'}; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .achievement, .challenge, .recommendation { background: #f8fafc; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #3b82f6; }
    .challenge { border-left-color: #f59e0b; }
    .recommendation { border-left-color: #10b981; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
    .badge-high { background: #fee2e2; color: #dc2626; }
    .badge-medium { background: #fef3c7; color: #d97706; }
    .badge-low { background: #dcfce7; color: #16a34a; }
  </style>
</head>
<body>
  <h1>${report.project.title}</h1>
  
  <div class="header">
    <p><strong>Report Type:</strong> ${report.period.label}</p>
    <p><strong>Period:</strong> ${report.period.startDate} to ${report.period.endDate}</p>
    <p><strong>Generated:</strong> ${new Date(report.generatedAt).toLocaleDateString()}</p>
  </div>

  <h2>Executive Summary</h2>
  <p>${report.executiveSummary}</p>

  <div class="health-score">
    <h3>Project Health Score: ${report.healthScore.score}/100 - ${report.healthScore.category}</h3>
    <p>${report.healthScore.explanation}</p>
  </div>

  <h2>Key Metrics</h2>
  <div class="metric">
    <div class="metric-value">${report.metrics.completionRate}%</div>
    <div class="metric-label">Completion Rate</div>
  </div>
  <div class="metric">
    <div class="metric-value">${report.metrics.totalTasks}</div>
    <div class="metric-label">Total Tasks</div>
  </div>
  <div class="metric">
    <div class="metric-value">${report.metrics.completedTasks}</div>
    <div class="metric-label">Completed</div>
  </div>
  <div class="metric">
    <div class="metric-value">${report.metrics.overdueTasks}</div>
    <div class="metric-label">Overdue</div>
  </div>
  <div class="metric">
    <div class="metric-value">${report.metrics.taskVelocity.toFixed(1)}</div>
    <div class="metric-label">Tasks/Week</div>
  </div>
  <div class="metric">
    <div class="metric-value">${(report.metrics.activeMemberRatio * 100).toFixed(0)}%</div>
    <div class="metric-label">Active Members</div>
  </div>

  <h2>Key Achievements</h2>
  ${report.achievements.map((a: any) => `
    <div class="achievement">
      <strong>${a.title}</strong><br>
      ${a.description}<br>
      <small>${a.date ? new Date(a.date).toLocaleDateString() : 'No date'}</small>
    </div>
  `).join('')}

  <h2>Challenges</h2>
  ${report.challenges.map((c: any) => `
    <div class="challenge">
      <strong>${c.title}</strong> <span class="badge badge-${c.severity}">${c.severity}</span><br>
      ${c.description}
    </div>
  `).join('')}

  <h2>Recommendations</h2>
  ${report.recommendations.map((r: any) => `
    <div class="recommendation">
      <strong>${r.title}</strong> <span class="badge badge-${r.priority}">${r.priority}</span><br>
      ${r.description}
    </div>
  `).join('')}
</body>
</html>`;
  };

  if (viewMode === "history") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Report History</h2>
            <p className="text-sm text-muted-foreground">View previously generated reports</p>
          </div>
          <Button variant="outline" onClick={() => setViewMode("generate")}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate New Report
          </Button>
        </div>

        {reportHistory.length === 0 ? (
          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardContent className="py-12 text-center">
              <History className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No reports generated yet</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardContent className="p-6">
              <div className="space-y-3">
                {reportHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{item.reportType}</Badge>
                        <span className="font-medium">
                          {new Date(item.periodStart).toLocaleDateString()} - {new Date(item.periodEnd).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Generated {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLoadReport(item.id)}
                      >
                        View
                      </Button>
                      {isLeader && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteReport(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  if (viewMode === "view" && currentReport) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">{currentReport.period.label}</h2>
            <p className="text-sm text-muted-foreground">
              {currentReport.period.startDate} to {currentReport.period.endDate}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setViewMode("generate")}>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate New
            </Button>
            <Button variant="outline" onClick={handleViewHistory}>
              <History className="mr-2 h-4 w-4" />
              History
            </Button>
          </div>
        </div>

        {/* Executive Summary */}
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Executive Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {currentReport.executiveSummary}
            </p>
          </CardContent>
        </Card>

        {/* Health Score */}
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Project Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`rounded-lg p-6 ${
              currentReport.healthScore.score >= 70 ? 'bg-emerald-50 border border-emerald-200' :
              currentReport.healthScore.score >= 50 ? 'bg-amber-50 border border-amber-200' :
              'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-4xl font-bold">
                    {currentReport.healthScore.score}/100
                  </p>
                  <Badge className={
                    currentReport.healthScore.score >= 70 ? 'bg-emerald-100 text-emerald-700' :
                    currentReport.healthScore.score >= 50 ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }>
                    {currentReport.healthScore.category}
                  </Badge>
                </div>
                <TrendingUp className="h-12 w-12 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {currentReport.healthScore.explanation}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KPI Metrics */}
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Key Performance Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                </div>
                <p className="text-2xl font-bold">{currentReport.metrics.totalTasks}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                </div>
                <p className="text-2xl font-bold">{currentReport.metrics.completedTasks}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                </div>
                <p className="text-2xl font-bold">{currentReport.metrics.overdueTasks}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="h-5 w-5 text-violet-600" />
                  <p className="text-sm font-medium text-muted-foreground">Active Ratio</p>
                </div>
                <p className="text-2xl font-bold">{(currentReport.metrics.activeMemberRatio * 100).toFixed(0)}%</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Completion Rate</span>
                  <span className="font-medium">{currentReport.metrics.completionRate}%</span>
                </div>
                <Progress value={currentReport.metrics.completionRate} className="h-3" />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Task Velocity (tasks/week)</span>
                  <span className="font-medium">{currentReport.metrics.taskVelocity.toFixed(1)}</span>
                </div>
                <Progress value={Math.min(currentReport.metrics.taskVelocity * 20, 100)} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements and Challenges */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardHeader>
              <CardTitle>Key Achievements</CardTitle>
              <CardDescription>Completed work and milestones</CardDescription>
            </CardHeader>
            <CardContent>
              {currentReport.achievements.length === 0 ? (
                <p className="text-sm text-muted-foreground">No achievements recorded</p>
              ) : (
                <div className="space-y-3">
                  {currentReport.achievements.map((achievement) => (
                    <div key={achievement.id} className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{achievement.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {achievement.description}
                        </p>
                        {achievement.date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(achievement.date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardHeader>
              <CardTitle>Challenges</CardTitle>
              <CardDescription>Issues requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              {currentReport.challenges.length === 0 ? (
                <p className="text-sm text-muted-foreground">No challenges detected</p>
              ) : (
                <div className="space-y-3">
                  {currentReport.challenges.map((challenge) => (
                    <div key={challenge.id} className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm">{challenge.title}</p>
                          <Badge variant={
                            challenge.severity === "high" ? "rejected" :
                            challenge.severity === "medium" ? "pending" :
                            "secondary"
                          }>
                            {challenge.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {challenge.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>Actionable next steps</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {currentReport.recommendations.map((recommendation) => (
                <div key={recommendation.id} className="flex gap-3 rounded-lg border border-border bg-muted/50 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <Lightbulb className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm">{recommendation.title}</p>
                      <Badge variant={
                        recommendation.priority === "high" ? "rejected" :
                        recommendation.priority === "medium" ? "pending" :
                        "secondary"
                      }>
                        {recommendation.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {recommendation.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Export Options */}
        {isLeader && (
          <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
            <CardHeader>
              <CardTitle>Export Report</CardTitle>
              <CardDescription>Download for sharing or presentation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => exportReport("pdf")}>
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </Button>
                <Button variant="outline" onClick={() => exportReport("docx")}>
                  <FileText className="mr-2 h-4 w-4" />
                  DOCX
                </Button>
                <Button variant="outline" onClick={() => exportReport("presentation")}>
                  <Presentation className="mr-2 h-4 w-4" />
                  Presentation
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Generate AI Report</h2>
        <p className="text-sm text-muted-foreground">
          Create professional project reports using real project data
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>Select report type and period</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Report Type</label>
            <div className="grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setReportType("weekly")}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-all ${
                  reportType === "weekly"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Calendar className="h-6 w-6" />
                <span className="font-medium">Weekly</span>
                <span className="text-xs text-muted-foreground">Last 7 days</span>
              </button>
              <button
                type="button"
                onClick={() => setReportType("monthly")}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-all ${
                  reportType === "monthly"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Calendar className="h-6 w-6" />
                <span className="font-medium">Monthly</span>
                <span className="text-xs text-muted-foreground">Current month</span>
              </button>
              <button
                type="button"
                onClick={() => setReportType("full")}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-all ${
                  reportType === "full"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <BarChart3 className="h-6 w-6" />
                <span className="font-medium">Full Project</span>
                <span className="text-xs text-muted-foreground">All time</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              Uses real data from tasks, members, and activities
            </div>
            <Button onClick={handleGenerate} disabled={isPending || !isLeader}>
              {isPending ? "Generating..." : "Generate Report"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {reportHistory.length > 0 && (
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handleViewHistory}>
              <History className="mr-2 h-4 w-4" />
              View Report History ({reportHistory.length})
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
