"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Dependency {
  description: string;
  type: string;
}

interface WorkflowDependenciesProps {
  dependencies: Dependency[];
}

export default function WorkflowDependencies({ dependencies }: WorkflowDependenciesProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "sequential":
        return "default";
      case "supporting":
        return "secondary";
      case "resource":
        return "outline";
      case "external":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
      <CardHeader>
        <CardTitle>Dependencies</CardTitle>
        <CardDescription>Key dependencies and relationships between phases</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {dependencies.map((dependency, index) => (
            <div key={index} className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-3">
              <Badge variant={getTypeColor(dependency.type) as any} className="text-xs">
                {dependency.type}
              </Badge>
              <p className="text-sm flex-1">{dependency.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
