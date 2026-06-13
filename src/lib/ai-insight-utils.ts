import type { AIInsight } from "@/types/ai-insight";

export function isAIInsight(value: unknown): value is AIInsight {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const insight = value as Record<string, unknown>;
  const isStringArray = (item: unknown): item is string[] =>
    Array.isArray(item) && item.every((entry) => typeof entry === "string");

  return (
    typeof insight.rootCause === "string" &&
    typeof insight.impact === "string" &&
    isStringArray(insight.suggestions) &&
    (insight.urgency === "low" || insight.urgency === "medium" || insight.urgency === "high") &&
    isStringArray(insight.tags)
  );
}

export function parseAiSummary(raw: string | null | undefined): AIInsight | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isAIInsight(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
