"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { t } from "@/hooks/useTranslation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface WorkflowInputFormProps {
  onGenerate: (formData: FormData) => void;
  isGenerating: boolean;
}

export default function WorkflowInputForm({
  onGenerate,
  isGenerating,
}: WorkflowInputFormProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onGenerate(formData);
  };

  return (
    <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
      <CardHeader>
        <CardTitle>{t("workflow.generateAiWorkflow")}</CardTitle>
        <CardDescription>{t("workflow.generateDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("workflow.problemTitle")}
            </label>
            <Input
              name="problemTitle"
              placeholder={t("workflow.problemTitlePlaceholder")}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("workflow.problemDescription")}
            </label>
            <Textarea
              name="problemDescription"
              placeholder={t("workflow.problemDescriptionPlaceholder")}
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("workflow.communityImpact")}
            </label>
            <Textarea
              name="communityImpact"
              placeholder={t("workflow.communityImpactPlaceholder")}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("workflow.expectedGoal")}
            </label>
            <Input
              name="expectedGoal"
              placeholder={t("workflow.expectedGoalPlaceholder")}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("workflow.estimatedTeamSize")}
            </label>
            <Input
              name="estimatedTeamSize"
              type="number"
              min="2"
              max="50"
              defaultValue="5"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isGenerating}>
            {isGenerating
              ? t("workflow.generatingWorkflow")
              : t("workflow.generateWorkflowBtn")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
