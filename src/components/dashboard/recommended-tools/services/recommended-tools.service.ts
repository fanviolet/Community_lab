import { createClient } from "@/lib/supabase/client";
import type { RecommendedTool } from "@/types/recommended-tools";

const CACHE_TTL_MS = 5 * 60 * 1000;

const cache: {
  data: RecommendedTool[] | null;
  fetchedAt: number;
} = {
  data: null,
  fetchedAt: 0,
};

export async function fetchRecommendedTools(forceRefresh = false): Promise<RecommendedTool[]> {
  const now = Date.now();
  if (!forceRefresh && cache.data && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.data;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("recommended_tools")
    .select("*")
    .eq("is_active", true)
    .order("priority", { ascending: false })
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch recommended tools", error);
    return cache.data ?? [];
  }

  const filtered = (data ?? []).filter((tool) => {
    const startOk = !tool.start_date || new Date(tool.start_date) <= new Date();
    const endOk = !tool.end_date || new Date(tool.end_date) >= new Date();
    return startOk && endOk;
  }) as RecommendedTool[];

  cache.data = filtered;
  cache.fetchedAt = now;

  return filtered;
}

export async function recordToolImpression(slug: string) {
  const supabase = createClient();
  await supabase.rpc("increment_recommended_tool_impression", { tool_slug: slug });
}

export async function recordToolClick(slug: string) {
  const supabase = createClient();
  await supabase.rpc("increment_recommended_tool_click", { tool_slug: slug });
}

export type RecommendedToolAnalytics = {
  totalImpressions: number;
  totalClicks: number;
  ctr: number;
  topClicked: RecommendedTool[];
  topViewed: RecommendedTool[];
  bestCategory: { category: string; ctr: number } | null;
};

export async function fetchRecommendedToolAnalytics(): Promise<RecommendedToolAnalytics> {
  const supabase = createClient();

  const [{ data: tools }, { data: clicks }, { data: impressions }] = await Promise.all([
    supabase.from("recommended_tools").select("*").eq("is_active", true),
    supabase.from("recommended_tools").select("click_count"),
    supabase.from("recommended_tools").select("impression_count"),
  ]);

  const totalClicks = (clicks ?? []).reduce((sum, row) => sum + (row.click_count ?? 0), 0);
  const totalImpressions = (impressions ?? []).reduce(
    (sum, row) => sum + (row.impression_count ?? 0),
    0,
  );

  const ctr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;

  const sortedByClicks = [...(tools ?? [])].sort((a, b) => (b.click_count ?? 0) - (a.click_count ?? 0));
  const sortedByViews = [...(tools ?? [])].sort((a, b) => (b.impression_count ?? 0) - (a.impression_count ?? 0));

  return {
    totalImpressions,
    totalClicks,
    ctr,
    topClicked: sortedByClicks.slice(0, 5) as RecommendedTool[],
    topViewed: sortedByViews.slice(0, 5) as RecommendedTool[],
    bestCategory: null,
  };
}
