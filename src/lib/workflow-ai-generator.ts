/**
 * AI Workflow Generator Module
 * 
 * This module provides AI-driven workflow generation that analyzes project content
 * to create customized workflows instead of using template-based approaches.
 * 
 * Key Features:
 * - Analyzes all project data (title, description, dates, tasks, members, activities)
 * - Infers project goals, deliverables, milestones, and tasks
 * - Adjusts task count based on remaining timeline
 * - Generates specific, actionable tasks (not generic templates)
 * - Includes fallback to template-based generation when AI fails
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
// TASK COUNT CALCULATION BASED ON TIMELINE
// ============================================================================

/**
 * Calculate the recommended number of tasks based on remaining days
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
// CONTEXT BUILDING
// ============================================================================

/**
 * Build a comprehensive context string from project data for AI analysis
 */
export function buildProjectContext(context: ProjectContext): string {
  const daysRemaining = calculateDaysRemaining(context.endDate || "");
  const taskCountRange = calculateTaskCountRange(daysRemaining);
  
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

  return `
# THÔNG TIN DỰ ÁN CHI TIẾT

## Tên dự án: ${context.title || "Chưa có"}
## Mô tả dự án: ${context.description || "Chưa có"}
## Trạng thái hiện tại: ${context.status || "Chưa xác định"}
## Thời gian:
- Ngày bắt đầu: ${context.startDate ? new Date(context.startDate).toLocaleDateString("vi-VN") : "Chưa xác định"}
- Ngày kết thúc: ${context.endDate ? new Date(context.endDate).toLocaleDateString("vi-VN") : "Chưa xác định"}
- Số ngày còn lại: ${daysRemaining !== null ? daysRemaining + " ngày" : "Chưa xác định"}
## Quy mô đội ngũ: ${context.members.length} người
${teamContext}
${existingTasksContext}
${activitiesContext}
${pitchContext}
${pitchAnalysisContext}

# YÊU CẦU VỀ SỐ LƯỢNG TASK
Dựa trên thời gian còn lại (${daysRemaining !== null ? daysRemaining + " ngày" : "không xác định"}), 
quy trình nên có từ ${taskCountRange.min} đến ${taskCountRange.max} task.`;
}

// ============================================================================
// PROMPT BUILDING
// ============================================================================

/**
 * Detect the project domain based on title, description, and keywords
 */
export function detectProjectDomain(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  
  // Communication/Social apps
  if (text.includes('communication') || text.includes('messaging') || text.includes('chat') || 
      text.includes('social') || text.includes('connect') || text.includes('giao tiếp') || 
      text.includes('nhắn tin') || text.includes('trò chuyện') || text.includes('cộng đồng') ||
      text.includes('học sinh') || text.includes('sinh viên')) {
    return 'communication-app';
  }
  
  // Education/Learning platforms
  if (text.includes('education') || text.includes('learning') || text.includes('course') || 
      text.includes('stem') || text.includes('giáo dục') || text.includes('học tập') || 
      text.includes('khóa học') || text.includes('đào tạo') || text.includes('giảng dạy')) {
    return 'education-platform';
  }
  
  // Event management
  if (text.includes('event') || text.includes('contest') || text.includes('competition') || 
      text.includes('conference') || text.includes('sự kiện') || text.includes('cuộc thi') || 
      text.includes('hội thi') || text.includes('văn hóa') || text.includes('nghệ thuật')) {
    return 'event-management';
  }
  
  // AI/Tech products
  if (text.includes('ai') || text.includes('artificial intelligence') || text.includes('machine learning') || 
      text.includes('platform') || text.includes('trí tuệ nhân tạo') || text.includes('học máy') || 
      text.includes('nền tảng') || text.includes('phần mềm') || text.includes('ứng dụng')) {
    return 'ai-tech-product';
  }
  
  // Environmental/Sustainability
  if (text.includes('environment') || text.includes('sustainable') || text.includes('green') || 
      text.includes('recycling') || text.includes('môi trường') || text.includes('bền vững') || 
      text.includes('xanh') || text.includes('tái chế')) {
    return 'environmental-project';
  }
  
  // Healthcare/Wellness
  if (text.includes('health') || text.includes('medical') || text.includes('wellness') || 
      text.includes('sức khỏe') || text.includes('y tế') || text.includes('chăm sóc')) {
    return 'healthcare-project';
  }
  
  // Default: General community project
  return 'community-project';
}

/**
 * Get domain-specific phases and task guidance
 */
export function getDomainPhases(domain: string): { phases: string[]; taskGuidance: string } {
  const domainConfigs: Record<string, { phases: string[]; taskGuidance: string }> = {
    'communication-app': {
      phases: [
        'Requirements & Planning',
        'UI/UX Design',
        'Database Design',
        'Authentication System',
        'Core Messaging Features',
        'Notifications System',
        'Testing & QA',
        'Deployment & Launch'
      ],
      taskGuidance: `# ĐẶC THÙ ỨNG DỤNG GIAO TIẾP
Dự án này là ứng dụng giao tiếp, cần tập trung vào:
- **Authentication**: Đăng ký, đăng nhập, xác thực (email, phone, social)
- **Messaging**: Gửi tin nhắn, nhận tin, lưu trữ, đồng bộ
- **Notifications**: Thông báo realtime, push notifications
- **User Management**: Hồ sơ người dùng, danh sách bạn bè
- **Safety**: Kiểm duyệt nội dung, báo cáo, chặn người dùng
- **Performance**: Xử lý concurrent users, message delivery guarantee`
    },
    'education-platform': {
      phases: [
        'Curriculum Planning',
        'Content Development',
        'Platform Setup',
        'Pilot Testing',
        'Full Rollout',
        'Evaluation & Improvement'
      ],
      taskGuidance: `# ĐẶC THÙ NỀN TẢNG GIÁO DỤC
Dự án giáo dục cần tập trung vào:
- **Content Creation**: Bài giảng, bài tập, tài liệu học
- **User Roles**: Học sinh, giáo viên, admin
- **Progress Tracking**: Theo dõi tiến độ học tập
- **Assessment**: Kiểm tra, đánh giá, chấm điểm
- **Engagement**: Gamification, badges, leaderboards`
    },
    'event-management': {
      phases: [
        'Event Planning',
        'Venue & Logistics',
        'Marketing & Promotion',
        'Registration Setup',
        'Event Execution',
        'Post-Event Wrap-up'
      ],
      taskGuidance: `# ĐẶC THÙ QUẢN LÝ SỰ KIỆN
Dự án sự kiện cần tập trung vào:
- **Planning**: Lịch trình, ngân sách, nhân sự
- **Marketing**: Truyền thông, quảng bá, social media
- **Registration**: Form đăng ký, xác nhận, ticketing
- **Logistics**: Địa điểm, thiết bị, ăn uống
- **Execution**: Điều phối ngày sự kiện
- **Documentation**: Chụp ảnh, quay video, báo cáo`
    },
    'ai-tech-product': {
      phases: [
        'Requirements Analysis',
        'System Architecture',
        'AI Model Development',
        'Backend Development',
        'Frontend Development',
        'Integration & Testing',
        'Deployment & Monitoring'
      ],
      taskGuidance: `# ĐẶC THÙ SẢN PHẨM AI/CÔNG NGHỆ
Dự án AI/tech cần tập trung vào:
- **AI/ML**: Model training, API integration, prompt engineering
- **Backend**: API design, database schema, authentication
- **Frontend**: Responsive UI, real-time updates, accessibility
- **Infrastructure**: Cloud deployment, scaling, monitoring
- **Security**: Data protection, API security, rate limiting`
    },
    'environmental-project': {
      phases: [
        'Research & Assessment',
        'Strategy Development',
        'Implementation Planning',
        'Community Engagement',
        'Action Execution',
        'Impact Measurement'
      ],
      taskGuidance: `# ĐẶC THÙ DỰ ÁN MÔI TRƯỜNG
Dự án môi trường cần tập trung vào:
- **Research**: Khảo sát, thu thập dữ liệu
- **Planning**: Chiến lược, lộ trình thực hiện
- **Community**: Tuyên truyền, vận động, giáo dục
- **Action**: Hoạt động thực tế, triển khai
- **Measurement**: Đánh giá tác động, báo cáo`
    },
    'healthcare-project': {
      phases: [
        'Needs Assessment',
        'Program Design',
        'Resource Mobilization',
        'Pilot Implementation',
        'Full Deployment',
        'Outcome Evaluation'
      ],
      taskGuidance: `# ĐẶC THÙ DỰ ÁN Y TẾ/SỨC KHỎE
Dự án y tế cần tập trung vào:
- **Assessment**: Đánh giá nhu cầu, khảo sát
- **Compliance**: Tuân thủ quy định y tế
- **Privacy**: Bảo mật thông tin bệnh nhân
- **Quality**: Đảm bảo chất lượng dịch vụ
- **Training**: Đào tạo nhân viên, tình nguyện viên`
    },
    'community-project': {
      phases: [
        'Project Initiation',
        'Planning & Design',
        'Resource Preparation',
        'Implementation',
        'Monitoring & Control',
        'Closure & Evaluation'
      ],
      taskGuidance: `# ĐẶC THÙ DỰ ÁN CỘNG ĐỒNG
Dự án cộng đồng cần tập trung vào:
- **Stakeholder Engagement**: Thu hút người tham gia
- **Resource Management**: Quản lý ngân sách, nhân lực
- **Communication**: Truyền thông nội bộ và bên ngoài
- **Impact Measurement**: Đánh giá tác động cộng đồng`
    }
  };
  
  return domainConfigs[domain] || domainConfigs['community-project'];
}

/**
 * Build the AI prompt for workflow generation
 */
export function buildWorkflowGenerationPrompt(context: ProjectContext): string {
  const projectContext = buildProjectContext(context);
  const daysRemaining = calculateDaysRemaining(context.endDate || "");
  const taskCountRange = calculateTaskCountRange(daysRemaining);
  const domain = detectProjectDomain(context.title, context.description);
  const domainConfig = getDomainPhases(domain);

  // Calculate team-adjusted task count
  const teamSize = context.members.length || 2;
  const baseTaskCount = Math.floor((taskCountRange.min + taskCountRange.max) / 2);
  const teamAdjustedTaskCount = Math.max(taskCountRange.min, Math.min(taskCountRange.max, 
    Math.round(baseTaskCount * (1 + (teamSize - 2) * 0.15))
  ));

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

${domainConfig.taskGuidance}

# QUY TẮC BẮT BUỘC

## 1. KHÔNG sử dụng các task chung chung như:
- "Planning", "Preparation", "Implementation", "Evaluation", "Research", "Analysis"
- "Nghiên cứu", "Lập kế hoạch", "Chuẩn bị", "Triển khai", "Đánh giá", "Phân tích"

## 2. Task PHẢI cụ thể và liên quan đến domain:
✅ TỐT (cho app giao tiếp): "Thiết kế database schema cho users và messages"
❌ KHÔNG TỐT: "Lập kế hoạch database"

✅ TỐT (cho app giao tiếp): "Implement real-time messaging với WebSocket"
❌ KHÔNG TỐT: "Xây dựng tính năng chat"

✅ TỐT (cho app giao tiếp): "Tích hợp Firebase Authentication cho đăng nhập"
❌ KHÔNG TỐT: "Làm authentication"

## 3. Số lượng task phải phù hợp với timeline và team size:
- Team size: ${teamSize} người
- Thời gian: ${daysRemaining !== null ? daysRemaining + " ngày" : "không xác định"}
- Số task đề xuất: ${teamAdjustedTaskCount} task (đã điều chỉnh theo team size)
- Mỗi thành viên có thể xử lý 2-3 task song song

## 4. Mỗi task phải có:
- Tiêu đề rõ ràng (động từ + tân ngữ cụ thể, mô tả công nghệ/công cụ nếu có)
- Mô tả ngắn gọn nhưng đủ chi tiết để thực hiện
- Mức độ ưu tiên (Low/Medium/High/Important)
- Thời gian ước lượng (số ngày, phải thực tế với độ phức tạp)
- Người phụ trách (Team Leader/Team Member/Mentor)
- Các task phụ thuộc (nếu có, chỉ chứa tên task đã được liệt kê)

## 5. Milestones phải có ít nhất 5 cột mốc, bao phủ toàn bộ timeline:
- Mỗi milestone đại diện cho một phase quan trọng
- Target date phải nằm trong khoảng start_date đến end_date
- Tasks trong milestone phải logic với objective của milestone

# ĐỊNH DẠNG ĐẦU RA JSON

{
  "project_understanding": "Phân tích sâu sắc về dự án, bao gồm domain, mục tiêu, và thách thức chính",
  "key_deliverables": ["Deliverable cụ thể 1", "Deliverable cụ thể 2", "Deliverable cụ thể 3", "Deliverable cụ thể 4"],
  "milestones": [
    {
      "name": "Tên cột mốc (ngắn gọn, rõ ràng)",
      "description": "Mô tả chi tiết cột mốc này đạt được điều gì",
      "target_date": "YYYY-MM-DD",
      "tasks": ["Tên task 1", "Tên task 2", "Tên task 3"]
    }
  ],
  "tasks": [
    {
      "title": "Tên task cụ thể (ví dụ: 'Thiết kế UI wireframes cho màn hình chat')",
      "description": "Mô tả chi tiết công việc cần làm, bao gồm công cụ/công nghệ nếu có",
      "priority": "Low|Medium|High|Important",
      "estimated_days": 2,
      "assignee_type": "Team Leader|Team Member|Mentor",
      "depends_on": ["Tên task phụ thuộc"]
    }
  ],
  "workflow_risks": [
    {
      "risk": "Mô tả rủi ro cụ thể",
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
2. Task titles phải là động từ + tân ngữ cụ thể, có thể bao gồm công nghệ/công cụ
3. Dependencies chỉ chứa tên task đã được liệt kê trong danh sách tasks
4. Estimated_days phải là số nguyên dương, thực tế với độ phức tạp
5. Tổng estimated_days của tất cả tasks không được vượt quá ${daysRemaining !== null ? daysRemaining * teamSize : 'không giới hạn'} người-ngày
6. Phải có ít nhất ${Math.max(5, Math.ceil(teamAdjustedTaskCount * 0.3))} tasks để đảm bảo coverage
7. Ưu tiên CHẤT LƯỢNG hơn số lượng - mỗi task phải có ý nghĩa thực tế

Hãy phân tích kỹ và tạo quy trình chất lượng cao, thực tế, phù hợp với domain "${domain}" của dự án.`;
}

// ============================================================================
// RESPONSE VALIDATION
// ============================================================================

/**
 * Validate the AI response structure and content
 */
export function validateAIWorkflowResponse(response: any): {
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

  if (!Array.isArray(response.key_deliverables) || response.key_deliverables.length === 0) {
    errors.push("Missing or empty key_deliverables");
  }

  if (!Array.isArray(response.milestones) || response.milestones.length === 0) {
    errors.push("Missing or empty milestones");
  }

  if (!Array.isArray(response.tasks) || response.tasks.length === 0) {
    errors.push("Missing or empty tasks");
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
      if (!Array.isArray(milestone.tasks)) {
        errors.push(`Milestone ${index + 1}: Missing tasks array`);
      }
    });
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
 * Generate a basic fallback workflow when AI fails
 * This should only be used as a last resort
 */
export function generateFallbackWorkflow(
  projectTitle: string,
  projectDescription: string,
  daysRemaining: number | null
): AIWorkflowResult {
  const taskCountRange = calculateTaskCountRange(daysRemaining);
  const targetTasks = Math.floor((taskCountRange.min + taskCountRange.max) / 2);

  return {
    projectUnderstanding: `Dự án "${projectTitle}" cần được phân tích chi tiết hơn. Vui lòng cung cấp thêm thông tin về mục tiêu, deliverables mong đợi, và các ràng buộc của dự án.`,
    keyDeliverables: [
      "Kế hoạch dự án chi tiết",
      "Báo cáo tiến độ hàng tuần",
      "Sản phẩm cuối cùng của dự án",
    ],
    milestones: [
      {
        name: "Khởi động",
        description: "Chuẩn bị và lên kế hoạch",
        targetDate: undefined,
        tasks: ["Xác định phạm vi dự án", "Lập kế hoạch chi tiết"],
      },
      {
        name: "Thực hiện",
        description: "Triển khai các hoạt động chính",
        targetDate: undefined,
        tasks: ["Thực hiện công việc theo kế hoạch", "Theo dõi tiến độ"],
      },
      {
        name: "Hoàn thành",
        description: "Kết thúc và bàn giao",
        targetDate: undefined,
        tasks: ["Bàn giao sản phẩm", "Đánh giá kết quả"],
      },
    ],
    tasks: [
      {
        title: "Xác định phạm vi và mục tiêu dự án",
        description: "Làm rõ những gì cần đạt được",
        priority: "High",
        estimatedDays: 2,
        assigneeType: "Team Leader",
        dependsOn: [],
      },
      {
        title: "Lập kế hoạch chi tiết các công việc",
        description: "Chia nhỏ công việc thành các task cụ thể",
        priority: "High",
        estimatedDays: 3,
        assigneeType: "Team Leader",
        dependsOn: ["Xác định phạm vi và mục tiêu dự án"],
      },
      {
        title: "Phân công nhiệm vụ cho thành viên",
        description: "Giao việc dựa trên năng lực từng người",
        priority: "Medium",
        estimatedDays: 1,
        assigneeType: "Team Leader",
        dependsOn: ["Lập kế hoạch chi tiết các công việc"],
      },
      {
        title: "Thiết lập hệ thống theo dõi tiến độ",
        description: "Tạo bảng theo dõi và báo cáo",
        priority: "Medium",
        estimatedDays: 2,
        assigneeType: "Team Member",
        dependsOn: ["Phân công nhiệm vụ cho thành viên"],
      },
      {
        title: "Thực hiện công việc theo kế hoạch",
        description: "Triển khai các hoạt động đã lên kế hoạch",
        priority: "High",
        estimatedDays: Math.max(5, Math.floor(targetTasks * 2)),
        assigneeType: "Team Member",
        dependsOn: ["Thiết lập hệ thống theo dõi tiến độ"],
      },
      {
        title: "Tổ chức họp tiến độ hàng tuần",
        description: "Cập nhật tình hình và giải quyết vướng mắc",
        priority: "Medium",
        estimatedDays: 1,
        assigneeType: "Team Leader",
        dependsOn: ["Thực hiện công việc theo kế hoạch"],
      },
      {
        title: "Kiểm tra chất lượng sản phẩm trung gian",
        description: "Đánh giá và điều chỉnh nếu cần",
        priority: "High",
        estimatedDays: 2,
        assigneeType: "Mentor",
        dependsOn: ["Thực hiện công việc theo kế hoạch"],
      },
      {
        title: "Hoàn thiện sản phẩm cuối cùng",
        description: "Tổng hợp và hoàn thiện kết quả",
        priority: "Important",
        estimatedDays: 3,
        assigneeType: "Team Member",
        dependsOn: ["Kiểm tra chất lượng sản phẩm trung gian"],
      },
      {
        title: "Chuẩn bị báo cáo tổng kết",
        description: "Viết báo cáo kết quả dự án",
        priority: "Medium",
        estimatedDays: 2,
        assigneeType: "Team Leader",
        dependsOn: ["Hoàn thiện sản phẩm cuối cùng"],
      },
      {
        title: "Tổ chức buổi tổng kết dự án",
        description: "Chia sẻ kết quả và bài học kinh nghiệm",
        priority: "Low",
        estimatedDays: 1,
        assigneeType: "Team Leader",
        dependsOn: ["Chuẩn bị báo cáo tổng kết"],
      },
    ],
    workflowRisks: [
      {
        risk: "Chậm tiến độ do thiếu nguồn lực",
        impact: "Có thể làm trễ ngày bàn giao",
        mitigation: "Theo dõi sát tiến độ và điều chỉnh kịp thời",
        severity: "medium",
      },
      {
        risk: "Phạm vi dự án không rõ ràng",
        impact: "Dễ dẫn đến làm sai lệch mục tiêu",
        mitigation: "Xác định rõ phạm vi ngay từ đầu",
        severity: "high",
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