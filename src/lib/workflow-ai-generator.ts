/**
 * AI Workflow Generator Module (Refactored)
 * 
 * This module provides AI-driven workflow generation that uses structured
 * project planning data instead of keyword-based domain detection.
 * 
 * Key Changes from Previous Version:
 * - REMOVED: detectProjectDomain() - keyword-based detection
 * - REMOVED: getDomainPhases() - template-based phase generation
 * - ADDED: generatePhasesFromStructuredData() - rule-based phase generation
 * - ADDED: calculateDynamicTaskCount() - uses duration, team_size, etc.
 * - ADDED: validateWorkflowQuality() - ensures minimum quality standards
 * - UPDATED: ProjectContext now includes structured planning fields
 * - UPDATED: AI prompt uses structured data directly
 */

import { calculateDaysRemaining } from "./project-timeline";
import { VIETNAMESE_SYSTEM_PROMPT } from "./ai/system-prompt";

// ============================================================================
// TYPES
// ============================================================================

export interface ProjectContext {
  title: string;
  description: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  existingTasks: ExistingTask[];
  members: ProjectMember[];
  recentActivities: RecentActivity[];
  pitchContent?: string;
  pitchAIAnalysis?: string;
  // NEW: Structured planning fields
  domain?: string | null;
  project_type?: string | null;
  team_size?: number | null;
  experience_level?: string | null;
  budget_range?: string | null;
  duration_days?: number | null;
  main_goal?: string | null;
  deliverables?: string[];
  target_audience?: string[];
  success_metrics?: Array<{ metric: string; target: number }>;
}

export interface ExistingTask {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
  assignedTo?: string;
}

export interface ProjectMember {
  userId: string;
  name: string;
  email: string;
  role: string;
}

export interface RecentActivity {
  action: string;
  description?: string;
  createdAt: string;
}

export interface AIGeneratedTask {
  title: string;
  description: string;
  priority: "Low" | "Medium" | "High" | "Important";
  estimatedDays: number;
  assigneeType: "Team Leader" | "Team Member" | "Mentor";
  dependsOn: string[];
}

export interface AIGeneratedMilestone {
  name: string;
  description: string;
  targetDate?: string;
  tasks: string[];
}

export interface AIWorkflowResult {
  projectUnderstanding: string;
  keyDeliverables: string[];
  milestones: AIGeneratedMilestone[];
  tasks: AIGeneratedTask[];
  workflowRisks: WorkflowRisk[];
  successMetrics: SuccessMetric[];
}

export interface ValidationFailure {
  reason: string;
  details: string[];
  timestamp: string;
  attemptNumber: number;
}

export interface WorkflowRisk {
  risk: string;
  impact: string;
  mitigation: string;
  severity: "low" | "medium" | "high";
}

export interface SuccessMetric {
  kpi: string;
  measurementMethod: string;
  targetValue: string;
}

export interface GeneratedWorkflow {
  workflowTitle: string;
  projectSummary: string;
  executiveSummary: string;
  aiGenerated: AIWorkflowResult;
  daysRemaining: number | null;
  generatedAt: string;
}

// ============================================================================
// DYNAMIC TASK COUNT LOGIC
// ============================================================================

/**
 * Calculate the recommended number of tasks based on duration and team size.
 * This replaces the simple `calculateTaskCountRange` that only considered days.
 * 
 * Examples:
 *   20 days + 2 members  => 10-15 tasks
 *   45 days + 5 members  => 20-30 tasks
 *   90 days + 10 members => 40-60 tasks
 */
export function calculateDynamicTaskCount(params: {
  duration_days?: number | null;
  team_size?: number | null;
  project_type?: string | null;
  deliverables?: string[];
}): { min: number; max: number; suggested_phases: number } {
  const duration = params.duration_days ?? 30;
  const teamSize = params.team_size ?? 3;
  const deliverableCount = params.deliverables?.length ?? 1;

  // Base task count from duration
  let baseTasks: number;
  if (duration <= 14) {
    baseTasks = 8;
  } else if (duration <= 30) {
    baseTasks = 15;
  } else if (duration <= 60) {
    baseTasks = 25;
  } else if (duration <= 90) {
    baseTasks = 35;
  } else {
    baseTasks = 50;
  }

  // Adjust for team size
  const teamMultiplier = 1 + (teamSize - 1) * 0.1;
  const teamAdjusted = Math.round(baseTasks * Math.min(teamMultiplier, 2.0));

  // Adjust for deliverables
  const deliverableBonus = (deliverableCount - 1) * 2;
  const total = teamAdjusted + deliverableBonus;

  // Calculate range (±25%)
  const range = Math.max(5, Math.round(total * 0.25));
  const min = Math.max(10, total - range);
  const max = total + range;

  // Calculate suggested phases based on duration
  let suggestedPhases: number;
  if (duration <= 14) {
    suggestedPhases = 4;
  } else if (duration <= 30) {
    suggestedPhases = 5;
  } else if (duration <= 60) {
    suggestedPhases = 6;
  } else if (duration <= 90) {
    suggestedPhases = 7;
  } else {
    suggestedPhases = 8;
  }

  // Clamp phases
  suggestedPhases = Math.max(4, Math.min(10, suggestedPhases));

  return { min, max, suggested_phases: suggestedPhases };
}

/**
 * Keep the original function for backward compatibility
 */
export function calculateTaskCountRange(daysRemaining: number | null): { min: number; max: number } {
  if (daysRemaining === null || daysRemaining <= 0) {
    return { min: 10, max: 20 };
  }
  
  if (daysRemaining <= 7) {
    return { min: 5, max: 10 };
  }
  
  if (daysRemaining <= 30) {
    return { min: 10, max: 20 };
  }
  
  if (daysRemaining <= 90) {
    return { min: 15, max: 30 };
  }
  
  return { min: 20, max: 40 };
}

// ============================================================================
// STRUCTURED PHASE GENERATION
// ============================================================================

/**
 * Generate suggested phases based on domain + project_type combinations.
 * This replaces the removed `getDomainPhases()` function.
 * 
 * Uses structured data (domain, project_type) to determine appropriate phases,
 * rather than keyword detection from descriptions.
 */
export function generatePhasesFromStructuredData(
  domain: string | null | undefined,
  projectType: string | null | undefined
): string[] {
  // Software domain
  if (domain === "software") {
    if (projectType === "mobile_app") {
      return [
        "Research & Planning",
        "UI/UX Design",
        "Frontend Development",
        "Backend Development",
        "API Integration",
        "Testing",
        "Deployment",
      ];
    }
    if (projectType === "web_app") {
      return [
        "Research & Planning",
        "UI/UX Design",
        "Frontend Development",
        "Backend Development",
        "Database Design",
        "Testing",
        "Deployment",
      ];
    }
    if (projectType === "platform") {
      return [
        "Research & Planning",
        "System Architecture",
        "Frontend Development",
        "Backend Development",
        "Infrastructure Setup",
        "Integration & Testing",
        "Deployment & Monitoring",
      ];
    }
    // General software
    return [
      "Planning & Requirements",
      "System Design",
      "Development",
      "Testing & QA",
      "Deployment",
      "Maintenance",
    ];
  }

  // Education domain
  if (domain === "education") {
    if (projectType === "training_program") {
      return [
        "Curriculum Design",
        "Material Development",
        "Trainer Recruitment",
        "Training Delivery",
        "Assessment & Feedback",
        "Program Evaluation",
      ];
    }
    if (projectType === "research") {
      return [
        "Literature Review",
        "Research Design",
        "Data Collection",
        "Data Analysis",
        "Report Writing",
        "Publication & Dissemination",
      ];
    }
    return [
      "Curriculum Design",
      "Material Development",
      "Training",
      "Implementation",
      "Assessment",
    ];
  }

  // Community domain
  if (domain === "community") {
    if (projectType === "campaign") {
      return [
        "Research & Planning",
        "Stakeholder Engagement",
        "Volunteer Recruitment",
        "Campaign Execution",
        "Impact Evaluation",
      ];
    }
    if (projectType === "event") {
      return [
        "Event Planning",
        "Logistics & Preparation",
        "Marketing & Promotion",
        "Event Execution",
        "Post-Event Follow-up",
      ];
    }
    if (projectType === "community_program") {
      return [
        "Needs Assessment",
        "Program Design",
        "Resource Mobilization",
        "Program Implementation",
        "Monitoring & Evaluation",
        "Sustainability Planning",
      ];
    }
    return [
      "Research",
      "Stakeholder Engagement",
      "Volunteer Recruitment",
      "Program Execution",
      "Impact Evaluation",
    ];
  }

  // Environmental domain
  if (domain === "environmental") {
    return [
      "Research & Assessment",
      "Strategy Development",
      "Community Engagement",
      "Action Execution",
      "Impact Measurement",
      "Reporting",
    ];
  }

  // Health domain
  if (domain === "health") {
    return [
      "Needs Assessment",
      "Program Design",
      "Resource Mobilization",
      "Pilot Implementation",
      "Full Deployment",
      "Outcome Evaluation",
    ];
  }

  // Startup domain
  if (domain === "startup") {
    if (projectType === "web_app" || projectType === "mobile_app") {
      return [
        "Problem Validation",
        "MVP Development",
        "User Testing",
        "Iteration & Refinement",
        "Launch Preparation",
        "Go-to-Market",
      ];
    }
    return [
      "Problem Validation",
      "Solution Design",
      "Prototype Development",
      "Market Testing",
      "Launch & Growth",
    ];
  }

  // Default fallback phases
  return [
    "Planning & Preparation",
    "Research & Analysis",
    "Implementation",
    "Review & Testing",
    "Delivery & Evaluation",
  ];
}

// ============================================================================
// CONTEXT BUILDING
// ============================================================================

/**
 * Build a comprehensive context string from project data for AI analysis.
 * Now includes all structured planning fields.
 */
export function buildProjectContext(context: ProjectContext): string {
  const daysRemaining = calculateDaysRemaining(context.endDate || "");
  
  // Use dynamic count if structured data available, otherwise fall back
  let taskRange: { min: number; max: number; suggested_phases?: number };
  if (context.domain || context.project_type || context.team_size || context.duration_days) {
    const dynamic = calculateDynamicTaskCount({
      duration_days: context.duration_days,
      team_size: context.team_size,
      project_type: context.project_type,
      deliverables: context.deliverables,
    });
    taskRange = dynamic;
  } else {
    const staticRange = calculateTaskCountRange(daysRemaining);
    taskRange = staticRange;
  }
  
  const existingTasksContext = context.existingTasks.length > 0
    ? `\n### Công việc đã tồn tại:\n${context.existingTasks.map((task, i) => `  ${i + 1}. "${task.title}" - ${task.description || "Không có mô tả"} (Trạng thái: ${task.status || "Không rõ"}, Ưu tiên: ${task.priority || "Không rõ"})`).join("\n")}`
    : "\n### Công việc đã tồn tại:\nKhông có công việc nào.";

  const teamContext = context.members.length > 0
    ? `\n### Thành viên nhóm (${context.members.length} người):\n${context.members.map((m, i) => `  ${i + 1}. ${m.name || m.email} - ${m.role || "Thành viên"}`).join("\n")}`
    : "\n### Thành viên nhóm:\nChưa có thành viên nào.";

  const activitiesContext = context.recentActivities.length > 0
    ? `\n### Hoạt động gần đây:\n${context.recentActivities.slice(0, 5).map((a, i) => `  ${i + 1}. ${a.action} (${new Date(a.createdAt).toLocaleDateString("vi-VN")})`).join("\n")}`
    : "\n### Hoạt động gần đây:\nChưa có hoạt động nào.";

  const pitchContext = context.pitchContent ? `\n### Nội dung Pitch:\n${context.pitchContent}` : "";
  const pitchAnalysisContext = context.pitchAIAnalysis ? `\n### Phân tích AI của Pitch:\n${context.pitchAIAnalysis}` : "";

  // NEW: Structured planning data context block
  const structuredContext = `
### THÔNG TIN LẬP KẾ HOẠCH CÓ CẤU TRÚC:
- Lĩnh vực (Domain): ${context.domain || "Không xác định"}
- Loại dự án (Project Type): ${context.project_type || "Không xác định"}
- Quy mô đội ngũ: ${context.team_size || context.members.length || "Không xác định"} người
- Kinh nghiệm đội ngũ: ${context.experience_level || "Không xác định"}
- Ngân sách: ${context.budget_range || "Không xác định"}
- Thời gian dự kiến: ${context.duration_days ? context.duration_days + " ngày" : "Không xác định"}

### MỤC TIÊU CHÍNH:
${context.main_goal || "Không xác định"}

### SẢN PHẨM BÀN GIAO (DELIVERABLES):
${(context.deliverables && context.deliverables.length > 0)
  ? context.deliverables.map((d, i) => `  ${i + 1}. ${d}`).join("\n")
  : "Chưa xác định"}

### ĐỐI TƯỢNG MỤC TIÊU:
${(context.target_audience && context.target_audience.length > 0)
  ? context.target_audience.map((a, i) => `  ${i + 1}. ${a}`).join("\n")
  : "Chưa xác định"}

### THƯỚC ĐO THÀNH CÔNG:
${(context.success_metrics && context.success_metrics.length > 0)
  ? context.success_metrics.map((m, i) => `  ${i + 1}. ${m.metric}: ${m.target}`).join("\n")
  : "Chưa xác định"}`;

  return `
# THÔNG TIN DỰ ÁN CHI TIẾT

## Tên dự án: ${context.title || "Chưa có"}
## Mô tả dự án: ${context.description || "Chưa có"}
## Trạng thái hiện tại: ${context.status || "Chưa xác định"}
## Thời gian:
- Ngày bắt đầu: ${context.startDate ? new Date(context.startDate).toLocaleDateString("vi-VN") : "Chưa xác định"}
- Ngày kết thúc: ${context.endDate ? new Date(context.endDate).toLocaleDateString("vi-VN") : "Chưa xác định"}
- Số ngày còn lại: ${daysRemaining !== null ? daysRemaining + " ngày" : "Chưa xác định"}
- Thời gian dự kiến: ${context.duration_days ? context.duration_days + " ngày" : "Chưa xác định"}
## Quy mô đội ngũ: ${context.members.length || context.team_size || 0} người
${structuredContext}
${teamContext}
${existingTasksContext}
${activitiesContext}
${pitchContext}
${pitchAnalysisContext}

# YÊU CẦU VỀ SỐ LƯỢNG TASK
Dựa trên thời gian, quy mô đội ngũ và deliverables, 
quy trình nên có từ ${taskRange.min} đến ${taskRange.max} task.
Số lượng phase đề xuất: ${taskRange.suggested_phases || 5} phase.`;
}

// ============================================================================
// PROMPT BUILDING
// ============================================================================

/**
 * Build the AI prompt for workflow generation.
 * Uses structured data directly instead of keyword-based domain detection.
 */
export function buildWorkflowGenerationPrompt(context: ProjectContext): string {
  const projectContext = buildProjectContext(context);
  const daysRemaining = calculateDaysRemaining(context.endDate || "");
  
  // Determine suggested phases from structured data
  const suggestedPhases = generatePhasesFromStructuredData(context.domain, context.project_type);
  
  // Calculate dynamic task count
  const dynamicCount = calculateDynamicTaskCount({
    duration_days: context.duration_days,
    team_size: context.team_size ?? context.members.length,
    project_type: context.project_type,
    deliverables: context.deliverables,
  });

  // Calculate team-adjusted task count
  const teamSize = context.team_size ?? (context.members.length || 2);
  const baseTaskCount = Math.floor((dynamicCount.min + dynamicCount.max) / 2);
  const teamAdjustedTaskCount = Math.max(dynamicCount.min, Math.min(dynamicCount.max, 
    Math.round(baseTaskCount * (1 + (teamSize - 2) * 0.15))
  ));

  const phasesContext = suggestedPhases.length > 0
    ? `\n### CÁC PHA ĐỀ XUẤT CHO DỰ ÁN NÀY:\n${suggestedPhases.map((p, i) => `  Phase ${i + 1}: ${p}`).join("\n")}`
    : "";

  return `${VIETNAMESE_SYSTEM_PROMPT}

Bạn là một Quản lý Dự án Cấp cao (Senior Project Manager) với hơn 10 năm kinh nghiệm trong việc lập kế hoạch và triển khai các dự án cộng đồng, giáo dục, và công nghệ.

Nhiệm vụ của bạn là phân tích sâu sắc thông tin dự án và tạo ra một quy trình làm việc CHI TIẾT, CỤ THỂ, và CÓ THỂ THỰC HIỆN ĐƯỢC.

${projectContext}

# PHÂN TÍCH DỰ ÁN

Trước khi tạo quy trình, bạn PHẢI thực hiện phân tích nội bộ:
1. Xác định mục tiêu cuối cùng: Dự án cần tạo ra sản phẩm/kết quả gì cụ thể?
2. Liệt kê deliverables chính: Những đầu việc cụ thể nào cần được giao?
3. Phân chia công việc: Chia nhỏ deliverables thành các task có thể thực hiện
4. Ước lượng thời gian: Mỗi task cần bao nhiêu thời gian?
5. Xác định phụ thuộc: Task nào cần hoàn thành trước?
6. Phân bổ nguồn lực: Ai phù hợp cho mỗi task?

${phasesContext}

# THÔNG TIN LĨNH VỰC CHI TIẾT
Dự án thuộc lĩnh vực "${context.domain || "cộng đồng"}" và loại "${context.project_type || "chung"}". 
Sử dụng thông tin này để tạo các task và milestone phù hợp.

# QUY TẮC BẮT BUỘC

## 1. KHÔNG sử dụng các task chung chung như:
- "Planning", "Preparation", "Implementation", "Evaluation", "Research", "Analysis"
- "Nghiên cứu", "Lập kế hoạch", "Chuẩn bị", "Triển khai", "Đánh giá", "Phân tích"

## 2. Task PHẢI cụ thể và liên quan đến lĩnh vực và loại dự án:
- Dự án "${context.domain}" + "${context.project_type}" cần các task đặc thù
- Sử dụng deliverables đã liệt kê để tạo task cụ thể
- Mỗi task phải gắn với một deliverable cụ thể

## 3. Số lượng task phải phù hợp với thông tin lập kế hoạch:
- Quy mô đội ngũ: ${teamSize} người
- Thời gian: ${context.duration_days ? context.duration_days + " ngày" : (daysRemaining !== null ? daysRemaining + " ngày" : "không xác định")}
- Số task đề xuất: ${teamAdjustedTaskCount} task
- Số phase đề xuất: ${dynamicCount.suggested_phases} phase
- Mỗi thành viên có thể xử lý 2-3 task song song

## 4. Mỗi task phải có:
- Tiêu đề rõ ràng (động từ + tân ngữ cụ thể, mô tả công nghệ/công cụ nếu có)
- Mô tả ngắn gọn nhưng đủ chi tiết để thực hiện
- Mức độ ưu tiên (Low/Medium/High/Important)
- Thời gian ước lượng (số ngày, phải thực tế với độ phức tạp)
- Người phụ trách (Team Leader/Team Member/Mentor)
- Các task phụ thuộc (nếu có, chỉ chứa tên task đã được liệt kê)

## 5. Milestones phải có ít nhất ${dynamicCount.suggested_phases} cột mốc, bao phủ toàn bộ timeline:
- Mỗi milestone đại diện cho một phase quan trọng
- Target date phải nằm trong khoảng start_date đến end_date
- Tasks trong milestone phải logic với objective của milestone

# ĐỊNH DẠNG ĐẦU RA JSON

{
  "project_understanding": "Phân tích sâu sắc về dự án, bao gồm domain, mục tiêu, và thách thức chính",
  "key_deliverables": ["Deliverable cụ thể 1", "Deliverable cụ thể 2", "Deliverable cụ thể 3", "Deliverable cụ thể 4"],
  "milestones": [
    {
      "name": "Tên cột mốc (dựa trên phase đề xuất)",
      "description": "Mô tả chi tiết cột mốc này đạt được điều gì",
      "target_date": "YYYY-MM-DD",
      "tasks": ["Tên task 1", "Tên task 2", "Tên task 3"]
    }
  ],
  "tasks": [
    {
      "title": "Tên task cụ thể",
      "description": "Mô tả chi tiết công việc cần làm",
      "priority": "Low|Medium|High|Important",
      "estimated_days": 2,
      "assignee_type": "Team Leader|Team Member|Mentor",
      "depends_on": ["Tên task phụ thuộc"]
    }
  ],
  "workflow_risks": [
    {
      "risk": "Mô tả rủi ro cụ thể dựa trên quy mô và thời gian",
      "impact": "Ảnh hưởng cụ thể đến dự án",
      "mitigation": "Biện pháp giảm thiểu thực tế",
      "severity": "low|medium|high"
    }
  ],
  "success_metrics": [
    {
      "kpi": "Chỉ số đo lường cụ thể",
      "measurement_method": "Cách đo lường thực tế",
      "target_value": "Giá trị mục tiêu định lượng"
    }
  ]
}

# LƯU Ý QUAN TRỌNG
1. Tất cả nội dung phải bằng tiếng Việt
2. Task titles phải là động từ + tân ngữ cụ thể
3. Dependencies chỉ chứa tên task đã được liệt kê trong danh sách tasks
4. Estimated_days phải là số nguyên dương, thực tế với độ phức tạp
5. Tổng estimated_days của tất cả tasks không được vượt quá người-ngày cho phép
6. Phải có ít nhất ${Math.max(5, Math.ceil(teamAdjustedTaskCount * 0.3))} tasks để đảm bảo coverage
7. Ưu tiên CHẤT LƯỢNG hơn số lượng - mỗi task phải có ý nghĩa thực tế
8. Dựa vào deliverables và thước đo thành công để xác định xem dự án thành công hay thất bại

Hãy phân tích kỹ và tạo quy trình chất lượng cao, thực tế, phù hợp với dự án "${context.domain || "cộng đồng"}" loại "${context.project_type || "chung"}".`;
}

// ============================================================================
// RESPONSE VALIDATION
// ============================================================================

/**
 * Validate the AI response structure and content
 */
export function validateAIWorkflowResponse(
  response: any,
  requirements: {
    minPhases: number;
    minTasks: number;
    minMilestones: number;
    minRisks: number;
    minSuccessMetrics: number;
    minDeliverables: number;
  }
): {
  valid: boolean;
  errors: string[];
  sanitized: Partial<AIWorkflowResult> | null;
} {
  const errors: string[] = [];

  if (!response || typeof response !== "object") {
    return { valid: false, errors: ["Response is not an object"], sanitized: null };
  }

  if (!response.project_understanding || typeof response.project_understanding !== "string") {
    errors.push("Missing or invalid project_understanding");
  }

  // Validate deliverables with minimum count
  if (!Array.isArray(response.key_deliverables) || response.key_deliverables.length < requirements.minDeliverables) {
    errors.push(
      `Insufficient deliverables: ${response.key_deliverables?.length ?? 0}/${requirements.minDeliverables} minimum`
    );
  }

  // Validate milestones with minimum count
  if (!Array.isArray(response.milestones) || response.milestones.length < requirements.minMilestones) {
    errors.push(
      `Insufficient milestones: ${response.milestones?.length ?? 0}/${requirements.minMilestones} minimum`
    );
  }

  // Validate tasks with minimum count
  if (!Array.isArray(response.tasks) || response.tasks.length < requirements.minTasks) {
    errors.push(
      `Insufficient tasks: ${response.tasks?.length ?? 0}/${requirements.minTasks} minimum`
    );
  }

  // Validate each task
  if (Array.isArray(response.tasks)) {
    response.tasks.forEach((task: any, index: number) => {
      if (!task.title || typeof task.title !== "string") {
        errors.push(`Task ${index + 1}: Missing title`);
      }
      if (!task.description || typeof task.description !== "string") {
        errors.push(`Task ${index + 1}: Missing description`);
      }
      if (!["Low", "Medium", "High", "Important"].includes(task.priority)) {
        errors.push(`Task ${index + 1}: Invalid priority "${task.priority}"`);
      }
      if (typeof task.estimated_days !== "number" || task.estimated_days < 1) {
        errors.push(`Task ${index + 1}: Invalid estimated_days`);
      }
      if (!["Team Leader", "Team Member", "Mentor"].includes(task.assignee_type)) {
        errors.push(`Task ${index + 1}: Invalid assignee_type "${task.assignee_type}"`);
      }
    });
  }

  // Validate milestones
  if (Array.isArray(response.milestones)) {
    response.milestones.forEach((milestone: any, index: number) => {
      if (!milestone.name || typeof milestone.name !== "string") {
        errors.push(`Milestone ${index + 1}: Missing name`);
      }
      if (!Array.isArray(milestone.tasks) || milestone.tasks.length === 0) {
        errors.push(`Milestone ${index + 1}: Missing or empty tasks array`);
      }
    });
  }

  // Validate risks with minimum count
  if (!Array.isArray(response.workflow_risks) || response.workflow_risks.length < requirements.minRisks) {
    errors.push(
      `Insufficient risks: ${response.workflow_risks?.length ?? 0}/${requirements.minRisks} minimum`
    );
  }

  // Validate success metrics with minimum count
  if (!Array.isArray(response.success_metrics) || response.success_metrics.length < requirements.minSuccessMetrics) {
    errors.push(
      `Insufficient success metrics: ${response.success_metrics?.length ?? 0}/${requirements.minSuccessMetrics} minimum`
    );
  }

  if (errors.length > 0) {
    return { valid: false, errors, sanitized: null };
  }

  // Sanitize and convert to our internal format
  const sanitized: AIWorkflowResult = {
    projectUnderstanding: response.project_understanding,
    keyDeliverables: response.key_deliverables,
    milestones: response.milestones.map((m: any) => ({
      name: m.name,
      description: m.description || "",
      targetDate: m.target_date,
      tasks: m.tasks || [],
    })),
    tasks: response.tasks.map((task: any) => ({
      title: task.title,
      description: task.description,
      priority: task.priority,
      estimatedDays: task.estimated_days,
      assigneeType: task.assignee_type,
      dependsOn: task.depends_on || [],
    })),
    workflowRisks: Array.isArray(response.workflow_risks)
      ? response.workflow_risks.map((r: any) => ({
          risk: r.risk,
          impact: r.impact,
          mitigation: r.mitigation,
          severity: r.severity || "medium",
        }))
      : [],
    successMetrics: Array.isArray(response.success_metrics)
      ? response.success_metrics.map((m: any) => ({
          kpi: m.kpi,
          measurementMethod: m.measurement_method,
          targetValue: m.target_value,
        }))
      : [],
  };

  return { valid: true, errors: [], sanitized };
}

// ============================================================================
// WORKFLOW QUALITY VALIDATION
// ============================================================================

/**
 * Validate generated workflow quality before saving.
 * Ensures minimum standards are met.
 */
export function validateWorkflowQuality(
  workflow: {
    milestones: AIGeneratedMilestone[];
    tasks: AIGeneratedTask[];
    workflowRisks?: WorkflowRisk[];
    successMetrics?: SuccessMetric[];
    keyDeliverables?: string[];
  },
  requirements?: {
    minPhases: number;
    minTasks: number;
    minMilestones: number;
    minRisks: number;
    minSuccessMetrics: number;
    minDeliverables: number;
  }
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Use provided requirements or defaults
  const minPhases = requirements?.minPhases ?? 4;
  const minTasks = requirements?.minTasks ?? 10;
  const minMilestones = requirements?.minMilestones ?? 4;
  const minRisks = requirements?.minRisks ?? 3;
  const minSuccessMetrics = requirements?.minSuccessMetrics ?? 3;
  const minDeliverables = requirements?.minDeliverables ?? 2;

  // Check minimum phases (milestones)
  if (workflow.milestones.length < minPhases) {
    errors.push(
      `Insufficient phases: ${workflow.milestones.length}/${minPhases} minimum`
    );
  }

  // Check minimum tasks
  if (workflow.tasks.length < minTasks) {
    errors.push(
      `Insufficient tasks: ${workflow.tasks.length}/${minTasks} minimum`
    );
  }

  // Check minimum deliverables
  if (workflow.keyDeliverables && workflow.keyDeliverables.length < minDeliverables) {
    errors.push(
      `Insufficient deliverables: ${workflow.keyDeliverables.length}/${minDeliverables} minimum`
    );
  }

  // Check minimum risks
  if (workflow.workflowRisks && workflow.workflowRisks.length < minRisks) {
    errors.push(
      `Insufficient risks: ${workflow.workflowRisks.length}/${minRisks} minimum`
    );
  }

  // Check minimum success metrics
  if (workflow.successMetrics && workflow.successMetrics.length < minSuccessMetrics) {
    errors.push(
      `Insufficient success metrics: ${workflow.successMetrics.length}/${minSuccessMetrics} minimum`
    );
  }

  // Check every phase has tasks assigned
  const phasesWithoutTasks = workflow.milestones.filter((m) => m.tasks.length === 0);
  if (phasesWithoutTasks.length > 0) {
    errors.push(`Phases without tasks: ${phasesWithoutTasks.map((m) => m.name).join(", ")}`);
  }

  // Check for generic tasks
  const genericCount = countGenericTasks(workflow.tasks);
  const totalTasks = workflow.tasks.length;
  const genericRatio = totalTasks > 0 ? genericCount / totalTasks : 0;
  if (genericRatio > 0.3) {
    errors.push(
      `Too many generic tasks: ${genericCount}/${totalTasks} (${Math.round(genericRatio * 100)}%)`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// GENERIC TASK DETECTION
// ============================================================================

/**
 * List of generic task patterns that should be avoided
 */
const GENERIC_TASK_PATTERNS = [
  /^planning$/i,
  /^preparation$/i,
  /^implementation$/i,
  /^evaluation$/i,
  /^research$/i,
  /^analysis$/i,
  /^nghiên cứu$/i,
  /^lập kế hoạch$/i,
  /^chuẩn bị$/i,
  /^triển khai$/i,
  /^đánh giá$/i,
  /^phân tích$/i,
  /^thực hiện$/i,
];

/**
 * Check if a task title is too generic
 */
export function isGenericTask(title: string): boolean {
  const trimmed = title.trim().toLowerCase();
  return GENERIC_TASK_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/**
 * Count how many tasks are generic
 */
export function countGenericTasks(tasks: AIGeneratedTask[]): number {
  return tasks.filter((task) => isGenericTask(task.title)).length;
}

// ============================================================================
// FALLBACK TEMPLATE GENERATION
// ============================================================================

/**
 * Generate a fallback workflow when AI fails.
 * Now uses structured data to create more relevant fallback content.
 */
export function generateFallbackWorkflow(
  projectTitle: string,
  projectDescription: string,
  daysRemaining: number | null,
  structuredData?: {
    domain?: string | null;
    project_type?: string | null;
    team_size?: number | null;
    duration_days?: number | null;
    deliverables?: string[];
    main_goal?: string | null;
  }
): AIWorkflowResult {
  const taskCountRange = calculateTaskCountRange(daysRemaining);
  const targetTasks = Math.floor((taskCountRange.min + taskCountRange.max) / 2);

  // Use structured data to generate relevant phases
  const suggestedPhases = generatePhasesFromStructuredData(
    structuredData?.domain,
    structuredData?.project_type
  );

  // Generate milestones from phases
  const milestones = suggestedPhases.map((phase, index) => ({
    name: phase,
    description: `Phase ${index + 1}: ${phase} - Thực hiện các công việc trong giai đoạn này`,
    targetDate: undefined as string | undefined,
    tasks: [] as string[],
  }));

  // Create specific tasks based on deliverables if available
  const tasks = [
    {
      title: "Xác định phạm vi và mục tiêu dự án",
      description: structuredData?.main_goal || "Làm rõ những gì cần đạt được",
      priority: "High" as const,
      estimatedDays: 2,
      assigneeType: "Team Leader" as const,
      dependsOn: [] as string[],
    },
    {
      title: "Lập kế hoạch chi tiết các công việc",
      description: "Chia nhỏ công việc thành các task cụ thể",
      priority: "High" as const,
      estimatedDays: 3,
      assigneeType: "Team Leader" as const,
      dependsOn: ["Xác định phạm vi và mục tiêu dự án"],
    },
    {
      title: "Phân công nhiệm vụ cho thành viên",
      description: "Giao việc dựa trên năng lực từng người",
      priority: "Medium" as const,
      estimatedDays: 1,
      assigneeType: "Team Leader" as const,
      dependsOn: ["Lập kế hoạch chi tiết các công việc"],
    },
    ...(structuredData?.domain
      ? [
          {
            title: `Triển khai các công việc ${structuredData.domain === "software" ? "phát triển" : structuredData.domain === "education" ? "giáo dục" : "cộng đồng"}`,
            description: `Thực hiện các công việc chính trong lĩnh vực ${structuredData.domain}`,
            priority: "High" as const,
            estimatedDays: Math.max(3, Math.floor(targetTasks * 0.2)),
            assigneeType: "Team Member" as const,
            dependsOn: ["Phân công nhiệm vụ cho thành viên"],
          },
        ]
      : [
          {
            title: "Thực hiện công việc theo kế hoạch",
            description: "Triển khai các hoạt động đã lên kế hoạch",
            priority: "High" as const,
            estimatedDays: Math.max(5, Math.floor(targetTasks * 2)),
            assigneeType: "Team Member" as const,
            dependsOn: ["Phân công nhiệm vụ cho thành viên"],
          },
        ]),
    {
      title: "Tổ chức họp tiến độ hàng tuần",
      description: "Cập nhật tình hình và giải quyết vướng mắc",
      priority: "Medium" as const,
      estimatedDays: 1,
      assigneeType: "Team Leader" as const,
      dependsOn: ["Phân công nhiệm vụ cho thành viên"],
    },
    {
      title: "Kiểm tra chất lượng sản phẩm trung gian",
      description: "Đánh giá và điều chỉnh nếu cần",
      priority: "High" as const,
      estimatedDays: 2,
      assigneeType: "Team Leader" as const,
      dependsOn: ["Phân công nhiệm vụ cho thành viên"],
    },
    {
      title: "Hoàn thiện sản phẩm cuối cùng",
      description: "Tổng hợp và hoàn thiện kết quả",
      priority: "Important" as const,
      estimatedDays: 3,
      assigneeType: "Team Member" as const,
      dependsOn: ["Kiểm tra chất lượng sản phẩm trung gian"],
    },
    {
      title: "Chuẩn bị báo cáo tổng kết",
      description: "Viết báo cáo kết quả dự án",
      priority: "Medium" as const,
      estimatedDays: 2,
      assigneeType: "Team Leader" as const,
      dependsOn: ["Hoàn thiện sản phẩm cuối cùng"],
    },
    {
      title: "Tổ chức buổi tổng kết dự án",
      description: "Chia sẻ kết quả và bài học kinh nghiệm",
      priority: "Low" as const,
      estimatedDays: 1,
      assigneeType: "Team Leader" as const,
      dependsOn: ["Chuẩn bị báo cáo tổng kết"],
    },
  ];

  // Assign tasks to milestones
  const tasksPerPhase = Math.max(1, Math.ceil(tasks.length / milestones.length));
  milestones.forEach((milestone, index) => {
    const startIdx = index * tasksPerPhase;
    const endIdx = Math.min(startIdx + tasksPerPhase, tasks.length);
    milestone.tasks = tasks.slice(startIdx, endIdx).map((t) => t.title);
  });

  return {
    projectUnderstanding: `Dự án "${projectTitle}"${structuredData?.main_goal ? `: ${structuredData.main_goal}` : ""} cần được phân tích chi tiết hơn. Dựa trên thông tin hiện có, quy trình này được tạo từ template.`,
    keyDeliverables: structuredData?.deliverables?.length
      ? structuredData.deliverables
      : [
          "Kế hoạch dự án chi tiết",
          "Báo cáo tiến độ hàng tuần",
          "Sản phẩm cuối cùng của dự án",
        ],
    milestones,
    tasks,
    workflowRisks: [
      {
        risk: "Chậm tiến độ do thiếu nguồn lực",
        impact: "Có thể làm trễ ngày bàn giao",
        mitigation: "Theo dõi sát tiến độ và điều chỉnh kịp thời",
        severity: "medium" as const,
      },
      {
        risk: "Phạm vi dự án không rõ ràng",
        impact: "Dễ dẫn đến làm sai lệch mục tiêu",
        mitigation: "Xác định rõ phạm vi ngay từ đầu",
        severity: "high" as const,
      },
    ],
    successMetrics: [
      {
        kpi: "Tỷ lệ hoàn thành task",
        measurementMethod: "Theo dõi trong hệ thống quản lý",
        targetValue: "> 90%",
      },
      {
        kpi: "Đúng thời hạn",
        measurementMethod: "So sánh ngày hoàn thành thực tế với kế hoạch",
        targetValue: "100% milestone đúng hạn",
      },
    ],
  };
}