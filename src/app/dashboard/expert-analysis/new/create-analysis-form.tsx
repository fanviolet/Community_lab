"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createAnalysis } from "../actions";
import type { AnalysisType } from "@/types/expert-analysis";

interface CreateAnalysisFormProps {
  problems: Array<{ id: string; title: string }>;
  projects: Array<{ id: string; title: string }>;
}

export function CreateAnalysisForm({ problems, projects }: CreateAnalysisFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    problem_id: "",
    project_id: "",
    analysis_type: "problem" as AnalysisType,
    summary: "",
    strengths: [] as string[],
    weaknesses: [] as string[],
    risks: [] as string[],
    recommendations: [] as string[],
    impact_assessment: "",
    feasibility_assessment: "",
    sustainability_assessment: "",
  });

  const [strengthInput, setStrengthInput] = useState("");
  const [weaknessInput, setWeaknessInput] = useState("");
  const [riskInput, setRiskInput] = useState("");
  const [recommendationInput, setRecommendationInput] = useState("");

  const addStrength = () => {
    if (strengthInput.trim()) {
      setFormData({ ...formData, strengths: [...formData.strengths, strengthInput.trim()] });
      setStrengthInput("");
    }
  };

  const removeStrength = (index: number) => {
    setFormData({
      ...formData,
      strengths: formData.strengths.filter((_, i) => i !== index),
    });
  };

  const addWeakness = () => {
    if (weaknessInput.trim()) {
      setFormData({ ...formData, weaknesses: [...formData.weaknesses, weaknessInput.trim()] });
      setWeaknessInput("");
    }
  };

  const removeWeakness = (index: number) => {
    setFormData({
      ...formData,
      weaknesses: formData.weaknesses.filter((_, i) => i !== index),
    });
  };

  const addRisk = () => {
    if (riskInput.trim()) {
      setFormData({ ...formData, risks: [...formData.risks, riskInput.trim()] });
      setRiskInput("");
    }
  };

  const removeRisk = (index: number) => {
    setFormData({
      ...formData,
      risks: formData.risks.filter((_, i) => i !== index),
    });
  };

  const addRecommendation = () => {
    if (recommendationInput.trim()) {
      setFormData({
        ...formData,
        recommendations: [...formData.recommendations, recommendationInput.trim()],
      });
      setRecommendationInput("");
    }
  };

  const removeRecommendation = (index: number) => {
    setFormData({
      ...formData,
      recommendations: formData.recommendations.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createAnalysis(formData);
      router.push("/dashboard/expert-analysis");
    } catch (error) {
      console.error("Failed to create analysis:", error);
      alert("Failed to create analysis. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="Enter analysis title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="analysis_type">Analysis Type *</Label>
          <Select
            value={formData.analysis_type}
            onValueChange={(value) => setFormData({ ...formData, analysis_type: value as AnalysisType })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="problem">Problem</SelectItem>
              <SelectItem value="project">Project</SelectItem>
              <SelectItem value="proposal">Proposal</SelectItem>
              <SelectItem value="trend">Trend</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="problem_id">Related Problem</Label>
          <Select
            value={formData.problem_id}
            onValueChange={(value) => setFormData({ ...formData, problem_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a problem" />
            </SelectTrigger>
            <SelectContent>
              {problems.map((problem) => (
                <SelectItem key={problem.id} value={problem.id}>
                  {problem.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="project_id">Related Project</Label>
          <Select
            value={formData.project_id}
            onValueChange={(value) => setFormData({ ...formData, project_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="summary">Summary *</Label>
        <Textarea
          id="summary"
          value={formData.summary}
          onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
          required
          rows={4}
          placeholder="Provide a brief summary of the analysis"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Strengths</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={strengthInput}
              onChange={(e) => setStrengthInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addStrength())}
              placeholder="Add a strength"
            />
            <Button type="button" onClick={addStrength}>
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.strengths.map((strength, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm text-green-800"
              >
                {strength}
                <button
                  type="button"
                  onClick={() => removeStrength(index)}
                  className="text-green-600 hover:text-green-800"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weaknesses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={weaknessInput}
              onChange={(e) => setWeaknessInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addWeakness())}
              placeholder="Add a weakness"
            />
            <Button type="button" onClick={addWeakness}>
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.weaknesses.map((weakness, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-sm text-red-800"
              >
                {weakness}
                <button
                  type="button"
                  onClick={() => removeWeakness(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Risks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={riskInput}
              onChange={(e) => setRiskInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addRisk())}
              placeholder="Add a risk"
            />
            <Button type="button" onClick={addRisk}>
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.risks.map((risk, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-800"
              >
                {risk}
                <button
                  type="button"
                  onClick={() => removeRisk(index)}
                  className="text-yellow-600 hover:text-yellow-800"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={recommendationInput}
              onChange={(e) => setRecommendationInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addRecommendation())}
              placeholder="Add a recommendation"
            />
            <Button type="button" onClick={addRecommendation}>
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.recommendations.map((recommendation, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
              >
                {recommendation}
                <button
                  type="button"
                  onClick={() => removeRecommendation(index)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="impact_assessment">Impact Assessment</Label>
          <Textarea
            id="impact_assessment"
            value={formData.impact_assessment}
            onChange={(e) => setFormData({ ...formData, impact_assessment: e.target.value })}
            rows={3}
            placeholder="Assess the potential impact"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="feasibility_assessment">Feasibility Assessment</Label>
          <Textarea
            id="feasibility_assessment"
            value={formData.feasibility_assessment}
            onChange={(e) => setFormData({ ...formData, feasibility_assessment: e.target.value })}
            rows={3}
            placeholder="Assess feasibility"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sustainability_assessment">Sustainability Assessment</Label>
          <Textarea
            id="sustainability_assessment"
            value={formData.sustainability_assessment}
            onChange={(e) => setFormData({ ...formData, sustainability_assessment: e.target.value })}
            rows={3}
            placeholder="Assess sustainability"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Analysis"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
