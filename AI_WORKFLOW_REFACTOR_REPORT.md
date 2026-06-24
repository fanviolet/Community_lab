# AI Workflow Generator Refactoring Report

## Executive Summary

This report documents the complete refactoring of the AI Workflow Generator system in the Community Project Lab. The refactoring transforms the workflow generation from a **template-based approach** (using `detectProjectDomain()` + `getDomainPhases()`) to a **true AI-driven approach** that analyzes project content to create customized workflows.

## Problem Statement

### Previous System Issues

The old workflow generation system had the following problems:

1. **Template-based generation**: Used `detectProjectDomain()` to categorize projects into domains (software, community, environmental, education, health) and then applied hardcoded template phases from `getDomainPhases()`.

2. **Generic phases and tasks**: Always produced generic phases like:
   - Research / Nghiên cứu
   - Planning / Lập kế hoạch
   - Implementation / Triển khai
   - Evaluation / Đánh giá

3. **No project-specific analysis**: The workflow didn't reflect the actual needs of each project, regardless of the project's unique content, goals, or timeline.

4. **Fixed task counts**: Generated the same number of tasks regardless of the project timeline.

## Solution Architecture

### New AI-Driven Workflow Generation

```
┌─────────────────────────────────────────────────────────────────┐
│                     Workflow Generation Flow                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Gather Project Data                                          │
│     ├── Title & Description                                      │
│     ├── Start/End Dates                                          │
│     ├── Existing Tasks                                           │
│     ├── Team Members                                             │
│     ├── Recent Activities                                        │
│     ├── Pitch Content (if any)                                   │
│     └── AI Analysis of Pitch (if any)                            │
│                                                                  │
│  2. Build Project Context                                        │
│     ├── Calculate days remaining                                 │
│     ├── Determine task count range                               │
│     └── Format comprehensive context                             │
│                                                                  │
│  3. Call AI API (Primary)                                        │
│     ├── Build dynamic prompt                                     │
│     ├── Send to Groq/LLM                                         │
│     ├── Parse & validate response                                │
│     └── Check for generic tasks                                  │
│                                                                  │
│  4. Fallback (if AI fails)                                       │
│     └── Use template-based workflow                              │
│                                                                  │
│  5. Convert to Workflow Format                                   │
│     ├── Create phases from milestones                            │
│     ├── Calculate progress                                       │
│     └── Generate summary                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

#### 1. `src/lib/workflow-ai-generator.ts` (New Module)

The core AI workflow generator module containing:

- **Types**: `ProjectContext`, `AIWorkflowResult`, `AIGeneratedTask`, `AIGeneratedMilestone`, etc.
- **`calculateTaskCountRange()`**: Determines task count based on timeline:
  - ≤ 7 days: 5-10 tasks
  - ≤ 30 days: 10-20 tasks
  - ≤ 90 days: 15-30 tasks
  - > 90 days: 20-40 tasks
- **`buildProjectContext()`**: Creates comprehensive context from all project data
- **`buildWorkflowGenerationPrompt()`**: Generates detailed AI prompt with:
  - Project information
  - Timeline constraints
  - Team composition
  - Existing tasks
  - Pitch content and AI analysis
- **`validateAIWorkflowResponse()`**: Validates AI response structure and content
- **`isGenericTask()` / `countGenericTasks()`**: Detects and counts generic tasks
- **`generateFallbackWorkflow()`**: Template-based fallback when AI fails

#### 2. `src/app/api/workflow-ai/route.ts` (Updated)

The API endpoint that:
- Receives project context
- Builds AI prompt using `buildWorkflowGenerationPrompt()`
- Calls Groq API with the prompt
- Validates and returns AI-generated workflow

#### 3. `src/app/dashboard/workspace/[id]/workflow-actions.ts` (Refactored)

The main workflow generation function now:
1. Fetches ALL project data (title, description, dates, tasks, members, activities, pitch content, pitch AI analysis)
2. Builds comprehensive `ProjectContext`
3. Calls AI API via `callWorkflowAI()`
4. Validates AI response:
   - Checks for generic tasks (>30% triggers fallback)
   - Checks task count is reasonable
5. Falls back to template only if AI fails
6. Converts AI result to `GeneratedWorkflow` format
7. Saves to database with `used_fallback` flag

## AI Prompt Design

The AI prompt is designed to make the AI think like a Senior Project Manager:

### Key Instructions

1. **Role-play**: "You are a Senior Project Manager with 10+ years experience"
2. **Analysis requirements**: Must analyze project goals, deliverables, milestones, dependencies
3. **Strict rules against generic tasks**: Explicitly lists forbidden generic task patterns
4. **Timeline-aware**: Task count must match remaining time
5. **Quality over quantity**: Emphasizes specific, actionable tasks

### Output Format

The AI must return JSON with:
```json
{
  "project_understanding": "Deep analysis of the project",
  "key_deliverables": ["Deliverable 1", "Deliverable 2", ...],
  "milestones": [
    {
      "name": "Milestone name",
      "description": "What this milestone represents",
      "target_date": "YYYY-MM-DD",
      "tasks": ["Task 1", "Task 2"]
    }
  ],
  "tasks": [
    {
      "title": "Specific action verb + object",
      "description": "1-2 sentence description",
      "priority": "Low|Medium|High|Important",
      "estimated_days": 2,
      "assignee_type": "Team Leader|Team Member|Mentor",
      "depends_on": ["Prerequisite task"]
    }
  ],
  "workflow_risks": [...],
  "success_metrics": [...]
}
```

## Example: Before vs After

### Before (Template-Based)

For a "Community Arts Contest" project:
```
Phase 1: Nghiên cứu
  - Khảo sát cộng đồng
  - Phỏng vấn các bên liên quan
  
Phase 2: Tham gia các bên liên quan
  - Họp các bên liên quan
  - Phát triển đối tác
  
Phase 3: Tuyển dụng tình nguyện viên
  - Chiến dịch tuyển dụng
  
Phase 4: Triển khai
  - Triển khai hoạt động
  
Phase 5: Đánh giá
  - Phân tích dữ liệu
```

### After (AI-Driven)

For the same project:
```
Milestone 1: Chuẩn bị cuộc thi
  - Xây dựng thể lệ cuộc thi chi tiết
  - Thiết kế form đăng ký thí sinh trực tuyến
  - Liên hệ và mời giám khảo

Milestone 2: Truyền thông và tuyển sinh
  - Thiết kế poster và banner quảng bá
  - Chạy chiến dịch truyền thông mạng xã hội
  - Tổ chức buổi họp báo ra mắt

Milestone 3: Vòng sơ loại
  - Thu thập bài dự thi
  - Đánh giá và chấm điểm vòng sơ loại
  - Công bố kết quả vào vòng chung kết

Milestone 4: Chung kết và trao giải
  - Thuê địa điểm và chuẩn bị sân khấu
  - Tổ chức đêm chung kết
  - Trao giải và tổng kết
```

## Files Changed

| File | Change Type | Description |
|------|-------------|-------------|
| `src/lib/workflow-ai-generator.ts` | New | Core AI workflow generator module |
| `src/app/api/workflow-ai/route.ts` | Updated | Uses new generator, improved validation |
| `src/app/dashboard/workspace/[id]/workflow-actions.ts` | Refactored | Removed template-based generation, uses AI |
| `scripts/test-workflow-ai.ts` | New | Test script for 3 sample projects |

## Testing

### Test Script

Run the test script to see the system in action:
```bash
npx tsx scripts/test-workflow-ai.ts
```

The test demonstrates:
1. **Community Event**: "Cuộc thi Văn hóa Nghệ thuật Cộng đồng 2024"
2. **STEM Education**: "Chương trình Giáo dục STEM cho học sinh nông thôn"
3. **AI Software Platform**: "Nền tảng AI hỗ trợ học tập cá nhân hóa"

### Validation Tests

The test script validates:
- ✅ Valid AI response structure is accepted
- ✅ Invalid AI response is correctly rejected with error details

## Fallback Mechanism

The system has multiple layers of fallback:

1. **AI API Failure**: If the AI API call fails, use fallback workflow
2. **Invalid Response**: If AI returns invalid JSON structure, use fallback
3. **Too Many Generic Tasks**: If >30% of tasks are generic, use fallback
4. **Too Few Tasks**: If task count is below 50% of minimum, use fallback

The `used_fallback` flag is saved to the database for tracking.

## Migration Notes

### Database Schema

The existing `ai_workflows` table already supports the new format. A new column `used_fallback` (boolean) has been added to track whether the fallback was used.

### Backward Compatibility

The refactored system maintains backward compatibility:
- Existing workflows remain accessible
- The `GeneratedWorkflow` type structure is unchanged
- UI components don't need modification

## Benefits

1. **Project-specific workflows**: Each workflow is tailored to the actual project content
2. **Timeline-aware**: Task count adjusts based on remaining time
3. **No generic tasks**: AI is explicitly instructed to avoid generic tasks
4. **Comprehensive analysis**: Uses all available project data (pitch, activities, members)
5. **Quality validation**: Multiple checks ensure workflow quality
6. **Graceful degradation**: Fallback ensures system always produces a workflow

## Future Improvements

1. **Multi-language support**: Currently optimized for Vietnamese, can be extended
2. **Learning from feedback**: Track which workflows users modify most
3. **Industry-specific prompts**: Customize prompts for different project types
4. **Task dependency visualization**: Better display of task dependencies
5. **Resource allocation**: Suggest team member assignments based on skills

## Conclusion

The AI Workflow Generator refactoring successfully transforms the system from a template-based approach to a true AI-driven workflow generation system. The new system:

- ✅ Eliminates generic template phases
- ✅ Analyzes all project data comprehensively
- ✅ Adjusts task count based on timeline
- ✅ Generates specific, actionable tasks
- ✅ Includes robust fallback mechanism
- ✅ Maintains backward compatibility

The refactoring achieves the ultimate goal: **Workflows now resemble plans created by a real Project Manager, using full project data and realistic deadlines, instead of relying on fixed industry-specific templates.**