"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Risk {
  risk: string;
  impact: string;
  mitigation: string;
  severity: string;
}

interface WorkflowRisksProps {
  risks: Risk[];
}

function severityBadgeVariant(severity: string) {
  switch (severity.toLowerCase()) {
    case "high":
      return "revise";
    case "medium":
      return "pending";
    case "low":
      return "secondary";
    default:
      return "outline";
  }
}

function impactBadgeVariant(impact: string) {
  switch (impact.toLowerCase()) {
    case "high":
      return "revise";
    case "medium":
      return "pending";
    case "low":
      return "secondary";
    default:
      return "outline";
  }
}

export default function WorkflowRisks({ risks }: WorkflowRisksProps) {
  return (
    <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
      <CardHeader>
        <CardTitle>Risk Assessment</CardTitle>
        <CardDescription>Identified risks with mitigation strategies</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium">Risk</th>
                <th className="text-left py-3 px-4 text-sm font-medium">Impact</th>
                <th className="text-left py-3 px-4 text-sm font-medium">Severity</th>
                <th className="text-left py-3 px-4 text-sm font-medium">Mitigation</th>
              </tr>
            </thead>
            <tbody>
              {risks.map((risk, index) => (
                <tr key={index} className="border-b border-border/50 last:border-0">
                  <td className="py-3 px-4 text-sm">{risk.risk}</td>
                  <td className="py-3 px-4">
                    <Badge variant={impactBadgeVariant(risk.impact)} className="text-xs">
                      {risk.impact}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={severityBadgeVariant(risk.severity)} className="text-xs">
                      {risk.severity}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{risk.mitigation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
