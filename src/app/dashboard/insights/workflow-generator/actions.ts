"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ============================================================================
// TYPES
// ============================================================================

export interface WorkflowInput {
  problemTitle: string;
  problemDescription: string;
  communityImpact: string;
  expectedGoal: string;
  estimatedTeamSize: number;
  projectId?: string;
}

export interface WorkflowOutput {
  workflowTitle: string;
  projectSummary: string;
  executiveSummary: string;
  phases: Array<{
    name: string;
    objective: string;
    deliverables: string[];
    suggestedTasks: string[];
    estimatedDuration: string;
    responsibleRoles: string[];
    order: number;
  }>;
  tasks: Array<{
    title: string;
    description: string;
    phase: string;
    duration: string;
    priority: string;
  }>;
  teamStructure: Array<{
    role: string;
    responsibilities: string[];
    count: number;
  }>;
  risks: Array<{
    risk: string;
    impact: string;
    mitigation: string;
    severity: string;
  }>;
  dependencies: Array<{
    description: string;
    type: string;
  }>;
  successMetrics: Array<{
    kpi: string;
    measurementMethod: string;
    targetValue: string;
  }>;
}

export interface SavedWorkflow {
  id: string;
  projectId: string | null;
  status: string | null;
  createdAt: string | null;
  input: WorkflowInput;
  output: WorkflowOutput;
}

interface WorkflowRow {
  id: string;
  project_id: string | null;
  problem_title: string;
  problem_description: string | null;
  community_impact: string | null;
  expected_goal: string | null;
  estimated_team_size: number | null;
  workflow_title: string | null;
  project_summary: string | null;
  executive_summary: string | null;
  phases: WorkflowOutput["phases"] | null;
  tasks: WorkflowOutput["tasks"] | null;
  team_structure: WorkflowOutput["teamStructure"] | null;
  risks: WorkflowOutput["risks"] | null;
  dependencies: WorkflowOutput["dependencies"] | null;
  success_metrics: WorkflowOutput["successMetrics"] | null;
  status: string | null;
  created_at: string | null;
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

// ============================================================================
// DOMAIN DETECTION
// ============================================================================

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

function getDomainPhases(domain: ProjectDomain): Array<{
  name: string;
  objective: string;
  deliverables: string[];
  suggestedTasks: string[];
  estimatedDuration: string;
  responsibleRoles: string[];
}> {
  switch (domain) {
    case "software":
      return [
        {
          name: "Requirements",
          objective: "Define and document software requirements",
          deliverables: ["Requirements document", "User stories", "Acceptance criteria"],
          suggestedTasks: ["Stakeholder interviews", "Requirements gathering", "Use case documentation"],
          estimatedDuration: "2-3 weeks",
          responsibleRoles: ["Product Manager", "Business Analyst"],
        },
        {
          name: "Design",
          objective: "Create system architecture and UI/UX designs",
          deliverables: ["System architecture", "Wireframes", "UI mockups", "Database schema"],
          suggestedTasks: ["Architecture design", "UI/UX prototyping", "Database design", "API specification"],
          estimatedDuration: "3-4 weeks",
          responsibleRoles: ["Software Architect", "UI/UX Designer"],
        },
        {
          name: "Development",
          objective: "Implement the software solution",
          deliverables: ["Source code", "Unit tests", "API endpoints", "Database implementation"],
          suggestedTasks: ["Frontend development", "Backend development", "API integration", "Database setup"],
          estimatedDuration: "8-12 weeks",
          responsibleRoles: ["Frontend Developer", "Backend Developer", "Full-stack Developer"],
        },
        {
          name: "Testing",
          objective: "Ensure software quality and functionality",
          deliverables: ["Test plan", "Test cases", "Bug reports", "QA report"],
          suggestedTasks: ["Unit testing", "Integration testing", "User acceptance testing", "Performance testing"],
          estimatedDuration: "3-4 weeks",
          responsibleRoles: ["QA Engineer", "Test Engineer"],
        },
        {
          name: "Deployment",
          objective: "Deploy software to production environment",
          deliverables: ["Deployment pipeline", "Production environment", "Documentation"],
          suggestedTasks: ["CI/CD setup", "Deployment configuration", "Monitoring setup", "User documentation"],
          estimatedDuration: "2-3 weeks",
          responsibleRoles: ["DevOps Engineer", "System Administrator"],
        },
      ];
    case "environmental":
      return [
        {
          name: "Assessment",
          objective: "Assess environmental impact and baseline conditions",
          deliverables: ["Environmental assessment report", "Baseline data", "Impact analysis"],
          suggestedTasks: ["Site assessment", "Data collection", "Impact analysis", "Stakeholder consultation"],
          estimatedDuration: "3-4 weeks",
          responsibleRoles: ["Environmental Scientist", "Project Manager"],
        },
        {
          name: "Awareness Campaign",
          objective: "Raise awareness about environmental issues",
          deliverables: ["Campaign materials", "Social media content", "Event plan"],
          suggestedTasks: ["Content creation", "Social media campaign", "Community outreach", "Partner engagement"],
          estimatedDuration: "4-6 weeks",
          responsibleRoles: ["Communications Lead", "Community Coordinator"],
        },
        {
          name: "Cleanup Operations",
          objective: "Execute environmental cleanup activities",
          deliverables: ["Cleanup sites", "Waste collected", "Volunteer hours logged"],
          suggestedTasks: ["Site preparation", "Volunteer coordination", "Cleanup execution", "Waste management"],
          estimatedDuration: "6-8 weeks",
          responsibleRoles: ["Operations Manager", "Volunteer Coordinator"],
        },
        {
          name: "Monitoring",
          objective: "Monitor environmental impact and progress",
          deliverables: ["Monitoring reports", "Impact metrics", "Progress dashboard"],
          suggestedTasks: ["Data collection", "Impact measurement", "Reporting", "Stakeholder updates"],
          estimatedDuration: "Ongoing",
          responsibleRoles: ["Monitoring Specialist", "Data Analyst"],
        },
      ];
    case "community":
      return [
        {
          name: "Research",
          objective: "Research community needs and existing solutions",
          deliverables: ["Community needs assessment", "Stakeholder map", "Gap analysis"],
          suggestedTasks: ["Community surveys", "Stakeholder interviews", "Research on best practices", "Resource mapping"],
          estimatedDuration: "3-4 weeks",
          responsibleRoles: ["Research Lead", "Community Liaison"],
        },
        {
          name: "Stakeholder Engagement",
          objective: "Engage key stakeholders and build partnerships",
          deliverables: ["Partnership agreements", "Stakeholder database", "Engagement plan"],
          suggestedTasks: ["Stakeholder meetings", "Partnership development", "Community forums", "Resource mobilization"],
          estimatedDuration: "4-6 weeks",
          responsibleRoles: ["Partnership Manager", "Community Organizer"],
        },
        {
          name: "Volunteer Recruitment",
          objective: "Recruit and onboard volunteers",
          deliverables: ["Volunteer database", "Training materials", "Onboarding process"],
          suggestedTasks: ["Recruitment campaign", "Volunteer screening", "Training sessions", "Onboarding"],
          estimatedDuration: "3-4 weeks",
          responsibleRoles: ["Volunteer Coordinator", "HR Coordinator"],
        },
        {
          name: "Execution",
          objective: "Execute community project activities",
          deliverables: ["Activity reports", "Impact data", "Documentation"],
          suggestedTasks: ["Activity implementation", "Progress tracking", "Community events", "Impact measurement"],
          estimatedDuration: "8-12 weeks",
          responsibleRoles: ["Project Manager", "Activity Coordinator"],
        },
        {
          name: "Evaluation",
          objective: "Evaluate project outcomes and impact",
          deliverables: ["Evaluation report", "Impact assessment", "Lessons learned"],
          suggestedTasks: ["Data analysis", "Impact assessment", "Stakeholder feedback", "Report writing"],
          estimatedDuration: "2-4 weeks",
          responsibleRoles: ["Evaluation Specialist", "Data Analyst"],
        },
      ];
    case "education":
      return [
        {
          name: "Curriculum Development",
          objective: "Develop educational curriculum and materials",
          deliverables: ["Curriculum document", "Lesson plans", "Learning materials", "Assessment tools"],
          suggestedTasks: ["Curriculum design", "Content development", "Material creation", "Assessment design"],
          estimatedDuration: "4-6 weeks",
          responsibleRoles: ["Curriculum Developer", "Subject Matter Expert"],
        },
        {
          name: "Teacher Training",
          objective: "Train teachers/facilitators on curriculum delivery",
          deliverables: ["Training program", "Teacher guides", "Training completion reports"],
          suggestedTasks: ["Training design", "Training delivery", "Teacher support", "Feedback collection"],
          estimatedDuration: "3-4 weeks",
          responsibleRoles: ["Training Lead", "Education Specialist"],
        },
        {
          name: "Implementation",
          objective: "Deliver educational program to learners",
          deliverables: ["Class delivery records", "Student attendance", "Learning outcomes"],
          suggestedTasks: ["Class scheduling", "Teaching delivery", "Student support", "Progress tracking"],
          estimatedDuration: "8-12 weeks",
          responsibleRoles: ["Teacher", "Teaching Assistant"],
        },
        {
          name: "Assessment",
          objective: "Assess learning outcomes and program effectiveness",
          deliverables: ["Assessment results", "Evaluation report", "Recommendations"],
          suggestedTasks: ["Student assessment", "Data analysis", "Program evaluation", "Reporting"],
          estimatedDuration: "2-3 weeks",
          responsibleRoles: ["Assessment Specialist", "Evaluator"],
        },
      ];
    case "health":
      return [
        {
          name: "Needs Assessment",
          objective: "Assess community health needs and resources",
          deliverables: ["Health needs report", "Resource inventory", "Gap analysis"],
          suggestedTasks: ["Community health survey", "Stakeholder consultation", "Resource mapping", "Data analysis"],
          estimatedDuration: "3-4 weeks",
          responsibleRoles: ["Public Health Specialist", "Researcher"],
        },
        {
          name: "Program Design",
          objective: "Design health intervention program",
          deliverables: ["Program design document", "Implementation plan", "Monitoring framework"],
          suggestedTasks: ["Program planning", "Stakeholder engagement", "Resource planning", "Protocol development"],
          estimatedDuration: "4-5 weeks",
          responsibleRoles: ["Program Designer", "Health Specialist"],
        },
        {
          name: "Implementation",
          objective: "Deliver health interventions",
          deliverables: ["Service delivery records", "Participant data", "Progress reports"],
          suggestedTasks: ["Service delivery", "Participant enrollment", "Health education", "Monitoring"],
          estimatedDuration: "8-12 weeks",
          responsibleRoles: ["Health Worker", "Program Coordinator"],
        },
        {
          name: "Evaluation",
          objective: "Evaluate health outcomes and program impact",
          deliverables: ["Health outcome data", "Evaluation report", "Impact assessment"],
          suggestedTasks: ["Health measurement", "Data analysis", "Outcome evaluation", "Reporting"],
          estimatedDuration: "3-4 weeks",
          responsibleRoles: ["Evaluator", "Data Analyst"],
        },
      ];
    default:
      return [
        {
          name: "Research",
          objective: "Gather information and understand the problem",
          deliverables: ["Research report", "Data collected", "Analysis"],
          suggestedTasks: ["Information gathering", "Data collection", "Analysis", "Documentation"],
          estimatedDuration: "2-4 weeks",
          responsibleRoles: ["Researcher", "Analyst"],
        },
        {
          name: "Planning",
          objective: "Develop detailed project plan",
          deliverables: ["Project plan", "Resource allocation", "Timeline"],
          suggestedTasks: ["Plan development", "Resource planning", "Timeline creation", "Risk assessment"],
          estimatedDuration: "2-3 weeks",
          responsibleRoles: ["Project Manager", "Planner"],
        },
        {
          name: "Execution",
          objective: "Implement project activities",
          deliverables: ["Activity completion", "Progress reports", "Deliverables"],
          suggestedTasks: ["Activity implementation", "Progress tracking", "Quality control", "Reporting"],
          estimatedDuration: "6-10 weeks",
          responsibleRoles: ["Project Team", "Coordinator"],
        },
        {
          name: "Monitoring",
          objective: "Monitor progress and performance",
          deliverables: ["Monitoring reports", "Performance data", "Adjustments"],
          suggestedTasks: ["Progress monitoring", "Data collection", "Performance analysis", "Adjustments"],
          estimatedDuration: "Ongoing",
          responsibleRoles: ["Monitor", "Analyst"],
        },
        {
          name: "Evaluation",
          objective: "Evaluate outcomes and impact",
          deliverables: ["Evaluation report", "Impact assessment", "Recommendations"],
          suggestedTasks: ["Outcome measurement", "Impact analysis", "Reporting", "Lessons learned"],
          estimatedDuration: "2-4 weeks",
          responsibleRoles: ["Evaluator", "Analyst"],
        },
      ];
  }
}

function getDomainTeamStructure(domain: ProjectDomain, teamSize: number): Array<{
  role: string;
  responsibilities: string[];
  count: number;
}> {
  switch (domain) {
    case "software":
      return [
        {
          role: "Product Manager",
          responsibilities: ["Requirements definition", "Stakeholder management", "Prioritization", "Roadmap planning"],
          count: 1,
        },
        {
          role: "Software Architect",
          responsibilities: ["System design", "Technical decisions", "Code review", "Architecture oversight"],
          count: 1,
        },
        {
          role: "Frontend Developer",
          responsibilities: ["UI implementation", "User experience", "Frontend testing"],
          count: Math.max(1, Math.floor(teamSize * 0.3)),
        },
        {
          role: "Backend Developer",
          responsibilities: ["API development", "Database management", "Server-side logic"],
          count: Math.max(1, Math.floor(teamSize * 0.3)),
        },
        {
          role: "QA Engineer",
          responsibilities: ["Testing", "Quality assurance", "Bug tracking"],
          count: Math.max(1, Math.floor(teamSize * 0.2)),
        },
      ];
    case "environmental":
      return [
        {
          role: "Project Manager",
          responsibilities: ["Project coordination", "Team management", "Stakeholder communication"],
          count: 1,
        },
        {
          role: "Environmental Scientist",
          responsibilities: ["Environmental assessment", "Impact analysis", "Technical guidance"],
          count: 1,
        },
        {
          role: "Field Coordinator",
          responsibilities: ["Field operations", "Volunteer coordination", "Site management"],
          count: Math.max(1, Math.floor(teamSize * 0.3)),
        },
        {
          role: "Community Liaison",
          responsibilities: ["Community engagement", "Stakeholder relations", "Communication"],
          count: Math.max(1, Math.floor(teamSize * 0.2)),
        },
        {
          role: "Volunteer",
          responsibilities: ["Field work", "Cleanup activities", "Data collection"],
          count: Math.max(2, teamSize - 3),
        },
      ];
    case "community":
      return [
        {
          role: "Project Director",
          responsibilities: ["Overall leadership", "Strategic direction", "Resource mobilization"],
          count: 1,
        },
        {
          role: "Community Organizer",
          responsibilities: ["Community engagement", "Volunteer recruitment", "Event coordination"],
          count: Math.max(1, Math.floor(teamSize * 0.3)),
        },
        {
          role: "Partnership Manager",
          responsibilities: ["Partner relationships", "Resource development", "Collaboration"],
          count: 1,
        },
        {
          role: "Program Coordinator",
          responsibilities: ["Activity coordination", "Logistics", "Implementation"],
          count: Math.max(1, Math.floor(teamSize * 0.2)),
        },
        {
          role: "Volunteer",
          responsibilities: ["Event support", "Outreach", "Administrative tasks"],
          count: Math.max(2, teamSize - 4),
        },
      ];
    case "education":
      return [
        {
          role: "Program Director",
          responsibilities: ["Program oversight", "Curriculum approval", "Stakeholder management"],
          count: 1,
        },
        {
          role: "Curriculum Developer",
          responsibilities: ["Content creation", "Material development", "Assessment design"],
          count: 1,
        },
        {
          role: "Teacher/Facilitator",
          responsibilities: ["Teaching delivery", "Student support", "Progress tracking"],
          count: Math.max(2, Math.floor(teamSize * 0.4)),
        },
        {
          role: "Training Coordinator",
          responsibilities: ["Training delivery", "Teacher support", "Quality assurance"],
          count: Math.max(1, Math.floor(teamSize * 0.2)),
        },
        {
          role: "Support Staff",
          responsibilities: ["Administrative support", "Logistics", "Materials management"],
          count: Math.max(1, teamSize - 5),
        },
      ];
    case "health":
      return [
        {
          role: "Program Manager",
          responsibilities: ["Program coordination", "Team management", "Stakeholder relations"],
          count: 1,
        },
        {
          role: "Health Specialist",
          responsibilities: ["Technical guidance", "Protocol development", "Quality assurance"],
          count: 1,
        },
        {
          role: "Health Worker",
          responsibilities: ["Service delivery", "Patient care", "Health education"],
          count: Math.max(2, Math.floor(teamSize * 0.4)),
        },
        {
          role: "Community Health Worker",
          responsibilities: ["Community outreach", "Home visits", "Follow-up"],
          count: Math.max(1, Math.floor(teamSize * 0.3)),
        },
        {
          role: "Data Collector",
          responsibilities: ["Data collection", "Recording", "Reporting"],
          count: Math.max(1, teamSize - 5),
        },
      ];
    default:
      return [
        {
          role: "Project Leader",
          responsibilities: ["Overall coordination", "Team management", "Decision making"],
          count: 1,
        },
        {
          role: "Coordinator",
          responsibilities: ["Activity coordination", "Logistics", "Communication"],
          count: Math.max(1, Math.floor(teamSize * 0.2)),
        },
        {
          role: "Specialist",
          responsibilities: ["Technical expertise", "Quality assurance", "Guidance"],
          count: Math.max(1, Math.floor(teamSize * 0.2)),
        },
        {
          role: "Team Member",
          responsibilities: ["Task execution", "Progress reporting", "Collaboration"],
          count: Math.max(2, teamSize - 3),
        },
      ];
  }
}

function getDomainRisks(domain: ProjectDomain): Array<{
  risk: string;
  impact: string;
  mitigation: string;
  severity: string;
}> {
  switch (domain) {
    case "software":
      return [
        {
          risk: "Scope creep",
          impact: "High",
          mitigation: "Clear requirements definition and change management process",
          severity: "high",
        },
        {
          risk: "Technical debt accumulation",
          impact: "Medium",
          mitigation: "Code reviews, refactoring sprints, and architectural guidelines",
          severity: "medium",
        },
        {
          risk: "Talent shortage",
          impact: "High",
          mitigation: "Cross-training, documentation, and flexible hiring",
          severity: "high",
        },
        {
          risk: "Security vulnerabilities",
          impact: "High",
          mitigation: "Security testing, code audits, and best practices",
          severity: "high",
        },
        {
          risk: "Integration failures",
          impact: "Medium",
          mitigation: "API contracts, integration testing, and gradual rollout",
          severity: "medium",
        },
      ];
    case "environmental":
      return [
        {
          risk: "Weather disruptions",
          impact: "High",
          mitigation: "Flexible scheduling, contingency plans, and weather monitoring",
          severity: "high",
        },
        {
          risk: "Regulatory changes",
          impact: "Medium",
          mitigation: "Compliance monitoring, legal consultation, and adaptive planning",
          severity: "medium",
        },
        {
          risk: "Volunteer attrition",
          impact: "Medium",
          mitigation: "Engagement programs, recognition, and flexible scheduling",
          severity: "medium",
        },
        {
          risk: "Funding shortfalls",
          impact: "High",
          mitigation: "Diverse funding sources, cost optimization, and contingency reserves",
          severity: "high",
        },
        {
          risk: "Community resistance",
          impact: "Low",
          mitigation: "Early engagement, transparent communication, and benefit demonstration",
          severity: "low",
        },
      ];
    case "community":
      return [
        {
          risk: "Low community participation",
          impact: "High",
          mitigation: "Early engagement, incentive programs, and inclusive planning",
          severity: "high",
        },
        {
          risk: "Stakeholder conflicts",
          impact: "Medium",
          mitigation: "Conflict resolution processes, clear communication, and inclusive governance",
          severity: "medium",
        },
        {
          risk: "Resource constraints",
          impact: "High",
          mitigation: "Resource diversification, partnerships, and efficient allocation",
          severity: "high",
        },
        {
          risk: "Volunteer burnout",
          impact: "Medium",
          mitigation: "Workload balancing, recognition, and support systems",
          severity: "medium",
        },
        {
          risk: "Sustainability challenges",
          impact: "Medium",
          mitigation: "Capacity building, local ownership, and long-term planning",
          severity: "medium",
        },
      ];
    case "education":
      return [
        {
          risk: "Low student engagement",
          impact: "High",
          mitigation: "Interactive teaching methods, relevant content, and student feedback",
          severity: "high",
        },
        {
          risk: "Teacher turnover",
          impact: "High",
          mitigation: "Professional development, support systems, and competitive compensation",
          severity: "high",
        },
        {
          risk: "Curriculum relevance",
          impact: "Medium",
          mitigation: "Regular review, stakeholder input, and industry alignment",
          severity: "medium",
        },
        {
          risk: "Resource limitations",
          impact: "Medium",
          mitigation: "Resource optimization, partnerships, and creative solutions",
          severity: "medium",
        },
        {
          risk: "Assessment challenges",
          impact: "Low",
          mitigation: "Clear criteria, multiple assessment methods, and training",
          severity: "low",
        },
      ];
    case "health":
      return [
        {
          risk: "Participant dropout",
          impact: "High",
          mitigation: "Engagement strategies, follow-up systems, and support services",
          severity: "high",
        },
        {
          risk: "Resource shortages",
          impact: "High",
          mitigation: "Resource planning, partnerships, and contingency reserves",
          severity: "high",
        },
        {
          risk: "Compliance issues",
          impact: "High",
          mitigation: "Regulatory monitoring, training, and quality systems",
          severity: "high",
        },
        {
          risk: "Data quality issues",
          impact: "Medium",
          mitigation: "Standardized protocols, training, and quality checks",
          severity: "medium",
        },
        {
          risk: "Stigma barriers",
          impact: "Medium",
          mitigation: "Community education, sensitive approaches, and trust building",
          severity: "medium",
        },
      ];
    default:
      return [
        {
          risk: "Timeline delays",
          impact: "Medium",
          mitigation: "Buffer time, contingency planning, and regular monitoring",
          severity: "medium",
        },
        {
          risk: "Budget overruns",
          impact: "High",
          mitigation: "Detailed budgeting, regular tracking, and cost controls",
          severity: "high",
        },
        {
          risk: "Resource constraints",
          impact: "Medium",
          mitigation: "Resource planning, partnerships, and optimization",
          severity: "medium",
        },
        {
          risk: "Stakeholder misalignment",
          impact: "Medium",
          mitigation: "Regular communication, expectation management, and inclusive planning",
          severity: "medium",
        },
        {
          risk: "Quality issues",
          impact: "Low",
          mitigation: "Quality standards, monitoring, and continuous improvement",
          severity: "low",
        },
      ];
  }
}

function getDomainDependencies(domain: ProjectDomain): Array<{
  description: string;
  type: string;
}> {
  switch (domain) {
    case "software":
      return [
        { description: "Requirements must be approved before design phase", type: "sequential" },
        { description: "Design must be completed before development", type: "sequential" },
        { description: "Development must be completed before testing", type: "sequential" },
        { description: "Testing must pass before deployment", type: "sequential" },
        { description: "Infrastructure setup needed for deployment", type: "external" },
      ];
    case "environmental":
      return [
        { description: "Assessment must inform campaign strategy", type: "sequential" },
        { description: "Awareness campaign supports volunteer recruitment", type: "supporting" },
        { description: "Cleanup operations require volunteer availability", type: "resource" },
        { description: "Monitoring depends on baseline data from assessment", type: "sequential" },
        { description: "Weather conditions affect cleanup operations", type: "external" },
      ];
    case "community":
      return [
        { description: "Research findings inform stakeholder engagement strategy", type: "sequential" },
        { description: "Stakeholder support enables volunteer recruitment", type: "supporting" },
        { description: "Volunteers required for execution phase", type: "resource" },
        { description: "Evaluation depends on execution data", type: "sequential" },
        { description: "Community approval needed for activities", type: "external" },
      ];
    case "education":
      return [
        { description: "Curriculum must be developed before teacher training", type: "sequential" },
        { description: "Teacher training required before implementation", type: "sequential" },
        { description: "Learning materials needed for implementation", type: "resource" },
        { description: "Assessment tools must be designed before use", type: "sequential" },
        { description: "Student enrollment affects implementation scale", type: "external" },
      ];
    case "health":
      return [
        { description: "Needs assessment informs program design", type: "sequential" },
        { description: "Program approval required before implementation", type: "external" },
        { description: "Trained staff needed for service delivery", type: "resource" },
        { description: "Medical supplies required for implementation", type: "resource" },
        { description: "Evaluation depends on implementation data", type: "sequential" },
      ];
    default:
      return [
        { description: "Planning must be completed before execution", type: "sequential" },
        { description: "Resources must be available for execution", type: "resource" },
        { description: "Monitoring depends on execution progress", type: "sequential" },
        { description: "Evaluation requires completion of activities", type: "sequential" },
        { description: "External approvals may be needed", type: "external" },
      ];
  }
}

// ============================================================================
// AI WORKFLOW GENERATION
// ============================================================================

export async function generateWorkflow(formData: FormData): Promise<WorkflowOutput> {
  const problemTitle = String(formData.get("problemTitle") ?? "").trim();
  const problemDescription = String(formData.get("problemDescription") ?? "").trim();
  const communityImpact = String(formData.get("communityImpact") ?? "").trim();
  const expectedGoal = String(formData.get("expectedGoal") ?? "").trim();
  const estimatedTeamSize = Number(formData.get("estimatedTeamSize") ?? "5");
  const projectId = String(formData.get("projectId") ?? "").trim() || undefined;

  if (!problemTitle || !problemDescription) {
    throw new Error("Problem title and description are required");
  }

  // Fetch project data if projectId is provided
  let projectData: any = null;
  let tasks: any[] = [];
  let members: any[] = [];
  let activities: any[] = [];

  if (projectId) {
    const { supabase, user } = await getSupabaseClient();

    // Check if user is a member
    const { data: membership } = await supabase
      .from("project_members")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership) {
      throw new Error("You must be a project member to generate workflows for this project");
    }

    const [projectResult, tasksResult, membersResult, activitiesResult] = await Promise.all([
      supabase
        .from("projects")
        .select("id,title,description,status,created_at")
        .eq("id", projectId)
        .maybeSingle(),
      supabase
        .from("tasks")
        .select("id,title,description,status,priority")
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

    if (projectResult.data) {
      projectData = projectResult.data;
    }
    if (tasksResult.data) {
      tasks = tasksResult.data;
    }
    if (membersResult.data) {
      members = membersResult.data;
    }
    if (activitiesResult.data) {
      activities = activitiesResult.data;
    }
  }

  // Use project data if available, otherwise use form input
  const title = projectData?.title || problemTitle;
  const description = projectData?.description || problemDescription;
  const status = projectData?.status || "planning";

  // Detect project domain
  const domain = detectProjectDomain(title, description, tasks);

  // Get domain-specific phases
  const domainPhases = getDomainPhases(domain);
  const phases = domainPhases.map((phase, index) => ({
    name: phase.name,
    objective: phase.objective,
    deliverables: phase.deliverables,
    suggestedTasks: phase.suggestedTasks,
    estimatedDuration: phase.estimatedDuration,
    responsibleRoles: phase.responsibleRoles,
    order: index + 1,
  }));

  // Get domain-specific team structure
  const teamStructure = getDomainTeamStructure(domain, estimatedTeamSize);

  // Get domain-specific risks
  const risks = getDomainRisks(domain);

  // Get domain-specific dependencies
  const dependencies = getDomainDependencies(domain);

  // Generate tasks from phases
  const tasksList: Array<{
    title: string;
    description: string;
    phase: string;
    duration: string;
    priority: string;
  }> = [];

  phases.forEach((phase) => {
    phase.suggestedTasks.forEach((task, index) => {
      tasksList.push({
        title: task,
        description: `Complete ${task.toLowerCase()} as part of ${phase.name} phase`,
        phase: phase.name,
        duration: Math.ceil(parseFloat(phase.estimatedDuration) / phase.suggestedTasks.length).toString() + " weeks",
        priority: index === 0 ? "high" : "medium",
      });
    });
  });

  // Generate domain-specific success metrics
  const successMetrics = (() => {
    switch (domain) {
      case "software":
        return [
          {
            kpi: "Code Quality",
            measurementMethod: "Code review pass rate, test coverage",
            targetValue: "> 80% test coverage, < 5 critical bugs",
          },
          {
            kpi: "Delivery Timeline",
            measurementMethod: "Milestone completion tracking",
            targetValue: "All milestones on time",
          },
          {
            kpi: "User Satisfaction",
            measurementMethod: "User feedback surveys",
            targetValue: "> 4.5/5 rating",
          },
          {
            kpi: "System Performance",
            measurementMethod: "Load testing, response time monitoring",
            targetValue: "< 2s response time, 99.9% uptime",
          },
        ];
      case "environmental":
        return [
          {
            kpi: "Environmental Impact",
            measurementMethod: "Pre/post environmental assessment",
            targetValue: "Measurable improvement in target indicators",
          },
          {
            kpi: "Community Engagement",
            measurementMethod: "Event attendance, volunteer participation",
            targetValue: "> 70% target community engagement",
          },
          {
            kpi: "Waste Collected",
            measurementMethod: "Weight/volume measurement",
            targetValue: "Target waste collection goal met",
          },
          {
            kpi: "Volunteer Hours",
            measurementMethod: "Hours logged",
            targetValue: "> 500 volunteer hours",
          },
        ];
      case "community":
        return [
          {
            kpi: "Community Reach",
            measurementMethod: "Surveys, event attendance",
            targetValue: "> 60% of target community reached",
          },
          {
            kpi: "Stakeholder Engagement",
            measurementMethod: "Meeting attendance, partnership agreements",
            targetValue: "> 10 active partnerships",
          },
          {
            kpi: "Volunteer Retention",
            measurementMethod: "Volunteer tracking",
            targetValue: "> 70% retention rate",
          },
          {
            kpi: "Activity Completion",
            measurementMethod: "Progress tracking",
            targetValue: "> 90% of planned activities completed",
          },
        ];
      case "education":
        return [
          {
            kpi: "Learning Outcomes",
            measurementMethod: "Pre/post assessments",
            targetValue: "> 70% improvement in learning metrics",
          },
          {
            kpi: "Student Engagement",
            measurementMethod: "Attendance, participation",
            targetValue: "> 80% average attendance",
          },
          {
            kpi: "Teacher Satisfaction",
            measurementMethod: "Teacher feedback surveys",
            targetValue: "> 4/5 average rating",
          },
          {
            kpi: "Curriculum Completion",
            measurementMethod: "Progress tracking",
            targetValue: "> 90% curriculum completion rate",
          },
        ];
      case "health":
        return [
          {
            kpi: "Health Outcomes",
            measurementMethod: "Pre/post health measurements",
            targetValue: "Measurable improvement in health indicators",
          },
          {
            kpi: "Service Utilization",
            measurementMethod: "Service delivery records",
            targetValue: "> 80% target population served",
          },
          {
            kpi: "Participant Satisfaction",
            measurementMethod: "Patient feedback surveys",
            targetValue: "> 4/5 average rating",
          },
          {
            kpi: "Follow-up Rate",
            measurementMethod: "Follow-up tracking",
            targetValue: "> 70% follow-up completion",
          },
        ];
      default:
        return [
          {
            kpi: "Task Completion Rate",
            measurementMethod: "Project tracking system",
            targetValue: "> 90% of tasks completed",
          },
          {
            kpi: "Timeline Adherence",
            measurementMethod: "Milestone tracking",
            targetValue: "All milestones on time",
          },
          {
            kpi: "Budget Utilization",
            measurementMethod: "Financial tracking",
            targetValue: "Within 10% of budget",
          },
          {
            kpi: "Stakeholder Satisfaction",
            measurementMethod: "Feedback surveys",
            targetValue: "> 4/5 average rating",
          },
        ];
    }
  })();

  const workflowTitle = `${title} - ${domain.charAt(0).toUpperCase() + domain.slice(1)} Project Workflow`;
  const projectSummary = `This ${domain} project aims to ${expectedGoal.toLowerCase()}. Current status: ${status}. The project involves ${members.length || estimatedTeamSize} team members and has ${tasks.length} existing tasks. The workflow is tailored to the specific needs and best practices of ${domain} projects.`;
  const executiveSummary = `${workflowTitle} provides a structured approach to address "${title}". Based on the project's domain (${domain}), this workflow includes ${phases.length} key phases: ${phases.map(p => p.name).join(", ")}. The team structure is optimized for ${domain} projects with ${teamStructure.reduce((sum, role) => sum + role.count, 0)} roles across ${teamStructure.length} categories. Key risks identified include ${risks.slice(0, 2).map(r => r.risk).join(" and ")}. Success will be measured through ${successMetrics.length} key performance indicators including ${successMetrics[0].kpi} and ${successMetrics[1].kpi}.`;

  const workflow: WorkflowOutput = {
    workflowTitle,
    projectSummary,
    executiveSummary,
    phases,
    tasks: tasksList,
    teamStructure,
    risks,
    dependencies,
    successMetrics,
  };

  return workflow;
}

// ============================================================================
// SAVE WORKFLOW
// ============================================================================

export async function saveWorkflow(
  input: WorkflowInput,
  output: WorkflowOutput,
  projectId?: string
): Promise<string> {
  const { supabase, user } = await getSupabaseClient();

  const { data, error } = await supabase
    .from("workflows")
    .insert({
      user_id: user.id,
      project_id: projectId || null,
      problem_title: input.problemTitle,
      problem_description: input.problemDescription,
      community_impact: input.communityImpact,
      expected_goal: input.expectedGoal,
      estimated_team_size: input.estimatedTeamSize,
      workflow_title: output.workflowTitle,
      project_summary: output.projectSummary,
      executive_summary: output.executiveSummary,
      phases: output.phases,
      tasks: output.tasks,
      team_structure: output.teamStructure,
      risks: output.risks,
      dependencies: output.dependencies,
      success_metrics: output.successMetrics,
      status: "saved",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[saveWorkflow] Error:", error);
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/insights/workflow-generator");
  return data.id;
}

// ============================================================================
// GET WORKFLOWS
// ============================================================================

export async function getUserWorkflows() {
  const { supabase, user } = await getSupabaseClient();

  const { data, error } = await supabase
    .from("workflows")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getUserWorkflows] Error:", error);
    throw new Error(error.message);
  }

  const rows = (data ?? []) as WorkflowRow[];

  return rows.map((row): SavedWorkflow => ({
    id: row.id,
    projectId: row.project_id,
    status: row.status,
    createdAt: row.created_at,
    input: {
      problemTitle: row.problem_title,
      problemDescription: row.problem_description ?? "",
      communityImpact: row.community_impact ?? "",
      expectedGoal: row.expected_goal ?? "",
      estimatedTeamSize: row.estimated_team_size ?? 0,
    },
    output: {
      workflowTitle: row.workflow_title ?? "",
      projectSummary: row.project_summary ?? "",
      executiveSummary: row.executive_summary ?? "",
      phases: Array.isArray(row.phases) ? row.phases : [],
      tasks: Array.isArray(row.tasks) ? row.tasks : [],
      teamStructure: Array.isArray(row.team_structure) ? row.team_structure : [],
      risks: Array.isArray(row.risks) ? row.risks : [],
      dependencies: Array.isArray(row.dependencies) ? row.dependencies : [],
      successMetrics: Array.isArray(row.success_metrics) ? row.success_metrics : [],
    },
  }));
}

export async function getWorkflowById(id: string) {
  const { supabase, user } = await getSupabaseClient();

  const { data, error } = await supabase
    .from("workflows")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[getWorkflowById] Error:", error);
    throw new Error(error.message);
  }

  return data;
}
