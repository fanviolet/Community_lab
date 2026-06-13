"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MessageSquare, TrendingUp, AlertTriangle, Clock, DollarSign } from "lucide-react";

interface AIAssistantProps {
  pitchId: string | null;
  currentStep: number;
  formData: any;
  onAIAssist: (type: string) => void;
}

const AI_FEATURES = [
  { id: "draft", label: "Generate Draft", icon: MessageSquare, description: "Generate a proposal draft based on your inputs" },
  { id: "improve", label: "Improve Proposal", icon: Sparkles, description: "Enhance your proposal with AI suggestions" },
  { id: "kpis", label: "Suggest KPIs", icon: TrendingUp, description: "Generate relevant KPIs for your project" },
  { id: "risks", label: "Analyze Risks", icon: AlertTriangle, description: "Identify potential risks and mitigation strategies" },
  { id: "timeline", label: "Generate Timeline", icon: Clock, description: "Create a realistic project timeline" },
  { id: "budget", label: "Estimate Budget", icon: DollarSign, description: "Generate budget estimates" },
];

export function AIAssistant({ pitchId, currentStep, formData, onAIAssist }: AIAssistantProps) {
  return (
    <Card className="border-0 bg-gradient-to-br from-purple-50 to-blue-50 ring-1 ring-purple-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-600" />
          AI Pitch Assistant
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2">
          {AI_FEATURES.map((feature) => (
            <Button
              key={feature.id}
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-3 bg-white hover:bg-purple-50"
              onClick={() => onAIAssist(feature.id)}
              disabled={!pitchId}
            >
              <div className="flex items-center gap-2 w-full">
                <feature.icon className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">{feature.label}</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                {feature.description}
              </span>
            </Button>
          ))}
        </div>
        {!pitchId && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Complete the first step to enable AI assistance
          </p>
        )}
      </CardContent>
    </Card>
  );
}
