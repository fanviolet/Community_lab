# Workflow Save System Debug Report

## Executive Summary

The workflow system has TWO separate implementations:
1. **Workspace Workflow** (in project tabs) - Uses `ai_workflows` table
2. **Insights Workflow Generator** (standalone) - Uses `workflows` table

This report focuses on the **Workspace Workflow** system which is the primary workflow feature used in projects.

---

## Current Architecture

### Workspace Workflow System

**Location:** `src/app/dashboard/workspace/[id]/`

**Component:** `ProjectWorkflow.tsx`
**Actions:** `workflow-actions.ts`
**Database Table:** `ai_workflows`

### Data Flow

```
User generates workflow 
  → generateWorkflow() (mock data based on domain)
  → Auto-saves to ai_workflows table
  → Displays in UI
  → User can import selected tasks to tasks table
```

---

## Root Cause Analysis

### Issue 1: No Explicit Save Button

**Status:** ❌ CRITICAL

**Location:** `ProjectWorkflow.tsx` (lines 366-603)

**Problem:**
- No "Save Workflow" button exists in the UI
- Only "Generate Workflow" and "Regenerate" buttons
- Auto-save is the only save mechanism
- Auto-save only triggers when workflow state changes

**Impact:**
- Users cannot manually save workflows
- No visual feedback that save is available
- Users may not know workflow is being saved

---

### Issue 2: Auto-Save Limitations

**Status:** ⚠️ MODERATE

**Location:** `ProjectWorkflow.tsx` (lines 79-104)

**Current Implementation:**
```typescript
useEffect(() => {
  if (!workflow || !isLeader) return;

  if (autoSaveTimeoutRef.current) {
    clearTimeout(autoSaveTimeoutRef.current);
  }

  setSaveStatus("saving");
  autoSaveTimeoutRef.current = setTimeout(async () => {
    try {
      await saveWorkflow(projectId, workflow);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (err) {
      setSaveStatus("error");
      console.error("Auto-save failed:", err);
    }
  }, 5000);
}, [workflow, projectId, isLeader]);
```

**Problems:**
- Auto-save only triggers when `workflow` state changes
- If user edits workflow name/phases/tasks, auto-save may not trigger
- No manual save option if auto-save fails
- Save status only shows for 2 seconds then disappears

---

### Issue 3: No Regenerate Confirmation

**Status:** ⚠️ MODERATE

**Location:** `ProjectWorkflow.tsx` (line 387-390)

**Current Implementation:**
```typescript
<Button variant="outline" onClick={() => setViewMode("generate")}>
  <Sparkles className="mr-2 h-4 w-4" />
  Regenerate
</Button>
```

**Problem:**
- No confirmation modal before regenerating
- User can accidentally overwrite existing workflow
- No warning about data loss

---

### Issue 4: Database Schema Missing Fields

**Status:** ⚠️ MODERATE

**Location:** `supabase/0007_ai_workflows_table.sql`

**Current Schema:**
```sql
CREATE TABLE IF NOT EXISTS public.ai_workflows (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  workflow_json jsonb NOT NULL,
  generated_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
```

**Missing Fields (per requirements):**
- `workflow_name` TEXT - Human-readable workflow name
- `ai_prompt` TEXT - The AI prompt used to generate the workflow

**Impact:**
- Cannot store workflow name separately from JSON
- Cannot track which AI prompt generated the workflow
- Limited audit trail

---

### Issue 5: Mock Data Instead of Real AI

**Status:** ❌ CRITICAL

**Location:** `workflow-actions.ts` (lines 127-667)

**Current Implementation:**
- Uses `detectProjectDomain()` to determine project type
- Returns hardcoded phases based on domain (software, environmental, community, etc.)
- NO actual AI/LLM integration
- NO Vietnamese language output (though some Vietnamese strings exist)

**Problem:**
- Not actually using AI to generate workflows
- Workflows are static templates
- Cannot adapt to specific project context
- Violates requirement: "Do NOT use mock data"

---

### Issue 6: Load Workflow Works But No Empty State

**Status:** ⚠️ LOW

**Location:** `ProjectWorkflow.tsx` (lines 65-77)

**Current Implementation:**
```typescript
useEffect(() => {
  startTransition(async () => {
    try {
      const latest = await getLatestWorkflow(projectId);
      if (latest) {
        setWorkflow(latest);
        setViewMode("view");
      }
    } catch (err) {
      console.error("Failed to load latest workflow:", err);
    }
  });
}, [projectId]);
```

**Problem:**
- If no workflow exists, shows "Generate Workflow" screen
- No explicit "No workflow has been created yet" message
- No clear call-to-action

---

### Issue 7: Import Tasks Works But No Auto-Refresh

**Status:** ⚠️ MODERATE

**Location:** `ProjectWorkflow.tsx` (lines 190-223)

**Current Implementation:**
```typescript
await importTasks(projectId, tasksToImport);
setSelectedTasks(new Set());
setViewMode("view");
setError(null);
```

**Problem:**
- After importing tasks, does not refresh Task Board
- User must manually navigate to Tasks tab to see new tasks
- No confirmation that tasks were created

---

## Server Actions Status

### ✅ Implemented Functions

1. **saveWorkflow(projectId, workflow)** - Lines 856-899
   - Uses UPSERT logic (check if exists, then update or insert)
   - Validates user is leader
   - Revalidates path
   - Status: ✅ WORKING

2. **getLatestWorkflow(projectId)** - Lines 826-854
   - Queries ai_workflows by project_id
   - Returns most recent workflow
   - Validates user is member
   - Status: ✅ WORKING

3. **getProjectWorkflows(projectId)** - Lines 792-824
   - Returns all workflows for project
   - Ordered by created_at DESC
   - Status: ✅ WORKING

4. **deleteWorkflow(workflowId, projectId)** - Lines 901-920
   - Deletes workflow by ID
   - Validates user is leader
   - Status: ✅ WORKING

5. **importTasks(projectId, selectedTasks)** - Lines 922-960
   - Creates tasks from workflow
   - Inserts into tasks table
   - Logs activity
   - Status: ✅ WORKING

6. **calculatePhaseProgress(projectId, phaseName)** - Lines 962-984
   - Calculates progress based on existing tasks
   - Status: ✅ WORKING

---

## Database Schema Verification

### ai_workflows Table

**Migration:** `supabase/0007_ai_workflows_table.sql`

**Current Columns:**
- id (uuid, PRIMARY KEY)
- project_id (uuid, NOT NULL, REFERENCES projects)
- workflow_json (jsonb, NOT NULL)
- generated_by (uuid, NOT NULL, REFERENCES profiles)
- created_at (timestamptz, NOT NULL)
- updated_at (timestamptz, NOT NULL)

**RLS Policies:**
- Members can view project workflows ✅
- Leaders can create project workflows ✅
- Creators can update their workflows ✅
- Creators can delete their workflows ✅

**Indexes:**
- idx_ai_workflows_project_id ✅
- idx_ai_workflows_generated_by ✅
- idx_ai_workflows_created_at ✅

**Triggers:**
- update_ai_workflows_updated_at ✅

**Missing Fields:**
- workflow_name (TEXT)
- ai_prompt (TEXT)

---

## Vietnamese Language Support

**Status:** ⚠️ PARTIAL

**Location:** `workflow-actions.ts` (lines 735-768)

**Current Implementation:**
```typescript
const workflowTitle = `${project.title} - Quy trình Dự án ${domain.charAt(0).toUpperCase() + domain.slice(1)}`;
const projectSummary = `Dự án ${domain} này hiện đang ${project.status}...`;

// Translate phases to Vietnamese
const translatedPhases: WorkflowPhase[] = phasesWithProgress.map(phase => {
  const phaseTranslations: Record<string, { name: string; objective: string }> = {
    "Requirements": { name: "Yêu cầu", objective: "Xác định và tài liệu hóa các yêu cầu" },
    "Design": { name: "Thiết kế", objective: "Tạo kiến trúc hệ thống và thiết kế UI/UX" },
    // ... more translations
  };
  // ...
});
```

**Problems:**
- Only phase names are translated to Vietnamese
- Task descriptions remain in English
- Risk descriptions remain in English
- Success metrics remain in English
- Not using AI for Vietnamese generation
- Hardcoded translations only

---

## Recommendations

### Priority 1: Critical Fixes

1. **Add explicit "Save Workflow" button** to UI
2. **Replace mock data with real AI integration** (or clearly document as template-based)
3. **Add missing database fields** (workflow_name, ai_prompt)

### Priority 2: Important Improvements

4. **Add regenerate confirmation modal**
5. **Improve auto-save to trigger on all edits**
6. **Add "No workflow" empty state message**
7. **Auto-refresh Task Board after importing tasks**

### Priority 3: Nice to Have

8. **Full Vietnamese language support via AI**
9. **Workflow name editing capability**
10. **Workflow versioning/diff view**

---

## Files to Modify

1. `src/components/workspace/ProjectWorkflow.tsx` - Add save button, confirmation modal
2. `src/app/dashboard/workspace/[id]/workflow-actions.ts` - Add AI integration
3. `supabase/0010_add_workflow_name_prompt.sql` - Add missing fields (new migration)
4. `src/app/dashboard/workspace/[id]/page.tsx` - May need refresh logic

---

## Next Steps

1. Create migration for missing database fields
2. Add Save Workflow button to ProjectWorkflow.tsx
3. Add regenerate confirmation modal
4. Improve auto-save logic
5. Add empty state message
6. Implement real AI generation (or document as template-based)
7. Add full Vietnamese support
8. Test end-to-end workflow save/load
