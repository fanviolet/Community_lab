"use client";

import { useEffect, useState } from "react";

import type { RecommendedTool } from "@/types/recommended-tools";
import { fetchRecommendedTools } from "../services/recommended-tools.service";

export function useRecommendedTools() {
  const [tools, setTools] = useState<RecommendedTool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadTools() {
      try {
        setIsLoading(true);
        const data = await fetchRecommendedTools();
        if (isMounted) {
          setTools(data);
          setError(null);
        }
      } catch (err) {
        console.error("Failed to load recommended tools", err);
        if (isMounted) {
          setError("Không thể tải đề xuất");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadTools();

    return () => {
      isMounted = false;
    };
  }, []);

  return { tools, isLoading, error };
}
