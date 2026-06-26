"use client";

import { Download, FileText, Presentation } from "lucide-react";

import type {
  GeneratedReport,
  ReportAchievement,
  ReportChallenge,
  ReportRecommendation,
} from "@/app/dashboard/insights/report-generator/report-types";
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
  const achievements = report.achievements
    .map(
      (item: ReportAchievement) =>
        `<li><strong>${item.title}</strong> - ${item.description}</li>`,
    )
    .join("");
  const challenges = report.challenges
    .map(
      (item: ReportChallenge) =>
        `<li><strong>${item.title}</strong> - ${item.description}</li>`,
    )
    .join("");
  const recommendations = report.recommendations
    .map(
      (item: ReportRecommendation) =>
        `<li><strong>${item.title}</strong> - ${item.description}</li>`,
    )
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${report.project.title} Báo cáo</title>
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
  <p class="muted">${report.period.label}: ${report.period.startDate} đến ${report.period.endDate}</p>
  <div class="card"><h2>Tóm tắt điều hành</h2><p>${report.overview}</p></div>
  <div class="grid">
    <div class="card"><p>Tổng nhiệm vụ</p><div class="metric">${report.metrics.totalTasks}</div></div>
    <div class="card"><p>Hoàn thành</p><div class="metric">${report.metrics.completedTasks}</div></div>
    <div class="card"><p>Tỷ lệ hoàn thành</p><div class="metric">${report.metrics.completionRate}%</div></div>
    <div class="card"><p>Thành viên đang hoạt động</p><div class="metric">${report.metrics.activeMembers}</div></div>
  </div>
  <div class="card"><h2>Thành tựu nổi bật</h2><ul>${achievements || "<li>Không tìm thấy thành tựu hoàn thành nào.</li>"}</ul></div>
  <div class="card"><h2>Thách thức</h2><ul>${challenges || "<li>Không phát hiện thách thức lớn nào.</li>"}</ul></div>
  <div class="card"><h2>Tác động cộng đồng</h2><p>${report.communityImpact}</p></div>
  <div class="card"><h2>Khuyến nghị</h2><ul>${recommendations}</ul></div>
</body>
</html>`;
}

function buildPresentationSummary(report: GeneratedReport) {
  return [
    `${report.project.title} - Tóm tắt thuyết trình`,
    `${report.period.label}: ${report.period.startDate} đến ${report.period.endDate}`,
    "",
    "Trang 1: Tóm tắt điều hành",
    report.overview,
    "",
    "Trang 2: Tiến độ",
    `Tỷ lệ hoàn thành: ${report.metrics.completionRate}%`,
    `Nhiệm vụ hoàn thành: ${report.metrics.completedTasks}/${report.metrics.totalTasks}`,
    `Thành viên đang hoạt động: ${report.metrics.activeMembers}`,
    "",
    "Trang 3: Thành tựu nổi bật",
    ...(report.achievements.length
      ? report.achievements.map(
          (item: ReportAchievement) => `- ${item.title}: ${item.description}`,
        )
      : ["- Không tìm thấy thành tựu hoàn thành nào."]),
    "",
    "Trang 4: Thách thức",
    ...(report.challenges.length
      ? report.challenges.map(
          (item: ReportChallenge) => `- ${item.title}: ${item.description}`,
        )
      : ["- Không phát hiện thách thức lớn nào."]),
    "",
    "Trang 5: Khuyến nghị",
    ...report.recommendations.map(
      (item: ReportRecommendation) => `- ${item.title}: ${item.description}`,
    ),
  ].join("\n");
}

export default function ExportPanel({ report }: ExportPanelProps) {
  const baseName = `${slugify(report.project.title)}-${report.period.startDate}`;

  return (
    <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
      <CardHeader>
        <CardTitle>Xuất báo cáo</CardTitle>
        <CardDescription>
          Tải xuống tài liệu báo cáo sẵn sàng cho cuộc thi
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-3">
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            downloadFile(
              `${baseName}.html`,
              buildReportHtml(report),
              "text/html",
            )
          }
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
          Tóm tắt
        </Button>
      </CardContent>
    </Card>
  );
}
