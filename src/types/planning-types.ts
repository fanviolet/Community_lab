/**
 * Structured Planning Types
 * 
 * These types replace free-text project descriptions with structured
 * inputs for AI workflow generation.
 */

// ============================================================================
// ENUMS
// ============================================================================

export const DOMAIN_OPTIONS = [
  "software",
  "education",
  "community",
  "environmental",
  "health",
  "startup",
] as const;

export type ProjectDomain = (typeof DOMAIN_OPTIONS)[number];

export const PROJECT_TYPE_OPTIONS = [
  "web_app",
  "mobile_app",
  "platform",
  "research",
  "event",
  "campaign",
  "training_program",
  "community_program",
  "other",
] as const;

export type ProjectType = (typeof PROJECT_TYPE_OPTIONS)[number];

export const EXPERIENCE_LEVEL_OPTIONS = [
  "beginner",
  "intermediate",
  "advanced",
] as const;

export type ExperienceLevel = (typeof EXPERIENCE_LEVEL_OPTIONS)[number];

export const BUDGET_RANGE_OPTIONS = [
  "0-5m",
  "5-20m",
  "20-100m",
  "100m+",
] as const;

export type BudgetRange = (typeof BUDGET_RANGE_OPTIONS)[number];

export const DELIVERABLE_OPTIONS = [
  "mvp",
  "prototype",
  "web_app",
  "mobile_app",
  "dashboard",
  "landing_page",
  "research_report",
  "event",
  "workshop",
  "training_material",
  "community_campaign",
] as const;

export type Deliverable = (typeof DELIVERABLE_OPTIONS)[number];

export const TARGET_AUDIENCE_OPTIONS = [
  "middle_school_students",
  "high_school_students",
  "university_students",
  "teachers",
  "volunteers",
  "community_members",
  "organizations",
] as const;

export type TargetAudience = (typeof TARGET_AUDIENCE_OPTIONS)[number];

// ============================================================================
// INTERFACES
// ============================================================================

export interface ProjectPlanningInfo {
  domain: ProjectDomain | null;
  project_type: ProjectType | null;
  team_size: number | null;
  experience_level: ExperienceLevel | null;
  budget_range: BudgetRange | null;
  duration_days: number | null;
  main_goal: string | null;
  deliverables: Deliverable[];
  target_audience: TargetAudience[];
  success_metrics: SuccessMetricInput[];
}

export interface SuccessMetricInput {
  metric: string;
  target: number;
}

// ============================================================================
// LABELS (for display)
// ============================================================================

export const DOMAIN_LABELS: Record<ProjectDomain, string> = {
  software: "Phần mềm",
  education: "Giáo dục",
  community: "Cộng đồng",
  environmental: "Môi trường",
  health: "Sức khỏe",
  startup: "Khởi nghiệp",
};

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  web_app: "Web App",
  mobile_app: "Mobile App",
  platform: "Nền tảng",
  research: "Nghiên cứu",
  event: "Sự kiện",
  campaign: "Chiến dịch",
  training_program: "Chương trình đào tạo",
  community_program: "Chương trình cộng đồng",
  other: "Khác",
};

export const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  beginner: "Mới bắt đầu",
  intermediate: "Trung cấp",
  advanced: "Nâng cao",
};

export const BUDGET_RANGE_LABELS: Record<BudgetRange, string> = {
  "0-5m": "0 - 5 triệu",
  "5-20m": "5 - 20 triệu",
  "20-100m": "20 - 100 triệu",
  "100m+": "Trên 100 triệu",
};

export const DELIVERABLE_LABELS: Record<Deliverable, string> = {
  mvp: "MVP",
  prototype: "Nguyên mẫu",
  web_app: "Web App",
  mobile_app: "Mobile App",
  dashboard: "Dashboard",
  landing_page: "Landing Page",
  research_report: "Báo cáo nghiên cứu",
  event: "Sự kiện",
  workshop: "Workshop",
  training_material: "Tài liệu đào tạo",
  community_campaign: "Chiến dịch cộng đồng",
};

export const TARGET_AUDIENCE_LABELS: Record<TargetAudience, string> = {
  middle_school_students: "Học sinh THCS",
  high_school_students: "Học sinh THPT",
  university_students: "Sinh viên đại học",
  teachers: "Giáo viên",
  volunteers: "Tình nguyện viên",
  community_members: "Thành viên cộng đồng",
  organizations: "Tổ chức",
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Get the display label for a domain value
 */
export function getDomainLabel(domain: ProjectDomain | null): string {
  if (!domain) return "Chưa chọn";
  return DOMAIN_LABELS[domain] || domain;
}

/**
 * Get the display label for a project type value
 */
export function getProjectTypeLabel(type: ProjectType | null): string {
  if (!type) return "Chưa chọn";
  return PROJECT_TYPE_LABELS[type] || type;
}

/**
 * Get the display label for a deliverable value
 */
export function getDeliverableLabel(d: Deliverable): string {
  return DELIVERABLE_LABELS[d] || d;
}

/**
 * Get the display label for a target audience value
 */
export function getTargetAudienceLabel(a: TargetAudience): string {
  return TARGET_AUDIENCE_LABELS[a] || a;
}