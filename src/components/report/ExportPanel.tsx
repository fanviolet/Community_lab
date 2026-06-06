"use client";

import { Download, FileText, Presentation } from "lucide-react";

import type { GeneratedReport } from "@/app/dashboard/insights/report-generator/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ExportPanelProps {
  report: GeneratedReport;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function buildReportHtml(report: GeneratedReport) {
  const achievements = report.achievements.map((item) => `<li><strong>${item.title}</strong> - ${item.description}</li>`).join("");
  const challenges = report.challenges.map((item) => `<li><strong>${item.title}</strong> - ${item.description}</li>`).join("");
  const recommendations = report.recommendations.map((item) => `<li><strong>${item.title}</strong> - ${item.description}</li>`).join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${report.project.title} Report</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111827; line-height: 1.5; padding: 32px; }
    h1, h2 { color: #111827; }
    .muted { color: #6b7280; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 12px 0; }
    .metric { font-size: 28px; font-weight: bold; }
  </style>
</head>
<body>
  <h1>${report.project.title}</h1>
  <p class="muted">${report.period.label}: ${report.period.startDate} to ${report.period.endDate}</p>
  <div class="card"><h2>Executive Summary</h2><p>${report.overview}</p></div>
  <div class="grid">
    <div class="card"><p>Total Tasks</p><div class="metric">${report.metrics.totalTasks}</div></div>
    <div class="card"><p>Completed</p><div class="metric">${report.metrics.completedTasks}</div></div>
    <div class="card"><p>Completion Rate</p><div class="metric">${report.metrics.completionRate}%</div></div>
    <div class="card"><p>Active Members</p><div class="metric">${report.metrics.activeMembers}</div></div>
  </div>
  <div class="card"><h2>Key Achievements</h2><ul>${achievements || "<li>No completed achievements found.</li>"}</ul></div>
  <div class="card"><h2>Challenges</h2><ul>${challenges || "<li>No major challenges detected.</li>"}</ul></div>
  <div class="card"><h2>Community Impact</h2><p>${report.communityImpact}</p></div>
  <div class="card"><h2>Recommendations</h2><ul>${recommendations}</ul></div>
</body>
</html>`;
}

function buildPresentationSummary(report: GeneratedReport) {
  return [
    `${report.project.title} - Presentation Summary`,
    `${report.period.label}: ${report.period.startDate} to ${report.period.endDate}`,
    "",
    "Slide 1: Executive Summary",
    report.overview,
    "",
    "Slide 2: Progress",
    `Completion rate: ${report.metrics.completionRate}%`,
    `Completed tasks: ${report.metrics.completedTasks}/${report.metrics.totalTasks}`,
    `Active members: ${report.metrics.activeMembers}`,
    "",
    "Slide 3: Key Achievements",
    ...(report.achievements.length
      ? report.achievements.map((item) => `- ${item.title}: ${item.description}`)
      : ["- No completed achievements found."]),
    "",
    "Slide 4: Challenges",
    ...(report.challenges.length
      ? report.challenges.map((item) => `- ${item.title}: ${item.description}`)
      : ["- No major challenges detected."]),
    "",
    "Slide 5: Recommendations",
    ...report.recommendations.map((item) => `- ${item.title}: ${item.description}`),
  ].join("\n");
}

export default function ExportPanel({ report }: ExportPanelProps) {
  const baseName = `${slugify(report.project.title)}-${report.period.startDate}`;

  return (
    <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
      <CardHeader>
        <CardTitle>Export Report</CardTitle>
        <CardDescription>Download competition-ready report materials</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => downloadFile(`${baseName}.html`, buildReportHtml(report), "text/html")}
        >
          <Download className="size-4" />
          PDF
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            downloadFile(
              `${baseName}.doc`,
              buildReportHtml(report),
              "application/msword",
            )
          }
        >
          <FileText className="size-4" />
          DOCX
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            downloadFile(
              `${baseName}-presentation.txt`,
              buildPresentationSummary(report),
              "text/plain",
            )
          }
        >
          <Presentation className="size-4" />
          Summary
        </Button>
      </CardContent>
    </Card>
  );
}
