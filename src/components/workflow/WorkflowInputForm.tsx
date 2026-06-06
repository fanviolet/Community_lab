"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface WorkflowInputFormProps {
  onGenerate: (formData: FormData) => void;
  isGenerating: boolean;
}

export default function WorkflowInputForm({ onGenerate, isGenerating }: WorkflowInputFormProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onGenerate(formData);
  };

  return (
    <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
      <CardHeader>
        <CardTitle>Generate AI Workflow</CardTitle>
        <CardDescription>
          Describe your community problem and let AI create a comprehensive project plan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Problem Title</label>
            <Input
              name="problemTitle"
              placeholder="e.g., Youth unemployment in downtown area"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Problem Description</label>
            <Textarea
              name="problemDescription"
              placeholder="Describe the problem in detail..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Community Impact</label>
            <Textarea
              name="communityImpact"
              placeholder="How does this problem affect the community?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Expected Goal</label>
            <Input
              name="expectedGoal"
              placeholder="e.g., Reduce youth unemployment by 20%"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Estimated Team Size</label>
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
            {isGenerating ? "Generating Workflow..." : "Generate Workflow"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
