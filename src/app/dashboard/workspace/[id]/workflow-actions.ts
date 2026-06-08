"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ============================================================================
// TYPES
// ============================================================================

export interface WorkflowPhase {
  phase_name: string;
  objective: string;
  duration: string;
  tasks: WorkflowTask[];
  risks: WorkflowRisk[];
  dependencies: WorkflowDependency[];
  success_metrics: WorkflowSuccessMetric[];
  progress?: number;
}

export interface WorkflowTask {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  suggested_role: string;
  selected?: boolean;
}

export interface WorkflowRisk {
  risk: string;
  impact: string;
  mitigation: string;
  severity: "low" | "medium" | "high";
}

export interface WorkflowDependency {
  description: string;
  type: "sequential" | "supporting" | "resource" | "external";
}

export interface WorkflowSuccessMetric {
  kpi: string;
  measurementMethod: string;
  targetValue: string;
}

export interface GeneratedWorkflow {
  workflow_title: string;
  project_summary: string;
  phases: WorkflowPhase[];
}

export interface WorkflowTaskImport {
  title: string;
  description: string;
  priority: string;
  suggested_role: string;
  phase_name: string;
}

export interface SavedWorkflow {
  id: string;
  project_id: string;
  workflow_json: GeneratedWorkflow;
  generated_by: string;
  created_at: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getSupabaseClient() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  return { supabase, user };
}

async function isProjectLeader(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  projectId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .eq("role", "leader")
    .maybeSingle();

  return !!data;
}

type ProjectDomain = "software" | "community" | "environmental" | "education" | "health" | "general";

function detectProjectDomain(
  title: string,
  description: string,
  tasks: any[] = []
): ProjectDomain {
  const text = `${title} ${description} ${tasks.map(t => t.title).join(" ")}`.toLowerCase();

  const softwareKeywords = ["software", "app", "application", "web", "mobile", "code", "develop", "programming", "api", "database", "frontend", "backend", "devops"];
  const communityKeywords = ["community", "volunteer", "outreach", "stakeholder", "engagement", "social", "civic", "public", "neighborhood"];
  const environmentalKeywords = ["environment", "climate", "sustainability", "green", "cleanup", "recycling", "carbon", "ecosystem", "nature", "pollution"];
  const educationKeywords = ["education", "teaching", "learning", "school", "training", "curriculum", "student", "teacher", "course"];
  const healthKeywords = ["health", "medical", "healthcare", "wellness", "patient", "clinical", "treatment", "medicine"];

  if (softwareKeywords.some(kw => text.includes(kw))) return "software";
  if (environmentalKeywords.some(kw => text.includes(kw))) return "environmental";
  if (educationKeywords.some(kw => text.includes(kw))) return "education";
  if (healthKeywords.some(kw => text.includes(kw))) return "health";
  if (communityKeywords.some(kw => text.includes(kw))) return "community";

  return "general";
}

function getDomainPhases(domain: ProjectDomain): Omit<WorkflowPhase, "progress">[] {
  switch (domain) {
    case "software":
      return [
        {
          phase_name: "Requirements",
          objective: "Define and document software requirements",
          duration: "2-3 weeks",
          tasks: [
            { title: "Stakeholder interviews", description: "Interview key stakeholders to gather requirements", priority: "high", suggested_role: "Product Manager" },
            { title: "Requirements documentation", description: "Document functional and non-functional requirements", priority: "high", suggested_role: "Business Analyst" },
            { title: "User stories creation", description: "Create detailed user stories with acceptance criteria", priority: "high", suggested_role: "Product Manager" },
          ],
          risks: [
            { risk: "Requirements creep", impact: "High", mitigation: "Clear change management process", severity: "high" },
            { risk: "Stakeholder misalignment", impact: "Medium", mitigation: "Regular review meetings", severity: "medium" },
          ],
          dependencies: [
            { description: "Requirements must be approved before design", type: "sequential" },
          ],
          success_metrics: [
            { kpi: "Requirements Coverage", measurementMethod: "Stakeholder sign-off", targetValue: "100% approved" },
          ],
        },
        {
          phase_name: "Design",
          objective: "Create system architecture and UI/UX designs",
          duration: "3-4 weeks",
          tasks: [
            { title: "System architecture design", description: "Design overall system architecture", priority: "high", suggested_role: "Software Architect" },
            { title: "UI/UX prototyping", description: "Create wireframes and mockups", priority: "high", suggested_role: "UI/UX Designer" },
            { title: "Database schema design", description: "Design database structure", priority: "high", suggested_role: "Backend Developer" },
          ],
          risks: [
            { risk: "Technical debt", impact: "Medium", mitigation: "Code reviews and refactoring", severity: "medium" },
          ],
          dependencies: [
            { description: "Requirements must be completed before design", type: "sequential" },
          ],
          success_metrics: [
            { kpi: "Design Approval", measurementMethod: "Stakeholder review", targetValue: "Approved" },
          ],
        },
        {
          phase_name: "Development",
          objective: "Implement the software solution",
          duration: "8-12 weeks",
          tasks: [
            { title: "Frontend development", description: "Implement user interface", priority: "high", suggested_role: "Frontend Developer" },
            { title: "Backend development", description: "Implement server-side logic", priority: "high", suggested_role: "Backend Developer" },
            { title: "API integration", description: "Integrate frontend and backend APIs", priority: "high", suggested_role: "Full-stack Developer" },
          ],
          risks: [
            { risk: "Integration failures", impact: "High", mitigation: "API contracts and testing", severity: "high" },
          ],
          dependencies: [
            { description: "Design must be completed before development", type: "sequential" },
          ],
          success_metrics: [
            { kpi: "Code Completion", measurementMethod: "Sprint tracking", targetValue: "100% features implemented" },
          ],
        },
        {
          phase_name: "Testing",
          objective: "Ensure software quality and functionality",
          duration: "3-4 weeks",
          tasks: [
            { title: "Unit testing", description: "Write and run unit tests", priority: "high", suggested_role: "QA Engineer" },
            { title: "Integration testing", description: "Test system integration", priority: "high", suggested_role: "QA Engineer" },
            { title: "User acceptance testing", description: "Conduct UAT with stakeholders", priority: "high", suggested_role: "QA Engineer" },
          ],
          risks: [
            { risk: "Bug discovery late in cycle", impact: "Medium", mitigation: "Early testing", severity: "medium" },
          ],
          dependencies: [
            { description: "Development must be completed before testing", type: "sequential" },
          ],
          success_metrics: [
            { kpi: "Test Coverage", measurementMethod: "Code coverage tools", targetValue: "> 80%" },
          ],
        },
        {
          phase_name: "Deployment",
          objective: "Deploy software to production environment",
          duration: "2-3 weeks",
          tasks: [
            { title: "CI/CD setup", description: "Configure deployment pipeline", priority: "high", suggested_role: "DevOps Engineer" },
            { title: "Production deployment", description: "Deploy to production environment", priority: "high", suggested_role: "DevOps Engineer" },
            { title: "Monitoring setup", description: "Set up monitoring and alerts", priority: "medium", suggested_role: "DevOps Engineer" },
          ],
          risks: [
            { risk: "Deployment failures", impact: "High", mitigation: "Staged rollout", severity: "high" },
          ],
          dependencies: [
            { description: "Testing must pass before deployment", type: "sequential" },
          ],
          success_metrics: [
            { kpi: "Deployment Success", measurementMethod: "Deployment logs", targetValue: "Successful" },
          ],
        },
      ];
    case "environmental":
      return [
        {
          phase_name: "Assessment",
          objective: "Assess environmental impact and baseline conditions",
          duration: "3-4 weeks",
          tasks: [
            { title: "Site assessment", description: "Conduct environmental site assessment", priority: "high", suggested_role: "Environmental Scientist" },
            { title: "Baseline data collection", description: "Collect baseline environmental data", priority: "high", suggested_role: "Environmental Scientist" },
            { title: "Impact analysis", description: "Analyze potential environmental impact", priority: "high", suggested_role: "Environmental Scientist" },
          ],
          risks: [
            { risk: "Weather disruptions", impact: "High", mitigation: "Flexible scheduling", severity: "high" },
          ],
          dependencies: [
            { description: "Site access required for assessment", type: "external" },
          ],
          success_metrics: [
            { kpi: "Assessment Completion", measurementMethod: "Report submission", targetValue: "100%" },
          ],
        },
        {
          phase_name: "Awareness",
          objective: "Raise awareness about environmental issues",
          duration: "4-6 weeks",
          tasks: [
            { title: "Campaign material creation", description: "Create awareness campaign materials", priority: "high", suggested_role: "Communications Lead" },
            { title: "Social media campaign", description: "Launch social media awareness campaign", priority: "high", suggested_role: "Communications Lead" },
            { title: "Community outreach", description: "Conduct community outreach events", priority: "high", suggested_role: "Community Coordinator" },
          ],
          risks: [
            { risk: "Low engagement", impact: "Medium", mitigation: "Incentive programs", severity: "medium" },
          ],
          dependencies: [
            { description: "Assessment informs campaign strategy", type: "sequential" },
          ],
          success_metrics: [
            { kpi: "Reach", measurementMethod: "Social media analytics", targetValue: "> 1000 impressions" },
          ],
        },
        {
          phase_name: "Recruitment",
          objective: "Recruit volunteers for cleanup operations",
          duration: "3-4 weeks",
          tasks: [
            { title: "Volunteer recruitment", description: "Recruit volunteers for cleanup", priority: "high", suggested_role: "Volunteer Coordinator" },
            { title: "Training sessions", description: "Conduct volunteer training", priority: "medium", suggested_role: "Volunteer Coordinator" },
          ],
          risks: [
            { risk: "Volunteer attrition", impact: "Medium", mitigation: "Recognition programs", severity: "medium" },
          ],
          dependencies: [
            { description: "Awareness campaign supports recruitment", type: "supporting" },
          ],
          success_metrics: [
            { kpi: "Volunteers Recruited", measurementMethod: "Volunteer database", targetValue: "> 50 volunteers" },
          ],
        },
        {
          phase_name: "Execution",
          objective: "Execute environmental cleanup activities",
          duration: "6-8 weeks",
          tasks: [
            { title: "Site preparation", description: "Prepare cleanup sites", priority: "high", suggested_role: "Operations Manager" },
            { title: "Cleanup operations", description: "Execute cleanup activities", priority: "high", suggested_role: "Operations Manager" },
            { title: "Waste management", description: "Manage waste disposal", priority: "high", suggested_role: "Operations Manager" },
          ],
          risks: [
            { risk: "Safety incidents", impact: "High", mitigation: "Safety protocols", severity: "high" },
          ],
          dependencies: [
            { description: "Volunteers required for execution", type: "resource" },
          ],
          success_metrics: [
            { kpi: "Waste Collected", measurementMethod: "Weight measurement", targetValue: "> 1000 kg" },
          ],
        },
        {
          phase_name: "Impact Measurement",
          objective: "Measure environmental impact and progress",
          duration: "Ongoing",
          tasks: [
            { title: "Data collection", description: "Collect impact data", priority: "high", suggested_role: "Monitoring Specialist" },
            { title: "Impact analysis", description: "Analyze environmental impact", priority: "high", suggested_role: "Monitoring Specialist" },
            { title: "Reporting", description: "Prepare impact reports", priority: "medium", suggested_role: "Monitoring Specialist" },
          ],
          risks: [
            { risk: "Data quality issues", impact: "Medium", mitigation: "Standardized protocols", severity: "medium" },
          ],
          dependencies: [
            { description: "Baseline data required for comparison", type: "sequential" },
          ],
          success_metrics: [
            { kpi: "Environmental Improvement", measurementMethod: "Pre/post assessment", targetValue: "Measurable improvement" },
          ],
        },
      ];
    case "community":
      return [
        {
          phase_name: "Nghiên cứu",
          objective: "Nghiên cứu nhu cầu cộng đồng và các giải pháp hiện có",
          duration: "3-4 tuần",
          tasks: [
            { title: "Khảo sát cộng đồng", description: "Thực hiện khảo sát nhu cầu cộng đồng", priority: "high", suggested_role: "Trưởng nhóm Nghiên cứu" },
            { title: "Phỏng vấn các bên liên quan", description: "Phỏng vấn các bên liên quan chính", priority: "high", suggested_role: "Liên lạc Cộng đồng" },
            { title: "Nghiên cứu thực hành tốt", description: "Nghiên cứu các dự án thành công tương tự", priority: "medium", suggested_role: "Trưởng nhóm Nghiên cứu" },
          ],
          risks: [
            { risk: "Tỷ lệ phản hồi khảo sát thấp", impact: "Trung bình", mitigation: "Đa dạng hóa phương thức tiếp cận", severity: "medium" },
          ],
          dependencies: [],
          success_metrics: [
            { kpi: "Hoàn thành khảo sát", measurementMethod: "Tỷ lệ phản hồi", targetValue: "> 60% phản hồi" },
          ],
        },
        {
          phase_name: "Tham gia các bên liên quan",
          objective: "Tham gia với các bên liên quan chính và xây dựng quan hệ đối tác",
          duration: "4-6 tuần",
          tasks: [
            { title: "Họp các bên liên quan", description: "Tổ chức các cuộc họp tham gia các bên liên quan", priority: "high", suggested_role: "Quản lý Đối tác" },
            { title: "Phát triển đối tác", description: "Phát triển các quan hệ đối tác chiến lược", priority: "high", suggested_role: "Quản lý Đối tác" },
            { title: "Mobilize nguồn lực", description: "Mobilize nguồn lực và hỗ trợ", priority: "high", suggested_role: "Quản lý Đối tác" },
          ],
          risks: [
            { risk: "Xung đột giữa các bên liên quan", impact: "Trung bình", mitigation: "Giải quyết xung đột", severity: "medium" },
          ],
          dependencies: [
            { description: "Nghiên cứu cung cấp thông tin cho chiến lược tham gia", type: "sequential" },
          ],
          success_metrics: [
            { kpi: "Đối tác", measurementMethod: "Thỏa thuận đối tác", targetValue: "> 5 đối tác" },
          ],
        },
        {
          phase_name: "Tuyển dụng tình nguyện viên",
          objective: "Tuyển dụng và hội nhập tình nguyện viên",
          duration: "3-4 tuần",
          tasks: [
            { title: "Chiến dịch tuyển dụng", description: "Khởi động chiến dịch tuyển dụng tình nguyện viên", priority: "high", suggested_role: "Điều phối viên Tình nguyện viên" },
            { title: "Sàng lọc tình nguyện viên", description: "Sàng lọc và chọn lựa tình nguyện viên", priority: "medium", suggested_role: "Điều phối viên Tình nguyện viên" },
            { title: "Buổi đào tạo", description: "Thực hiện đào tạo tình nguyện viên", priority: "medium", suggested_role: "Điều phối viên Tình nguyện viên" },
          ],
          risks: [
            { risk: "Kiệt sức tình nguyện viên", impact: "Trung bình", mitigation: "Cân bằng khối lượng công việc", severity: "medium" },
          ],
          dependencies: [
            { description: "Hỗ trợ từ các bên liên quan cho phép tuyển dụng", type: "supporting" },
          ],
          success_metrics: [
            { kpi: "Tình nguyện viên được tuyển dụng", measurementMethod: "Cơ sở dữ liệu tình nguyện viên", targetValue: "> 30 tình nguyện viên" },
          ],
        },
        {
          phase_name: "Triển khai",
          objective: "Thực hiện các hoạt động dự án cộng đồng",
          duration: "8-12 tuần",
          tasks: [
            { title: "Triển khai hoạt động", description: "Thực hiện các hoạt động đã lên kế hoạch", priority: "high", suggested_role: "Quản lý Dự án" },
            { title: "Theo dõi tiến độ", description: "Theo dõi tiến độ dự án", priority: "high", suggested_role: "Điều phối viên Hoạt động" },
            { title: "Sự kiện cộng đồng", description: "Tổ chức các sự kiện cộng đồng", priority: "high", suggested_role: "Điều phối viên Hoạt động" },
          ],
          risks: [
            { risk: "Hạn chế nguồn lực", impact: "Cao", mitigation: "Đa dạng hóa nguồn lực", severity: "high" },
          ],
          dependencies: [
            { description: "Tình nguyện viên cần thiết cho triển khai", type: "resource" },
          ],
          success_metrics: [
            { kpi: "Hoàn thành hoạt động", measurementMethod: "Theo dõi tiến độ", targetValue: "> 90% hoàn thành" },
          ],
        },
        {
          phase_name: "Đánh giá",
          objective: "Đánh giá kết quả và tác động của dự án",
          duration: "2-4 tuần",
          tasks: [
            { title: "Phân tích dữ liệu", description: "Phân tích dữ liệu dự án", priority: "high", suggested_role: "Chuyên gia Đánh giá" },
            { title: "Đánh giá tác động", description: "Đánh giá tác động dự án", priority: "high", suggested_role: "Chuyên gia Đánh giá" },
            { title: "Viết báo cáo", description: "Chuẩn bị báo cáo đánh giá", priority: "medium", suggested_role: "Chuyên gia Đánh giá" },
          ],
          risks: [
            { risk: "Dữ liệu không đầy đủ", impact: "Trung bình", mitigation: "Lập kế hoạch thu thập dữ liệu", severity: "medium" },
          ],
          dependencies: [
            { description: "Dữ liệu triển khai cần thiết cho đánh giá", type: "sequential" },
          ],
          success_metrics: [
            { kpi: "Điểm tác động", measurementMethod: "Đánh giá trước/sau", targetValue: "> 20% cải thiện" },
          ],
        },
      ];
    case "education":
      return [
        {
          phase_name: "Curriculum Development",
          objective: "Develop educational curriculum and materials",
          duration: "4-6 weeks",
          tasks: [
            { title: "Curriculum design", description: "Design curriculum structure", priority: "high", suggested_role: "Curriculum Developer" },
            { title: "Content development", description: "Develop learning content", priority: "high", suggested_role: "Curriculum Developer" },
            { title: "Material creation", description: "Create learning materials", priority: "high", suggested_role: "Curriculum Developer" },
          ],
          risks: [
            { risk: "Curriculum relevance", impact: "Medium", mitigation: "Regular review", severity: "medium" },
          ],
          dependencies: [],
          success_metrics: [
            { kpi: "Curriculum Completion", measurementMethod: "Content review", targetValue: "100% complete" },
          ],
        },
        {
          phase_name: "Teacher Training",
          objective: "Train teachers/facilitators on curriculum delivery",
          duration: "3-4 weeks",
          tasks: [
            { title: "Training design", description: "Design training program", priority: "high", suggested_role: "Training Lead" },
            { title: "Training delivery", description: "Deliver teacher training", priority: "high", suggested_role: "Training Lead" },
            { title: "Teacher support", description: "Provide ongoing teacher support", priority: "medium", suggested_role: "Training Lead" },
          ],
          risks: [
            { risk: "Teacher turnover", impact: "High", mitigation: "Professional development", severity: "high" },
          ],
          dependencies: [
            { description: "Curriculum required for training", type: "sequential" },
          ],
          success_metrics: [
            { kpi: "Training Completion", measurementMethod: "Training records", targetValue: "100% trained" },
          ],
        },
        {
          phase_name: "Implementation",
          objective: "Deliver educational program to learners",
          duration: "8-12 weeks",
          tasks: [
            { title: "Class scheduling", description: "Schedule classes", priority: "high", suggested_role: "Teacher" },
            { title: "Teaching delivery", description: "Deliver instruction", priority: "high", suggested_role: "Teacher" },
            { title: "Student support", description: "Provide student support", priority: "medium", suggested_role: "Teaching Assistant" },
          ],
          risks: [
            { risk: "Low engagement", impact: "High", mitigation: "Interactive methods", severity: "high" },
          ],
          dependencies: [
            { description: "Trained teachers required", type: "resource" },
          ],
          success_metrics: [
            { kpi: "Student Attendance", measurementMethod: "Attendance records", targetValue: "> 80% average" },
          ],
        },
        {
          phase_name: "Assessment",
          objective: "Assess learning outcomes and program effectiveness",
          duration: "2-3 weeks",
          tasks: [
            { title: "Student assessment", description: "Assess student learning", priority: "high", suggested_role: "Assessment Specialist" },
            { title: "Data analysis", description: "Analyze assessment data", priority: "high", suggested_role: "Assessment Specialist" },
            { title: "Program evaluation", description: "Evaluate program effectiveness", priority: "medium", suggested_role: "Evaluator" },
          ],
          risks: [
            { risk: "Assessment challenges", impact: "Low", mitigation: "Clear criteria", severity: "low" },
          ],
          dependencies: [
            { description: "Implementation data required", type: "sequential" },
          ],
          success_metrics: [
            { kpi: "Learning Outcomes", measurementMethod: "Pre/post assessment", targetValue: "> 70% improvement" },
          ],
        },
      ];
    case "health":
      return [
        {
          phase_name: "Needs Assessment",
          objective: "Assess community health needs and resources",
          duration: "3-4 weeks",
          tasks: [
            { title: "Health survey", description: "Conduct community health survey", priority: "high", suggested_role: "Public Health Specialist" },
            { title: "Resource mapping", description: "Map available health resources", priority: "high", suggested_role: "Researcher" },
            { title: "Gap analysis", description: "Analyze health service gaps", priority: "high", suggested_role: "Public Health Specialist" },
          ],
          risks: [
            { risk: "Data quality issues", impact: "Medium", mitigation: "Standardized protocols", severity: "medium" },
          ],
          dependencies: [],
          success_metrics: [
            { kpi: "Assessment Completion", measurementMethod: "Report submission", targetValue: "100%" },
          ],
        },
        {
          phase_name: "Program Design",
          objective: "Design health intervention program",
          duration: "4-5 weeks",
          tasks: [
            { title: "Program planning", description: "Plan intervention program", priority: "high", suggested_role: "Program Designer" },
            { title: "Protocol development", description: "Develop intervention protocols", priority: "high", suggested_role: "Health Specialist" },
            { title: "Resource planning", description: "Plan resource allocation", priority: "high", suggested_role: "Program Designer" },
          ],
          risks: [
            { risk: "Compliance issues", impact: "High", mitigation: "Regulatory review", severity: "high" },
          ],
          dependencies: [
            { description: "Assessment informs design", type: "sequential" },
          ],
          success_metrics: [
            { kpi: "Design Approval", measurementMethod: "Stakeholder review", targetValue: "Approved" },
          ],
        },
        {
          phase_name: "Implementation",
          objective: "Deliver health interventions",
          duration: "8-12 weeks",
          tasks: [
            { title: "Service delivery", description: "Deliver health services", priority: "high", suggested_role: "Health Worker" },
            { title: "Participant enrollment", description: "Enroll program participants", priority: "high", suggested_role: "Program Coordinator" },
            { title: "Health education", description: "Provide health education", priority: "high", suggested_role: "Health Worker" },
          ],
          risks: [
            { risk: "Participant dropout", impact: "High", mitigation: "Engagement strategies", severity: "high" },
          ],
          dependencies: [
            { description: "Trained staff required", type: "resource" },
          ],
          success_metrics: [
            { kpi: "Service Utilization", measurementMethod: "Service records", targetValue: "> 80% target served" },
          ],
        },
        {
          phase_name: "Evaluation",
          objective: "Evaluate health outcomes and program impact",
          duration: "3-4 weeks",
          tasks: [
            { title: "Health measurement", description: "Measure health outcomes", priority: "high", suggested_role: "Evaluator" },
            { title: "Data analysis", description: "Analyze health data", priority: "high", suggested_role: "Data Analyst" },
            { title: "Outcome evaluation", description: "Evaluate program outcomes", priority: "high", suggested_role: "Evaluator" },
          ],
          risks: [
            { risk: "Stigma barriers", impact: "Medium", mitigation: "Community education", severity: "medium" },
          ],
          dependencies: [
            { description: "Implementation data required", type: "sequential" },
          ],
          success_metrics: [
            { kpi: "Health Outcomes", measurementMethod: "Pre/post measurement", targetValue: "Measurable improvement" },
          ],
        },
      ];
    default:
      return [
        {
          phase_name: "Nghiên cứu",
          objective: "Thu thập thông tin và hiểu vấn đề",
          duration: "2-4 tuần",
          tasks: [
            { title: "Thu thập thông tin", description: "Thu thập thông tin liên quan", priority: "high", suggested_role: "Nhà nghiên cứu" },
            { title: "Thu thập dữ liệu", description: "Thu thập dữ liệu cần thiết", priority: "high", suggested_role: "Phân tích viên" },
          ],
          risks: [
            { risk: "Thiếu thông tin", impact: "Trung bình", mitigation: "Nhiều nguồn", severity: "medium" },
          ],
          dependencies: [],
          success_metrics: [
            { kpi: "Hoàn thành nghiên cứu", measurementMethod: "Xem xét", targetValue: "100%" },
          ],
        },
        {
          phase_name: "Lập kế hoạch",
          objective: "Phát triển kế hoạch dự án chi tiết",
          duration: "2-3 tuần",
          tasks: [
            { title: "Phát triển kế hoạch", description: "Phát triển kế hoạch dự án", priority: "high", suggested_role: "Quản lý Dự án" },
            { title: "Lập kế hoạch nguồn lực", description: "Lập kế hoạch phân bổ nguồn lực", priority: "high", suggested_role: "Người lập kế hoạch" },
          ],
          risks: [
            { risk: "Khoảng trống lập kế hoạch", impact: "Trung bình", mitigation: "Đóng góp từ các bên liên quan", severity: "medium" },
          ],
          dependencies: [
            { description: "Nghiên cứu cung cấp thông tin cho lập kế hoạch", type: "sequential" },
          ],
          success_metrics: [
            { kpi: "Phê duyệt kế hoạch", measurementMethod: "Phê duyệt từ các bên liên quan", targetValue: "Được phê duyệt" },
          ],
        },
        {
          phase_name: "Triển khai",
          objective: "Thực hiện các hoạt động dự án",
          duration: "6-10 tuần",
          tasks: [
            { title: "Triển khai hoạt động", description: "Thực hiện các hoạt động đã lên kế hoạch", priority: "high", suggested_role: "Nhóm Dự án" },
            { title: "Theo dõi tiến độ", description: "Theo dõi tiến độ dự án", priority: "high", suggested_role: "Điều phối viên" },
          ],
          risks: [
            { risk: "Chậm tiến độ", impact: "Trung bình", mitigation: "Thời gian đệm", severity: "medium" },
          ],
          dependencies: [
            { description: "Cần lập kế hoạch", type: "sequential" },
          ],
          success_metrics: [
            { kpi: "Hoàn thành nhiệm vụ", measurementMethod: "Theo dõi", targetValue: "> 90%" },
          ],
        },
        {
          phase_name: "Giám sát",
          objective: "Giám sát tiến độ và hiệu suất",
          duration: "Liên tục",
          tasks: [
            { title: "Giám sát tiến độ", description: "Giám sát tiến độ dự án", priority: "high", suggested_role: "Người giám sát" },
            { title: "Phân tích hiệu suất", description: "Phân tích hiệu suất", priority: "medium", suggested_role: "Phân tích viên" },
          ],
          risks: [
            { risk: "Khoảng trống giám sát", impact: "Thấp", mitigation: "Kiểm tra thường xuyên", severity: "low" },
          ],
          dependencies: [
            { description: "Cần dữ liệu triển khai", type: "sequential" },
          ],
          success_metrics: [
            { kpi: "Tuân thủ giám sát", measurementMethod: "Báo cáo", targetValue: "Thường xuyên" },
          ],
        },
        {
          phase_name: "Đánh giá",
          objective: "Đánh giá kết quả và tác động",
          duration: "2-4 tuần",
          tasks: [
            { title: "Đo lường kết quả", description: "Đo lường kết quả dự án", priority: "high", suggested_role: "Người đánh giá" },
            { title: "Phân tích tác động", description: "Phân tích tác động dự án", priority: "high", suggested_role: "Phân tích viên" },
          ],
          risks: [
            { risk: "Thiên kiến đánh giá", impact: "Thấp", mitigation: "Xem xét độc lập", severity: "low" },
          ],
          dependencies: [
            { description: "Cần hoàn thành", type: "sequential" },
          ],
          success_metrics: [
            { kpi: "Chất lượng đánh giá", measurementMethod: "Xem xét", targetValue: "Toàn diện" },
          ],
        },
      ];
  }
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

export async function generateWorkflow(projectId: string): Promise<GeneratedWorkflow> {
  const { supabase, user } = await getSupabaseClient();

  // Check if user is a leader
  const isLeader = await isProjectLeader(supabase, user.id, projectId);
  if (!isLeader) {
    throw new Error("Only project leaders can generate workflows");
  }

  // Fetch project data
  const [projectResult, tasksResult, membersResult, activitiesResult] = await Promise.all([
    supabase
      .from("projects")
      .select("id,title,description,status,created_at")
      .eq("id", projectId)
      .maybeSingle(),
    supabase
      .from("tasks")
      .select("id,title,description,status,priority,assigned_to,assigned_user,due_date")
      .eq("project_id", projectId),
    supabase
      .from("project_members")
      .select("id,user_id,name,email,role")
      .eq("project_id", projectId),
    supabase
      .from("activities")
      .select("id,action,description,created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (projectResult.error || !projectResult.data) {
    throw new Error(projectResult.error?.message ?? "Project not found");
  }

  const project = projectResult.data;
  const tasks = tasksResult.data ?? [];
  const members = membersResult.data ?? [];
  const activities = activitiesResult.data ?? [];

  // Detect domain
  const domain = detectProjectDomain(project.title, project.description, tasks);

  // Get domain-specific phases
  const domainPhases = getDomainPhases(domain);

  // Calculate progress for each phase based on existing tasks
  const phasesWithProgress: WorkflowPhase[] = domainPhases.map((phase) => {
    const phaseTasks = tasks.filter((task) => 
      task.title.toLowerCase().includes(phase.phase_name.toLowerCase()) ||
      task.description?.toLowerCase().includes(phase.phase_name.toLowerCase())
    );
    const completedTasks = phaseTasks.filter((task) => task.status === "completed").length;
    const progress = phaseTasks.length > 0 ? Math.round((completedTasks / phaseTasks.length) * 100) : 0;

    return {
      ...phase,
      progress,
    };
  });

  // Build task context for AI
  const taskContext = tasks.map(task => {
    const deadline = task.due_date
      ? new Date(task.due_date).toLocaleDateString('vi-VN')
      : 'Chưa đặt';
    const assignee = task.assigned_user || 'Chưa phân công';
    return `Tiêu đề: ${task.title}
Mô tả: ${task.description || 'Không có mô tả'}
Trạng thái: ${task.status}
Mức độ ưu tiên: ${task.priority}
Người phụ trách: ${assignee}
Thời hạn: ${deadline}`;
  }).join('\n\n');

  const workflowTitle = `${project.title} - Quy trình Dự án ${domain.charAt(0).toUpperCase() + domain.slice(1)}`;
  const projectSummary = `Dự án ${domain} này hiện đang ${project.status}. Dự án có ${members.length} thành viên và ${tasks.length} công việc hiện có. Các hoạt động gần đây bao gồm ${activities.slice(0, 3).map(a => a.action).join(", ")}. Quy trình được điều chỉnh theo nhu cầu và thực hành tốt nhất của các dự án ${domain}.

Các công việc hiện có:
${taskContext}`;

  // Verification logs
  console.log('[generateWorkflow] Task count:', tasks.length);
  console.log('[generateWorkflow] Tasks with due_date:', tasks.filter((t: any) => t.due_date).length);
  tasks.forEach((task: any, index: number) => {
    console.log(`[generateWorkflow] Task ${index + 1}:`, {
      title: task.title,
      due_date: task.due_date,
      assigned_user: task.assigned_user,
    });
  });

  // Translate phases to Vietnamese (only if not already in Vietnamese)
  const translatedPhases: WorkflowPhase[] = phasesWithProgress.map(phase => {
    // Check if phase is already in Vietnamese (contains Vietnamese characters)
    const isVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(phase.phase_name);
    
    if (isVietnamese) {
      // Already in Vietnamese, return as-is
      return phase;
    }

    const phaseTranslations: Record<string, { name: string; objective: string }> = {
      "Requirements": { name: "Yêu cầu", objective: "Xác định và tài liệu hóa các yêu cầu" },
      "Design": { name: "Thiết kế", objective: "Tạo kiến trúc hệ thống và thiết kế UI/UX" },
      "Development": { name: "Phát triển", objective: "Triển khai giải pháp phần mềm" },
      "Testing": { name: "Kiểm thử", objective: "Đảm bảo chất lượng và chức năng" },
      "Deployment": { name: "Triển khai", objective: "Triển khai phần mềm vào sản xuất" },
      "Research": { name: "Nghiên cứu", objective: "Nghiên cứu và thu thập thông tin" },
      "Planning": { name: "Lập kế hoạch", objective: "Lập kế hoạch chi tiết dự án" },
      "Execution": { name: "Triển khai", objective: "Triển khai các hoạt động dự án" },
      "Monitoring": { name: "Giám sát", objective: "Giám sát tiến độ và hiệu suất" },
      "Evaluation": { name: "Đánh giá", objective: "Đánh giá kết quả và tác động" },
      "Curriculum Development": { name: "Phát triển giáo trình", objective: "Phát triển giáo trình và tài liệu giáo dục" },
      "Teacher Training": { name: "Đào tạo giáo viên", objective: "Đào tạo giáo viên/giảng viên về giảng dạy" },
      "Implementation": { name: "Triển khai", objective: "Triển khai chương trình giáo dục" },
      "Assessment": { name: "Đánh giá", objective: "Đánh giá kết quả học tập" },
      "Needs Assessment": { name: "Đánh giá nhu cầu", objective: "Đánh giá nhu cầu sức khỏe cộng đồng" },
      "Program Design": { name: "Thiết kế chương trình", objective: "Thiết kế chương trình sức khỏe" },
      "Service Delivery": { name: "Cung cấp dịch vụ", objective: "Cung cấp dịch vụ sức khỏe" },
      "Monitoring & Evaluation": { name: "Giám sát và đánh giá", objective: "Giám sát và đánh giá chương trình" },
    };

    const translation = phaseTranslations[phase.phase_name] || { name: phase.phase_name, objective: phase.objective };

    return {
      ...phase,
      phase_name: translation.name,
      objective: translation.objective,
    };
  });

  const workflow: GeneratedWorkflow = {
    workflow_title: workflowTitle,
    project_summary: projectSummary,
    phases: translatedPhases,
  };

  // Save workflow to database
  const { error: saveError } = await supabase.from("ai_workflows").insert({
    project_id: projectId,
    workflow_json: workflow as any,
    generated_by: user.id,
  });

  if (saveError) {
    console.error("[generateWorkflow] Failed to save workflow:", saveError);
  }

  revalidatePath(`/dashboard/workspace/${projectId}`);

  return workflow;
}

export async function getProjectWorkflows(projectId: string): Promise<SavedWorkflow[]> {
  const { supabase, user } = await getSupabaseClient();

  // Check if user is a member
  const { data: membership } = await supabase
    .from("project_members")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    throw new Error("You must be a project member to view workflows");
  }

  const { data, error } = await supabase
    .from("ai_workflows")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((item) => ({
    id: item.id,
    project_id: item.project_id,
    workflow_json: item.workflow_json as GeneratedWorkflow,
    generated_by: item.generated_by,
    created_at: item.created_at,
  }));
}

export async function getLatestWorkflow(projectId: string): Promise<GeneratedWorkflow | null> {
  const { supabase, user } = await getSupabaseClient();

  // Check if user is a member
  const { data: membership } = await supabase
    .from("project_members")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
    throw new Error("You must be a project member to view workflows");
  }

  const { data, error } = await supabase
    .from("ai_workflows")
    .select("workflow_json")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.workflow_json as GeneratedWorkflow ?? null;
}

export async function saveWorkflow(projectId: string, workflow: GeneratedWorkflow): Promise<void> {
  const { supabase, user } = await getSupabaseClient();

  // Check if user is a leader
  const isLeader = await isProjectLeader(supabase, user.id, projectId);
  if (!isLeader) {
    throw new Error("Only project leaders can save workflows");
  }

  // Check if workflow already exists for this project
  const { data: existingWorkflow } = await supabase
    .from("ai_workflows")
    .select("id")
    .eq("project_id", projectId)
    .maybeSingle();

  const workflowData = {
    project_id: projectId,
    workflow_json: workflow as any,
    workflow_name: workflow.workflow_title,
    ai_prompt: `Generate workflow for project with title: ${workflow.workflow_title}, summary: ${workflow.project_summary}`,
    generated_by: user.id,
  };

  if (existingWorkflow) {
    // Update existing workflow
    const { error } = await supabase
      .from("ai_workflows")
      .update({
        workflow_json: workflow as any,
        workflow_name: workflow.workflow_title,
        ai_prompt: `Generate workflow for project with title: ${workflow.workflow_title}, summary: ${workflow.project_summary}`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingWorkflow.id);

    console.log('[generateWorkflow] Updated existing workflow:', existingWorkflow.id);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    // Insert new workflow
    const { error } = await supabase.from("ai_workflows").insert(workflowData);

    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath(`/dashboard/workspace/${projectId}`);
}

export async function deleteWorkflow(workflowId: string, projectId: string): Promise<void> {
  const { supabase, user } = await getSupabaseClient();

  // Check if user is a leader
  const isLeader = await isProjectLeader(supabase, user.id, projectId);
  if (!isLeader) {
    throw new Error("Only project leaders can delete workflows");
  }

  const { error } = await supabase
    .from("ai_workflows")
    .delete()
    .eq("id", workflowId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/workspace/${projectId}`);
}

export async function importTasks(
  projectId: string,
  selectedTasks: WorkflowTaskImport[]
): Promise<void> {
  const { supabase, user } = await getSupabaseClient();

  // Check if user is a leader
  const isLeader = await isProjectLeader(supabase, user.id, projectId);
  if (!isLeader) {
    throw new Error("Only project leaders can import tasks");
  }

  // Insert tasks
  const tasksToInsert = selectedTasks.map((task) => ({
    project_id: projectId,
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: "todo",
    created_by: user.id,
  }));

  const { error } = await supabase.from("tasks").insert(tasksToInsert);

  if (error) {
    throw new Error(error.message);
  }

  // Log activity
  await supabase.from("activities").insert({
    project_id: projectId,
    user_id: user.id,
    user_name: user.email?.split("@")[0] ?? "Unknown",
    action: "tasks_imported",
    description: `Imported ${selectedTasks.length} tasks from workflow`,
  });

  revalidatePath(`/dashboard/workspace/${projectId}`);
}

export async function calculatePhaseProgress(
  projectId: string,
  phaseName: string
): Promise<number> {
  const { supabase } = await getSupabaseClient();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("status,title,description")
    .eq("project_id", projectId);

  if (!tasks) return 0;

  const phaseTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(phaseName.toLowerCase()) ||
    task.description?.toLowerCase().includes(phaseName.toLowerCase())
  );

  if (phaseTasks.length === 0) return 0;

  const completedTasks = phaseTasks.filter((task) => task.status === "completed").length;
  return Math.round((completedTasks / phaseTasks.length) * 100);
}
