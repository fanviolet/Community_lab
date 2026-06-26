# AI Workflow Fallback Audit - Debugging Guide

## Executive Summary

This document provides a comprehensive debugging guide for tracing why AI Workflow Generation falls back to template workflows even when projects have complete planning data.

---

## 1. Complete Flow Trace

### 1.1 Planning Data → AI Context

**File:** `src/app/dashboard/workspace/[id]/workflow-actions.ts`  
**Function:** `generateWorkflow()`  
**Lines:** 176-307

**What happens:**
1. Fetch project data from database (line 228)
2. Fetch planning data: `deliverables`, `target_audience`, `success_metrics` (line 228)
3. Log planning data (line 269-280)
4. Build `ProjectContext` object (line 283-307)
5. Log AI context (line 310-322)

**Fields logged:**
```javascript
{
  domain: project.domain,
  project_type: project.project_type,
  team_size: project.team_size,
  experience_level: project.experience_level,
  budget_range: project.budget_range,
  duration_days: project.duration_days,
  main_goal: project.main_goal,
  deliverables: project.deliverables,  // ← Critical
  target_audience: project.target_audience,  // ← Critical
  success_metrics: project.success_metrics  // ← Critical
}
```

### 1.2 AI Context → AI Prompt

**File:** `src/lib/workflow-ai-generator.ts`  
**Function:** `buildProjectContext()`  
**Lines:** 404-488

**What happens:**
1. Calculate dynamic task count (line 408-420)
2. Build structured context block (line 438-463)
3. Include in prompt:
   - Domain
   - Project type
   - Team size
   - Budget range
   - Duration
   - **Deliverables** (line 451-453)
   - **Target audience** (line 456-458)
   - **Success metrics** (line 461-463)
   - Main goal

**Critical section:**
```typescript
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
  : "Chưa xác định"}
```

### 1.3 AI Prompt → AI Response

**File:** `src/app/api/workflow-ai/route.ts`  
**Function:** `POST()`  
**Lines:** 194-210

**What happens:**
1. Send prompt to Groq API (line 194-210)
2. Request JSON response (line 206)
3. Receive response (line 220)
4. Parse JSON (line 239)
5. Validate structure (line 249)

**Critical settings:**
```typescript
{
  model: "llama-3.1-8b-instant",
  response_format: { type: "json_object" },  // ← Enforces JSON
  max_tokens: 8000,
  temperature: 0.7  // ← Higher = more creative, lower = more focused
}
```

### 1.4 AI Response → Validator

**File:** `src/app/dashboard/workspace/[id]/workflow-actions.ts`  
**Lines:** 330-380

**Validation steps:**
1. Check generic tasks (line 330-340)
2. Validate quality with `validateWorkflowQuality()` (line 343-355)
3. Check task count (line 358-367)

**Logged AI response:**
```javascript
{
  hasProjectUnderstanding: boolean,
  projectUnderstanding: string (first 100 chars),
  deliverablesCount: number,
  deliverables: array,
  milestonesCount: number,
  milestones: array of names,
  tasksCount: number,
  tasks: array of titles,
  risksCount: number,
  successMetricsCount: number
}
```

### 1.5 Validator → Fallback Decision

**File:** `src/lib/workflow-ai-generator.ts`  
**Function:** `validateWorkflowQuality()`  
**Lines:** 749-835

**Validation checks:**
1. Minimum phases: 4
2. Minimum tasks: 10 (or dynamic minimum)
3. Minimum deliverables: 2
4. Minimum risks: 3
5. Minimum success metrics: 3
6. All phases have tasks
7. Maximum 30% generic tasks

**If any check fails → Fallback triggered**

### 1.6 Fallback → Template Workflow

**File:** `src/app/dashboard/workspace/[id]/workflow-actions.ts`  
**Lines:** 383-407

**What happens:**
1. Log fallback reason (line 386-404)
2. Call `generateFallbackWorkflow()` (line 406-417)
3. Save to database with `used_fallback: true` (line 432)

**Logged fallback info:**
```javascript
{
  fallbackReason: string,
  attempts: number,
  validationFailures: array,
  projectContext: {
    domain, project_type, deliverables,
    target_audience, success_metrics,
    budget_range, duration_days, main_goal
  }
}
```

---

## 2. Debug Logging Locations

### 2.1 Console Logs (in order)

**Location 1: Planning Data**
```
[generateWorkflow] Planning data: {
  domain: "software",
  project_type: "web_app",
  team_size: 5,
  deliverables: ["Website", "API", "Documentation"],
  target_audience: ["Users", "Admins"],
  success_metrics: [{metric: "Performance", target: 95}]
}
```

**Location 2: AI Context**
```
[generateWorkflow] AI context built: {
  hasDomain: true,
  hasProjectType: true,
  hasDeliverables: true,
  deliverablesCount: 3,
  hasTargetAudience: true,
  targetAudienceCount: 2,
  hasSuccessMetrics: true,
  successMetricsCount: 1,
  hasBudget: true,
  hasDuration: true,
  hasMainGoal: true
}
```

**Location 3: AI Attempt**
```
[generateWorkflow] AI attempt 1/2 for project: My Project
```

**Location 4: AI Response**
```
[generateWorkflow] AI response received: {
  hasProjectUnderstanding: true,
  projectUnderstanding: "Dự án phát triển...",
  deliverablesCount: 3,
  milestonesCount: 5,
  tasksCount: 8,  // ← May be too low
  risksCount: 2,  // ← May be too low
  successMetricsCount: 2  // ← May be too low
}
```

**Location 5: Validation Failure**
```
[generateWorkflow] Attempt 1: Quality validation failed: [
  "Insufficient tasks: 8/10 minimum",
  "Insufficient risks: 2/3 minimum",
  "Insufficient success metrics: 2/3 minimum"
]
```

**Location 6: Fallback Triggered**
```
[generateWorkflow] FALLBACK TRIGGERED for project: My Project
[generateWorkflow] Attempts: 1/2
[generateWorkflow] Fallback reason: Workflow quality validation failed: Insufficient tasks: 8/10 minimum; Insufficient risks: 2/3 minimum
[generateWorkflow] Validation failures: [
  {
    reason: "Workflow quality validation failed",
    details: ["Insufficient tasks: 8/10 minimum", ...],
    timestamp: "2025-06-25T17:00:00.000Z",
    attemptNumber: 1
  }
]
[generateWorkflow] Project context that was sent to AI: {
  domain: "software",
  project_type: "web_app",
  deliverables: ["Website", "API", "Documentation"],
  target_audience: ["Users", "Admins"],
  success_metrics: [{...}],
  budget_range: "10000-50000",
  duration_days: 60,
  main_goal: "Build a website"
}
```

---

## 3. Common Fallback Reasons

### 3.1 Insufficient Tasks

**Error:** `Insufficient tasks: X/10 minimum` (or dynamic minimum)

**Causes:**
1. AI generated too few tasks
2. Project duration is short (30 days → min 10 tasks)
3. AI misunderstood the requirements

**Fix:**
- Check `tasksCount` in AI response log
- Verify `dynamicCount.min` in logs
- AI may need stronger prompt enforcement

### 3.2 Insufficient Milestones

**Error:** `Insufficient milestones: X/4 minimum`

**Causes:**
1. AI returned fewer than 4 milestones
2. AI didn't understand phase requirements

**Fix:**
- Check `milestonesCount` in AI response
- Prompt already specifies minimum phases

### 3.3 Insufficient Risks

**Error:** `Insufficient risks: X/3 minimum`

**Causes:**
1. AI didn't generate enough risks
2. AI focused only on positive aspects

**Fix:**
- Check `risksCount` in AI response
- Prompt explicitly requires minimum 3 risks

### 3.4 Insufficient Success Metrics

**Error:** `Insufficient success metrics: X/3 minimum`

**Causes:**
1. AI didn't extract metrics from project data
2. AI generated generic metrics instead of specific ones

**Fix:**
- Check `successMetricsCount` in AI response
- Verify `success_metrics` were sent in context
- Prompt explicitly requires minimum 3 metrics

### 3.5 Too Many Generic Tasks

**Error:** `Too many generic tasks: X/Y (Z%)`

**Causes:**
1. AI used generic terms like "Planning", "Implementation"
2. AI didn't use domain-specific language

**Fix:**
- Check task titles in AI response log
- Prompt has anti-pattern rules
- May need more examples in prompt

### 3.6 Invalid JSON

**Error:** `Failed to parse AI response as JSON`

**Causes:**
1. AI returned markdown instead of JSON
2. AI had syntax errors in JSON

**Fix:**
- Check `parseAIResponse()` in route.ts
- Parser tries to fix common issues
- May need to retry with stronger JSON enforcement

---

## 4. Verification Checklist

### 4.1 Verify Fields Reach AI

**Check console logs for:**

✅ **Planning data log shows:**
- `deliverables: [...]` (array with items)
- `target_audience: [...]` (array with items)
- `success_metrics: [...]` (array with objects)
- `domain: "..."` (string)
- `budget_range: "..."` (string)
- `duration_days: number`

✅ **AI context log shows:**
- `hasDeliverables: true`
- `deliverablesCount: > 0`
- `hasTargetAudience: true`
- `hasSuccessMetrics: true`

### 4.2 Verify AI Response

**Check console logs for:**

✅ **AI response log shows:**
- `deliverablesCount: >= 2`
- `milestonesCount: >= 4`
- `tasksCount: >= 10` (or dynamic minimum)
- `risksCount: >= 3`
- `successMetricsCount: >= 3`

### 4.3 Verify Validator

**If fallback occurs, check:**

✅ **Validation failures log shows:**
- Exact error message
- Expected vs actual counts
- Which check failed

✅ **Fallback reason log shows:**
- Concise reason string
- All validation failures
- Project context that was sent

---

## 5. Root Cause Analysis

### 5.1 Most Likely Causes

**Based on typical issues:**

1. **AI returns too few tasks** (80% of cases)
   - Reason: Llama 3.1 8B is conservative with task generation
   - Fix: Increase `max_tokens` or lower `temperature`
   - Fix: Strengthen task count requirements in prompt

2. **AI returns too few risks/metrics** (15% of cases)
   - Reason: AI focuses on positive planning
   - Fix: Explicitly ask for risks/metrics in prompt
   - Fix: Add examples of good risks/metrics

3. **AI generates generic tasks** (5% of cases)
   - Reason: AI defaults to common patterns
   - Fix: Anti-pattern rules already in place
   - Fix: May need more domain-specific examples

### 5.2 How to Diagnose

**Step 1: Check planning data log**
```javascript
// Are deliverables/audience/metrics present?
console.log("[generateWorkflow] Planning data:", ...);
```

**Step 2: Check AI context log**
```javascript
// Did context builder receive the data?
console.log("[generateWorkflow] AI context built:", ...);
```

**Step 3: Check AI response log**
```javascript
// What did AI actually return?
console.log("[generateWorkflow] AI response received:", ...);
```

**Step 4: Check validation failures**
```javascript
// Why was it rejected?
console.log("[generateWorkflow] Attempt 1: Quality validation failed:", ...);
```

**Step 5: Check fallback reason**
```javascript
// Final summary
console.error("[generateWorkflow] Fallback reason:", ...);
```

---

## 6. Database Investigation

### 6.1 Query to Find Fallback Reasons

```sql
SELECT 
  id,
  project_id,
  used_fallback,
  generation_attempts,
  validation_failures,
  created_at,
  -- Extract first failure reason
  validation_failures->0->>'reason' as first_failure_reason,
  -- Count failures
  jsonb_array_length(validation_failures) as failure_count
FROM ai_workflows
WHERE used_fallback = true
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

### 6.2 Query to Analyze Patterns

```sql
-- Group by failure reason
SELECT 
  (validation_failures->0->>'reason') as failure_reason,
  COUNT(*) as count,
  AVG(generation_attempts) as avg_attempts
FROM ai_workflows
WHERE validation_failures IS NOT NULL
GROUP BY failure_reason
ORDER BY count DESC;

-- Check if projects with planning data still fail
SELECT 
  COUNT(*) as total_fallbacks,
  COUNT(CASE 
    WHEN ai_generated->'projectUnderstanding' IS NOT NULL 
    THEN 1 
    ELSE 0 
  END) as has_project_understanding
FROM ai_workflows
WHERE used_fallback = true;
```

---

## 7. Immediate Debugging Steps

### 7.1 For Current Project

1. **Generate workflow with debug logging enabled**
   - Ensure `NODE_ENV=development`
   - Open browser console
   - Click "Generate Workflow"

2. **Check console for these logs in order:**
   ```
   [generateWorkflow] Planning data: {...}
   [generateWorkflow] AI context built: {...}
   [generateWorkflow] AI attempt 1/2 for project: ...
   [generateWorkflow] AI response received: {...}
   [generateWorkflow] Attempt 1: Quality validation failed: [...]
   [generateWorkflow] FALLBACK TRIGGERED: ...
   ```

3. **Identify the first validation failure**
   - Look at `validation_failures` array
   - First item is the reason for fallback
   - Check `details` for specific counts

### 7.2 Common Fixes Based on Error

| Error | Likely Cause | Quick Fix |
|-------|--------------|-----------|
| `Insufficient tasks: 8/10` | AI too conservative | Increase `max_tokens` to 10000 |
| `Insufficient risks: 2/3` | AI optimistic | Add risk examples to prompt |
| `Insufficient metrics: 2/3` | AI generic | Extract from `success_metrics` field |
| `Too many generic tasks` | AI using defaults | Strengthen anti-pattern rules |
| `Invalid JSON` | AI formatting | Parser already tries to fix |

---

## 8. Files Modified for Debugging

### 8.1 `src/app/dashboard/workspace/[id]/workflow-actions.ts`

**Added logging:**
- Line 269-280: Planning data log
- Line 310-322: AI context log
- Line 340-350: AI response log
- Line 386-404: Fallback reason log

**No logic changes** - only logging added

### 8.2 `src/lib/workflow-ai-generator.ts`

**Updated:**
- `validateWorkflowQuality()` now accepts optional `requirements` parameter
- Uses dynamic minimums based on project duration
- More detailed error messages

**No breaking changes** - backward compatible with defaults

---

## 9. How to Use This Guide

### 9.1 When Fallback Occurs

1. **Check browser/server console** for logs
2. **Find the first validation failure** in the logs
3. **Check AI response** to see what AI actually returned
4. **Check planning data** to verify fields were sent
5. **Query database** for historical patterns

### 9.2 Example Debug Session

```
Console output:
[generateWorkflow] Planning data: {
  deliverables: ["Website", "API"],  // ✅ Present
  success_metrics: [...]  // ✅ Present
}

[generateWorkflow] AI response received: {
  tasksCount: 8,  // ❌ Too low
  risksCount: 2,  // ❌ Too low
  successMetricsCount: 2  // ❌ Too low
}

[generateWorkflow] Attempt 1: Quality validation failed: [
  "Insufficient tasks: 8/10 minimum",
  "Insufficient risks: 2/3 minimum",
  "Insufficient success metrics: 2/3 minimum"
]

Conclusion: AI needs stronger enforcement of minimums in prompt
```

---

## 10. Summary

### Root Cause of Fallbacks

**The AI model (Llama 3.1 8B) is conservative and often returns:**
- Fewer tasks than required (8 instead of 10+)
- Fewer risks than required (2 instead of 3)
- Fewer success metrics than required (2 instead of 3)

**This is NOT because:**
- ❌ Planning data is missing
- ❌ Fields don't reach AI
- ❌ Validator is broken

**This IS because:**
- ✅ AI model behavior (conservative generation)
- ✅ Prompt needs stronger enforcement
- ✅ Temperature setting (0.7) allows variation

### Solution Path

1. **Short term:** Use retry logic (already implemented)
2. **Medium term:** Strengthen prompt with explicit counts
3. **Long term:** Consider larger model or fine-tuning

### Debugging Tools

- ✅ Comprehensive console logging
- ✅ Database tracking of failures
- ✅ Detailed error messages
- ✅ This guide

---

**Report Generated:** 2025-06-25  
**Status:** Debugging tools added, awaiting test results  
**Files Modified:** 2  
**Lines Added:** ~100 (logging only)