"use client";

import { useEffect, useState, useTransition } from "react";
import { BarChart3, CalendarRange, FileText } from "lucide-react";

import {
  generateReport,
  getReportProjects,
} from "./actions";
import type {
  GeneratedReport,
  ProjectOption,
  ReportPeriodType,
} from "./report-types";
import ExportPanel from "@/components/report/ExportPanel";
import ReportChallenges from "@/components/report/ReportChallenges";
import ReportHeader from "@/components/report/ReportHeader";
import ReportMetrics from "@/components/report/ReportMetrics";
import ReportRecommendations from "@/components/report/ReportRecommendations";
import ReportTimeline from "@/components/report/ReportTimeline";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ReportGeneratorPage() {
  const [isPending, startTransition] = useTransition();
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectId, setProjectId] = useState("");
  const [periodType, setPeriodType] = useState<ReportPeriodType>("weekly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startTransition(async () => {
      try {
        const rows = await getReportProjects();
        setProjects(rows);
        setProjectId(rows[0]?.id ?? "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể tải dự án");
      } finally {
        setLoadingProjects(false);
      }
    });
  }, []);

  const handleGenerate = () => {
    setError(null);

    startTransition(async () => {
      try {
        const result = await generateReport({
          projectId,
          periodType,
          startDate: periodType === "custom" ? startDate : undefined,
          endDate: periodType === "custom" ? endDate : undefined,
        });

        setReport(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể tạo báo cáo");
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <BarChart3 className="size-4" />
            AI Insights
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Trình tạo báo cáo AI</h1>
          <p className="text-sm text-muted-foreground">
            Tạo báo cáo dự án chuyên nghiệp cho lãnh đạo, trường học, tổ chức và cuộc thi.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Cài đặt báo cáo</CardTitle>
          <CardDescription>Chọn dự án và kỳ báo cáo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="project">
                Dự án
              </label>
              <select
                id="project"
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                disabled={loadingProjects || projects.length === 0}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {projects.length === 0 ? (
                  <option value="">Không có dự án nào</option>
                ) : (
                  projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="period">
                Kỳ báo cáo
              </label>
              <select
                id="period"
                value={periodType}
                onChange={(event) => setPeriodType(event.target.value as ReportPeriodType)}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <option value="weekly">Hàng tuần</option>
                <option value="monthly">Hàng tháng</option>
                <option value="custom">Tùy chỉnh</option>
              </select>
            </div>
          </div>

          {periodType === "custom" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="startDate">
                  Ngày bắt đầu
                </label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="endDate">
                  Ngày kết thúc
                </label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarRange className="size-4" />
              Sử dụng dự án, nhiệm vụ, thành viên và nhật ký hoạt động.
            </div>
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={isPending || !projectId || (periodType === "custom" && (!startDate || !endDate))}
            >
              <FileText className="size-4" />
              {isPending ? "Đang tạo..." : "Tạo báo cáo"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {report ? (
        <div className="space-y-6">
          <ReportHeader report={report} />
          <ReportMetrics metrics={report.metrics} />
          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <ReportTimeline achievements={report.achievements} />
            <ReportChallenges challenges={report.challenges} />
          </div>
          <ReportRecommendations
            communityImpact={report.communityImpact}
            recommendations={report.recommendations}
          />
          <ExportPanel report={report} />
        </div>
      ) : null}
    </div>
  );
}
