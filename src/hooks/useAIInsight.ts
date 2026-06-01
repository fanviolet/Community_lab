"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AIInsight } from "@/types/ai-insight";

interface UseAIInsightState {
     insight: AIInsight | null;
     loading: boolean;
     error: string | null;
     isGenerated: boolean;
     isAuthenticated: boolean;
     generateInsight: () => Promise<void>;
}

function isAIInsight(value: unknown): value is AIInsight {
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

function parseAiSummary(raw: string | null | undefined): AIInsight | null {
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

function wait(milliseconds: number): Promise<void> {
     return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchWithRetry(input: RequestInfo, init: RequestInit, maxAttempts = 3): Promise<Response> {
     let attempt = 0;
     let delay = 2000;

     while (true) {
          const response = await fetch(input, init);

          if (response.ok) {
               return response;
          }

          if (response.status !== 429 || attempt >= maxAttempts - 1) {
               return response;
          }

          attempt += 1;
          await wait(delay);
          delay *= 2;
     }
}

export function useAIInsight(problemId: string, initialAiSummary?: string | null): UseAIInsightState {
     const [insight, setInsight] = useState<AIInsight | null>(() => parseAiSummary(initialAiSummary));
     const [loading, setLoading] = useState(false);
     const [error, setError] = useState<string | null>(null);
     const [isGenerated, setIsGenerated] = useState(Boolean(initialAiSummary));
     const [isAuthenticated, setIsAuthenticated] = useState(false);

     useEffect(() => {
          let canceled = false;

          const loadStatus = async () => {
               try {
                    const supabase = createClient();
                    const {
                         data: { session },
                    } = await supabase.auth.getSession();

                    if (!canceled) {
                         setIsAuthenticated(Boolean(session?.user));
                    }

                    if (initialAiSummary) {
                         return;
                    }

                    const { data, error } = await supabase
                         .from("problems")
                         .select("ai_summary")
                         .eq("id", problemId)
                         .single();

                    if (canceled) {
                         return;
                    }

                    if (error) {
                         throw error;
                    }

                    const parsedInsight = parseAiSummary(data?.ai_summary ?? null);

                    if (parsedInsight) {
                         setInsight(parsedInsight);
                         setIsGenerated(true);
                    }
               } catch (loadError) {
                    if (!canceled) {
                         console.error(loadError);
                         setError("Unable to load AI insight metadata.");
                    }
               }
          };

          loadStatus();

          return () => {
               canceled = true;
          };
     }, [initialAiSummary, problemId]);

     const generateInsight = useCallback(async () => {
          if (loading || isGenerated) {
               return;
          }

          setLoading(true);
          setError(null);

          try {
               const response = await fetchWithRetry(
                    "/api/ai-insight",
                    {
                         method: "POST",
                         headers: {
                              "Content-Type": "application/json",
                         },
                         body: JSON.stringify({ problemId }),
                    },
                    3,
               );

               if (!response.ok) {
                    const payload = await response.json().catch(() => null);
                    const message =
                         payload?.error || response.statusText || "Unable to generate AI insight.";
                    throw new Error(message);
               }

               const payload = (await response.json()) as { insight?: AIInsight };

               if (!payload?.insight) {
                    throw new Error("OpenAI returned an invalid insight payload.");
               }

               setInsight(payload.insight);
               setIsGenerated(true);
          } catch (generateError) {
               console.error(generateError);
               setError(
                    generateError instanceof Error
                         ? generateError.message
                         : "Failed to generate AI insight.",
               );
          } finally {
               setLoading(false);
          }
     }, [isGenerated, loading, problemId]);

     return {
          insight,
          loading,
          error,
          isGenerated,
          isAuthenticated,
          generateInsight,
     };
}
