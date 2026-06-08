import Link from "next/link";
import { BarChart3, Workflow, ArrowRight } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function InsightsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Insights</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate AI-powered reports and workflows for your projects
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/15 to-violet-500/15 text-blue-600">
                <BarChart3 className="size-5" />
              </div>
              <div>
                <CardTitle>AI Report Generator</CardTitle>
                <CardDescription>
                  Generate professional project reports with AI
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Create comprehensive reports including metrics, achievements, challenges, and recommendations for your projects.
            </p>
            <Link href="/dashboard/insights/report-generator">
              <Button className="w-full">
                Generate Report
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/15 to-purple-500/15 text-violet-600">
                <Workflow className="size-5" />
              </div>
              <div>
                <CardTitle>AI Workflow Generator</CardTitle>
                <CardDescription>
                  Convert problems into actionable project plans
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Transform community problems into structured project workflows with phases, tasks, and team recommendations.
            </p>
            <Link href="/dashboard/insights/workflow-generator">
              <Button className="w-full" variant="outline">
                Generate Workflow
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
