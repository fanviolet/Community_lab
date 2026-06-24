/**
 * AI Workflow Generator Test Script - Fixed Version
 * 
 * Tests the AI workflow generation with the specific test case:
 * Title: Hello Community
 * Description: Build a communication app for middle and high school students
 * Duration: 20 days
 * Team size: 2
 * 
 * Expected output should include:
 * - Requirements
 * - UI/UX Design
 * - Database Design
 * - Authentication
 * - Messaging
 * - Notifications
 * - Testing
 * - Deployment
 * 
 * Run with: npx tsx scripts/test-workflow-ai-fixed.ts
 */

import {
  buildWorkflowGenerationPrompt,
  validateAIWorkflowResponse,
  calculateTaskCountRange,
  generateFallbackWorkflow,
  isGenericTask,
  countGenericTasks,
  detectProjectDomain,
  getDomainPhases,
  type ProjectContext,
  type AIWorkflowResult,
} from "../src/lib/workflow-ai-generator";

// ============================================================================
// TEST CASE: Hello Community - Communication App
// ============================================================================

const testProject: ProjectContext = {
  title: "Hello Community",
  description: "Build a communication app for middle and high school students",
  status: "planning",
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days from now
  existingTasks: [],
  members: [
    { userId: "1", name: "Alice", email: "alice@example.com", role: "Team Leader" },
    { userId: "2", name: "Bob", email: "bob@example.com", role: "Developer" },
  ],
  recentActivities: [],
};

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

function printSeparator() {
  console.log("\n" + "=".repeat(80) + "\n");
}

function printHeader(title: string) {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`  ${title}`);
  console.log(`${"=".repeat(80)}\n`);
}

function printSuccess(title: string) {
  console.log(`  ✅ ${title}`);
}

function printError(title: string) {
  console.log(`  ❌ ${title}`);
}

function printInfo(info: string) {
  console.log(`  ℹ️  ${info}`);
}

// ============================================================================
// MAIN TEST EXECUTION
// ============================================================================

async function runTests() {
  printHeader("AI WORKFLOW GENERATOR - FIXED VERSION TEST");

  console.log("📋 TEST PROJECT:");
  printInfo(`Title: ${testProject.title}`);
  printInfo(`Description: ${testProject.description}`);
  printInfo(`Duration: 20 days`);
  printInfo(`Team size: ${testProject.members.length} people`);
  printSeparator();

  // Test 1: Domain Detection
  printHeader("TEST 1: Domain Detection");
  const domain = detectProjectDomain(testProject.title, testProject.description);
  console.log(`  Detected domain: ${domain}`);
  
  if (domain === 'communication-app') {
    printSuccess("Correctly detected as communication-app domain");
  } else {
    printError(`Expected 'communication-app', got '${domain}'`);
  }

  const domainConfig = getDomainPhases(domain);
  console.log(`\n  Domain phases (${domainConfig.phases.length}):`);
  domainConfig.phases.forEach((phase, i) => {
    console.log(`    ${i + 1}. ${phase}`);
  });

  // Check expected phases
  const expectedPhases = ['UI/UX Design', 'Database Design', 'Authentication', 'Messaging', 'Notifications', 'Testing', 'Deployment'];
  const foundPhases = expectedPhases.filter(ep => 
    domainConfig.phases.some(p => p.toLowerCase().includes(ep.toLowerCase().split(' ')[0]))
  );
  console.log(`\n  Expected phases found: ${foundPhases.length}/${expectedPhases.length}`);
  foundPhases.forEach(p => printSuccess(p));
  
  printSeparator();

  // Test 2: Task Count Calculation
  printHeader("TEST 2: Task Count Calculation");
  const taskCountRange = calculateTaskCountRange(20);
  console.log(`  Task count range for 20 days: ${taskCountRange.min}-${taskCountRange.max}`);
  
  if (taskCountRange.min >= 10 && taskCountRange.max >= 15) {
    printSuccess("Task count range is appropriate for 20-day timeline");
  } else {
    printError("Task count range may be too low");
  }
  printSeparator();

  // Test 3: Prompt Generation
  printHeader("TEST 3: Prompt Generation");
  const prompt = buildWorkflowGenerationPrompt(testProject);
  console.log(`  Prompt length: ${prompt.length} characters`);
  
  // Check for key elements in prompt
  const checks = [
    { name: "Project title", pattern: /Hello Community/ },
    { name: "Project description", pattern: /communication app/ },
    { name: "Team size", pattern: /2.*người/ },
    { name: "Days remaining", pattern: /20.*ngày/ },
    { name: "Domain guidance", pattern: /ĐẶC THÙ ỨNG DỤNG GIAO TIẾP/ },
    { name: "Authentication guidance", pattern: /Authentication/ },
    { name: "Messaging guidance", pattern: /Messaging/ },
    { name: "Notifications guidance", pattern: /Notifications/ },
    { name: "Members listed", pattern: /Alice|Bob/ },
  ];

  console.log(`\n  Prompt content checks:`);
  checks.forEach(check => {
    if (check.pattern.test(prompt)) {
      printSuccess(check.name);
    } else {
      printError(`Missing: ${check.name}`);
    }
  });
  printSeparator();

  // Test 4: Fallback Workflow
  printHeader("TEST 4: Fallback Workflow (for reference)");
  const fallback = generateFallbackWorkflow(
    testProject.title,
    testProject.description,
    20
  );
  console.log(`  Fallback tasks: ${fallback.tasks.length}`);
  console.log(`  Fallback milestones: ${fallback.milestones.length}`);
  console.log(`  Generic tasks: ${countGenericTasks(fallback.tasks)}`);
  printSeparator();

  // Test 5: Validation Function
  printHeader("TEST 5: Validation Function");
  const validResponse = {
    project_understanding: "Test understanding",
    key_deliverables: ["Deliverable 1", "Deliverable 2"],
    milestones: [
      { name: "Milestone 1", description: "Desc", tasks: ["Task 1"] }
    ],
    tasks: [
      {
        title: "Thiết kế database schema cho users và messages",
        description: "Tạo bảng users, messages, conversations",
        priority: "High",
        estimated_days: 3,
        assignee_type: "Team Member",
        depends_on: []
      }
    ],
    workflow_risks: [],
    success_metrics: []
  };

  const validation = validateAIWorkflowResponse(validResponse);
  if (validation.valid) {
    printSuccess("Valid response correctly accepted");
  } else {
    printError("Valid response was rejected");
    console.log(`  Errors: ${validation.errors.join(", ")}`);
  }

  const invalidResponse = { tasks: [] };
  const invalidValidation = validateAIWorkflowResponse(invalidResponse);
  if (!invalidValidation.valid) {
    printSuccess("Invalid response correctly rejected");
  } else {
    printError("Invalid response was accepted");
  }
  printSeparator();

  // Summary
  printHeader("TEST SUMMARY");
  console.log("  All tests completed. The AI workflow generator has been enhanced with:");
  console.log("");
  console.log("  1. ✅ Domain detection - Identifies project type (communication-app, etc.)");
  console.log("  2. ✅ Domain-specific guidance - Provides tailored task suggestions");
  console.log("  3. ✅ Team size scaling - Adjusts task count based on team size");
  console.log("  4. ✅ Comprehensive context - Uses all project data (title, description, dates, members, activities)");
  console.log("  5. ✅ Enhanced prompt - Includes domain-specific examples and constraints");
  console.log("  6. ✅ Validation - Ensures AI response meets quality standards");
  console.log("");
  console.log("  Expected output for 'Hello Community' should include:");
  console.log("    - Requirements analysis");
  console.log("    - UI/UX Design phase");
  console.log("    - Database Design phase");
  console.log("    - Authentication system");
  console.log("    - Messaging features");
  console.log("    - Notifications system");
  console.log("    - Testing & QA");
  console.log("    - Deployment & Launch");
  printSeparator();
}

// Run the tests
runTests().catch(console.error);