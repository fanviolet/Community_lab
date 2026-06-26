/**
 * AI Workflow Generator Test Script
 * 
 * This script tests the AI workflow generation with 3 sample projects:
 * 1. Community Event - "Cuộc thi Văn hóa Nghệ thuật Cộng đồng"
 * 2. STEM Education Program - "Chương trình Giáo dục STEM cho học sinh nông thôn"
 * 3. AI Software Platform - "Nền tảng AI hỗ trợ học tập"
 * 
 * Run with: npx tsx scripts/test-workflow-ai.ts
 */

import {
  buildWorkflowGenerationPrompt,
  validateAIWorkflowResponse,
  calculateTaskCountRange,
  generateFallbackWorkflow,
  isGenericTask,
  countGenericTasks,
  type ProjectContext,
  type AIWorkflowResult,
} from "../src/lib/workflow-ai-generator";

// ============================================================================
// SAMPLE PROJECTS
// ============================================================================

const sampleProjects: ProjectContext[] = [
  {
    // Project 1: Community Event
    title: "Cuộc thi Văn hóa Nghệ thuật Cộng đồng 2024",
    description: `Tổ chức một cuộc thi văn hóa nghệ thuật nhằm bảo tồn và phát huy các giá trị văn hóa truyền thống của cộng đồng địa phương. 
Cuộc thi bao gồm các hạng mục: hát dân ca, múa truyền thống, trình diễn nhạc cụ dân tộc, và trình diễn áo dài.
Đối tượng tham gia: Mọi lứa tuổi trong cộng đồng, ưu tiên thanh thiếu niên.
Mục tiêu: Thu hút ít nhất 100 thí sinh đăng ký, tạo sân chơi lành mạnh, và nâng cao nhận thức về bảo tồn văn hóa.`,
    status: "planning",
    startDate: "2024-07-01",
    endDate: "2024-08-15", // 45 days
    existingTasks: [],
    members: [
      { userId: "1", name: "Nguyễn Văn A", email: "a@example.com", role: "Trưởng ban tổ chức" },
      { userId: "2", name: "Trần Thị B", email: "b@example.com", role: "Phụ trách truyền thông" },
      { userId: "3", name: "Lê Văn C", email: "c@example.com", role: "Phụ trách hậu cần" },
    ],
    recentActivities: [
      { action: "Tạo dự án", description: "Khởi động dự án cuộc thi", createdAt: "2024-06-01T10:00:00Z" },
    ],
    pitchContent: `Chúng tôi muốn tổ chức một cuộc thi văn hóa nghệ thuật để giữ gìn bản sắc văn hóa dân tộc. 
Cuộc thi sẽ có giải thưởng hấp dẫn và sự tham gia của các nghệ sĩ nổi tiếng làm giám khảo.`,
    pitchAIAnalysis: "Dự án có tiềm năng tác động cộng đồng cao, cần tập trung vào truyền thông và hậu cần.",
  },
  {
    // Project 2: STEM Education Program
    title: "Chương trình Giáo dục STEM cho học sinh nông thôn",
    description: `Triển khai chương trình giáo dục STEM (Khoa học, Công nghệ, Kỹ thuật, Toán học) cho học sinh cấp 2 tại các trường nông thôn.
Chương trình bao gồm 10 buổi học về robotics, lập trình Scratch, thí nghiệm khoa học vui, và toán tư duy.
Mục tiêu: Tiếp cận 200 học sinh tại 5 trường học, nâng cao hứng thú học tập và kỹ năng tư duy phản biện.`,
    status: "planning",
    startDate: "2024-09-01",
    endDate: "2024-11-30", // 90 days
    existingTasks: [
      { title: "Liên hệ trường học", description: "Gửi công văn xin phép", status: "completed", priority: "high" },
    ],
    members: [
      { userId: "1", name: "Phạm Thị D", email: "d@example.com", role: "Chủ nhiệm chương trình" },
      { userId: "2", name: "Hoàng Văn E", email: "e@example.com", role: "Giảng viên chính" },
      { userId: "3", name: "Vũ Thị F", email: "f@example.com", role: "Tình nguyện viên" },
      { userId: "4", name: "Đỗ Văn G", email: "g@example.com", role: "Hậu cần" },
    ],
    recentActivities: [
      { action: "Hoàn thành liên hệ trường", description: "Đã có 3 trường đồng ý tham gia", createdAt: "2024-08-15T14:00:00Z" },
    ],
    pitchContent: `Chúng tôi nhận thấy học sinh nông thôn thiếu cơ hội tiếp cận với giáo dục STEM chất lượng. 
Chương trình sẽ mang đến các buổi học thực hành vui nhộn, kích thích sáng tạo và tư duy khoa học.`,
    pitchAIAnalysis: "Dự án giáo dục có tính xã hội cao, cần chú trọng chất lượng giảng dạy và an toàn cho học sinh.",
  },
  {
    // Project 3: AI Software Platform
    title: "Nền tảng AI hỗ trợ học tập cá nhân hóa",
    description: `Phát triển một nền tảng web/app sử dụng AI để phân tích phong cách học tập và đề xuất lộ trình học tập cá nhân hóa cho học sinh.
Tính năng chính:
- Trắc nghiệm phong cách học tập (VARK)
- Hệ thống đề xuất tài liệu học theo level
- Theo dõi tiến độ và đưa ra điều chỉnh
- Chatbot AI hỗ trợ giải đáp thắc mắc
Công nghệ: React/Next.js frontend, Node.js backend, PostgreSQL, OpenAI API.`,
    status: "planning",
    startDate: "2024-07-01",
    endDate: "2024-10-31", // 122 days
    existingTasks: [],
    members: [
      { userId: "1", name: "Nguyễn Văn H", email: "h@example.com", role: "Tech Lead" },
      { userId: "2", name: "Trần Thị I", email: "i@example.com", role: "Frontend Developer" },
      { userId: "3", name: "Lê Văn J", email: "j@example.com", role: "Backend Developer" },
      { userId: "4", name: "Phạm Thị K", email: "k@example.com", role: "AI/ML Engineer" },
      { userId: "5", name: "Hoàng Văn L", email: "l@example.com", role: "UI/UX Designer" },
    ],
    recentActivities: [],
    pitchContent: `Học sinh ngày nay có quá nhiều tài liệu học tập nhưng không biết bắt đầu từ đâu. 
Nền tảng của chúng tôi sẽ dùng AI để phân tích và đề xuất lộ trình phù hợp nhất với từng em.`,
    pitchAIAnalysis: "Dự án công nghệ có tính khả thi cao, cần tập trung vào trải nghiệm người dùng và chất lượng AI recommendations.",
  },
];

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

function printSeparator() {
  console.log("\n" + "=".repeat(80) + "\n");
}

function printProjectHeader(project: ProjectContext) {
  console.log(`📋 DỰ ÁN: ${project.title}`);
  console.log(`   Thời gian: ${project.startDate} → ${project.endDate}`);
  console.log(`   Thành viên: ${project.members.length} người`);
  console.log(`   Số task hiện có: ${project.existingTasks.length}`);
  
  const daysRemaining = calculateTaskCountRange(
    project.endDate ? Math.ceil((new Date(project.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
  );
  console.log(`   Số task đề xuất: ${daysRemaining.min}-${daysRemaining.max}`);
  printSeparator();
}

function printAIWorkflowResult(result: AIWorkflowResult) {
  console.log("🧠 PHÂN TÍCH DỰ ÁN:");
  console.log(`   ${result.projectUnderstanding.substring(0, 200)}...`);
  
  console.log("\n📦 DELIVERABLES CHÍNH:");
  result.keyDeliverables.forEach((d, i) => console.log(`   ${i + 1}. ${d}`));
  
  console.log("\n🎯 CỘT MỐC (Milestones):");
  result.milestones.forEach((m, i) => {
    console.log(`   ${i + 1}. ${m.name}: ${m.description}`);
    console.log(`      Tasks: ${m.tasks.length} task`);
  });
  
  console.log("\n📝 DANH SÁCH TASKS:");
  result.tasks.forEach((task, i) => {
    const generic = isGenericTask(task.title) ? " ⚠️ GENERIC" : "";
    console.log(`   ${i + 1}. [${task.priority}] ${task.title}${generic}`);
    console.log(`      ${task.description}`);
    console.log(`      Thời gian: ${task.estimatedDays} ngày | Người phụ trách: ${task.assigneeType}`);
    if (task.dependsOn.length > 0) {
      console.log(`      Phụ thuộc: ${task.dependsOn.join(", ")}`);
    }
  });
  
  console.log("\n⚠️ RỦI RO:");
  result.workflowRisks.forEach((r, i) => {
    console.log(`   ${i + 1}. ${r.risk}`);
    console.log(`      Ảnh hưởng: ${r.impact}`);
    console.log(`      Giảm thiểu: ${r.mitigation}`);
  });
  
  console.log("\n📊 CHỈ SỐ THÀNH CÔNG:");
  result.successMetrics.forEach((m, i) => {
    console.log(`   ${i + 1}. ${m.kpi}: ${m.targetValue}`);
    console.log(`      Đo lường: ${m.measurementMethod}`);
  });
  
  const genericCount = countGenericTasks(result.tasks);
  console.log(`\n📈 THỐNG KÊ: Tổng ${result.tasks.length} tasks, ${genericCount} generic tasks (${Math.round(genericCount / result.tasks.length * 100)}%)`);
}

function printFallbackWorkflow(title: string, result: AIWorkflowResult) {
  console.log("⚠️  ĐANG SỬ DỤNG FALLBACK WORKFLOW (AI không khả dụng)");
  console.log(`   Dự án: ${title}`);
  console.log(`   Số tasks: ${result.tasks.length}`);
  printSeparator();
}

// ============================================================================
// MAIN TEST EXECUTION
// ============================================================================

async function runTests() {
  console.log("╔══════════════════════════════════════════════════════════════════════════════╗");
  console.log("║                    AI WORKFLOW GENERATOR - TEST SCRIPT                       ║");
  console.log("╚══════════════════════════════════════════════════════════════════════════════╝");
  printSeparator();

  for (const project of sampleProjects) {
    printProjectHeader(project);

    // Build the prompt
    const prompt = buildWorkflowGenerationPrompt(project);
    console.log("📝 PROMPT ĐÃ TẠO:");
    console.log(`   Độ dài: ${prompt.length} ký tự`);
    console.log(`   Preview: ${prompt.substring(0, 300)}...`);
    printSeparator();

    // In a real scenario, we would call the AI API here
    // For this test, we'll show what the prompt looks like
    console.log("🤖 GỬI YÊU CẦU ĐẾN AI API...");
    console.log("   (Trong môi trường thực tế, API sẽ gọi Groq/LLM để tạo workflow)");
    printSeparator();

    // Show fallback workflow as demonstration
    const fallbackResult = generateFallbackWorkflow(
      project.title,
      project.description,
      project.endDate ? Math.ceil((new Date(project.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
    );
    
    printFallbackWorkflow(project.title, fallbackResult);
    printAIWorkflowResult(fallbackResult);
    printSeparator();
  }

  // Test validation function
  console.log("🧪 KIỂM TRA HÀM VALIDATION:");
  
  const validResponse = {
    project_understanding: "Test understanding",
    key_deliverables: ["Deliverable 1", "Deliverable 2"],
    milestones: [
      { name: "Milestone 1", description: "Desc", tasks: ["Task 1"] }
    ],
    tasks: [
      {
        title: "Task cụ thể 1",
        description: "Mô tả task",
        priority: "High",
        estimated_days: 3,
        assignee_type: "Team Member",
        depends_on: []
      }
    ],
    workflow_risks: [],
    success_metrics: []
  };

  const validation = validateAIWorkflowResponse(validResponse, {
    minPhases: 0,
    minTasks: 1,
    minMilestones: 1,
    minRisks: 0,
    minSuccessMetrics: 0,
    minDeliverables: 1,
  });
  console.log(`   Valid response: ${validation.valid ? "✅ PASS" : "❌ FAIL"}`);

  const invalidResponse = { tasks: [] };
  const invalidValidation = validateAIWorkflowResponse(invalidResponse, {
    minPhases: 0,
    minTasks: 1,
    minMilestones: 0,
    minRisks: 0,
    minSuccessMetrics: 0,
    minDeliverables: 1,
  });
  console.log(`   Invalid response: ${!invalidValidation.valid ? "✅ PASS (correctly rejected)" : "❌ FAIL"}`);
  console.log(`   Errors: ${invalidValidation.errors.join(", ")}`);

  printSeparator();
  console.log("✅ HOÀN THÀNH TEST!");
}

// Run the tests
runTests().catch(console.error);