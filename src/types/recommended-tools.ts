export type RecommendedToolCategory =
  | "AI"
  | "Development"
  | "Hosting"
  | "Deployment"
  | "Database"
  | "Design"
  | "Productivity"
  | "Learning";

export interface RecommendedTool {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  description: string;
  category: RecommendedToolCategory;
  destination_url: string;
  is_affiliate: boolean;
  is_sponsored: boolean;
  sponsor_name: string | null;
  sponsor_level: string | null;
  priority: number;
  display_order: number;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  click_count: number;
  impression_count: number;
  created_at: string;
  updated_at: string;
}

export type RecommendedToolInput = Omit<RecommendedTool, "id" | "click_count" | "impression_count" | "created_at" | "updated_at"> & {
  id?: string;
};
