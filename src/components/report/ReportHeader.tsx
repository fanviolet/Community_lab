import { CalendarDays, FileText } from "lucide-react";

import type { GeneratedReport } from "@/app/dashboard/insights/report-generator/actions";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ReportHeaderProps {
  report: GeneratedReport;
}

export default function ReportHeader({ report }: ReportHeaderProps) {
  return (
    <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <FileText className="size-4" />
              {report.period.label}
            </div>
            <CardTitle className="text-2xl">{report.project.title}</CardTitle>
            <CardDescription>{report.project.description ?? "No project description provided."}</CardDescription>
          </div>
          <Badge variant="secondary">{report.metrics.projectStatus}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="size-4" />
          <span>
            {report.period.startDate} to {report.period.endDate}
          </span>
        </div>
        <div className="rounded-lg border border-primary/10 bg-primary/5 p-4">
          <p className="text-sm font-medium text-foreground">Executive Summary</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{report.overview}</p>
        </div>
      </CardContent>
    </Card>
  );
}
