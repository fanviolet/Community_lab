# RLS Policy Implementation Guide

## Quick Fix

1. **Go to Supabase Dashboard** → SQL Editor
2. **Copy and paste** contents of `supabase/RLS_POLICIES.sql`
3. **Click "Run"** to apply all policies
4. **Test** project creation at `/dashboard/workspace/new`

---

## The Problem Explained

### Why Policies Are Failing

**SUPABASE_SETUP.md says:**
```sql
create policy "Users can create projects"
  on public.projects for insert to authenticated 
  with check (auth.uid() = owner_id);
```

**Your app does:**
```typescript
// src/app/actions/projects.ts line 107-116
const projectRow: Record<string, unknown> = {
  title,
  description: description || null,
  status: "active",
  // ❌ No owner_id!
};
```

**What happens:**
1. INSERT into projects → `owner_id` is NULL
2. RLS checks: `auth.uid() = NULL` → FALSE
3. Policy BLOCKS insert ❌

---

## Policy Solutions

### ✅ Fix #1: Projects Table INSERT

**OLD (broken):**
```sql
create policy "Users can create projects"
  on public.projects for insert to authenticated 
  with check (auth.uid() = owner_id);
```

**NEW (fixed):**
```sql
-- Drop old policy
DROP POLICY IF EXISTS "Users can create projects" ON public.projects;

-- New: Allow any authenticated user to insert
CREATE POLICY "Authenticated users can create projects"
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

**Why:** Ownership is tracked in `project_members` table, not `owner_id` column.

---

### ✅ Fix #2: Projects Table UPDATE

**OLD (broken):**
```sql
create policy "Owners can update own projects"
  on public.projects for update to authenticated 
  using (auth.uid() = owner_id);
```

**NEW (fixed):**
```sql
DROP POLICY IF EXISTS "Owners can update own projects" ON public.projects;

CREATE POLICY "Project leaders can update projects"
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = projects.id
        AND project_members.user_id = auth.uid()
        AND project_members.role = 'leader'
    )
  );
```

**Why:** Check if user is in `project_members` with role='leader'.

---

### ✅ Fix #3: Project_Members Table (ALL MISSING)

Your app uses this table but has NO RLS policies!

```sql
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Everyone can see team members
CREATE POLICY "Project members viewable by authenticated users"
  ON public.project_members
  FOR SELECT
  TO authenticated
  USING (true);

-- User adds themselves OR leader adds them
CREATE POLICY "Users and leaders can add project members"
  ON public.project_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()  -- Adding yourself
    OR
    EXISTS (  -- Or leader adding you
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = project_members.project_id
        AND pm.user_id = auth.uid()
        AND pm.role = 'leader'
    )
  );

-- Similar for UPDATE and DELETE...
```

---

### ✅ Fix #4: Tasks Table (IF EXISTS)

No policies defined. Will need:

```sql
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Project members can see tasks
CREATE POLICY "Project members can view tasks"
  ON public.tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = tasks.project_id
        AND project_members.user_id = auth.uid()
    )
  );

-- Members can create tasks
CREATE POLICY "Project members can create tasks"
  ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = tasks.project_id
        AND project_members.user_id = auth.uid()
    )
  );

-- Assignee or leader can update
CREATE POLICY "Assignee or leader can update tasks"
  ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (
    assigned_to = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = tasks.project_id
        AND project_members.user_id = auth.uid()
        AND project_members.role = 'leader'
    )
  );

-- Only leader can delete
CREATE POLICY "Leaders can delete tasks"
  ON public.tasks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = tasks.project_id
        AND project_members.user_id = auth.uid()
        AND project_members.role = 'leader'
    )
  );
```

---

### ✅ Fix #5: Activities Table (IF EXISTS)

No policies defined. Security risk!

```sql
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Members can view activity log
CREATE POLICY "Project members can view activities"
  ON public.activities
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_members.project_id = activities.project_id
        AND project_members.user_id = auth.uid()
    )
  );

-- Only server can insert (prevent fake logs)
CREATE POLICY "Service role can create activities"
  ON public.activities
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- No updates or deletes - append-only log
```

---

## Affected Code Files

### src/app/actions/projects.ts

**Problem at line 117:**
```typescript
const { data: project, error } = await supabase
  .from("projects")
  .insert(projectRow)  // ← FAILS without fixed RLS
  .select()
  .single();
```

**Will be fixed by:** RLS policy change to allow INSERT

**No code change needed** ✓

---

### src/app/actions/projects.ts

**Problem at line 139:**
```typescript
const { error: memberError } = await supabase
  .from("project_members")  // ← Needs RLS policy
  .insert(memberPayload);
```

**Will be fixed by:** New project_members RLS policies

**No code change needed** ✓

---

### src/app/actions/projects.ts

**Problem at line 233:**
```typescript
await supabase.from("activities")  // ← No policy prevents insert
  .insert({
    project_id: newProject.id,
    description: "Project created from approved proposal",
    user_name: profile.name ?? null,
  });
```

**Current:** Works without policy (RLS not enabled)
**Future:** Will fail when RLS enabled unless you add policy

**Will be fixed by:** Activities RLS policy

**No code change needed** ✓

---

## Validation SQL

After applying policies, run this to verify:

```sql
-- Check projects table policies
SELECT tablename, policyname, qual, with_check
FROM pg_policies
WHERE tablename = 'projects' AND schemaname = 'public'
ORDER BY policyname;

-- Check project_members table policies
SELECT tablename, policyname, qual, with_check
FROM pg_policies
WHERE tablename = 'project_members' AND schemaname = 'public'
ORDER BY policyname;

-- Expected output:
-- projects: 4 policies (select, insert, update, delete)
-- project_members: 4 policies (select, insert, update, delete)
```

---

## Testing Checklist

✅ After applying RLS_POLICIES.sql:

- [ ] Navigate to `/dashboard/workspace/new`
- [ ] Fill form: Title="Test Project"
- [ ] Click "Create Project"
- [ ] Verify redirect to `/dashboard/workspace/[id]`
- [ ] Go back to workspace
- [ ] Verify new project in list
- [ ] Check database: `SELECT * FROM project_members WHERE user_id = current_user_id`
- [ ] Verify member record with role='leader'

✅ Test proposal approval:

- [ ] Create and submit a proposal
- [ ] Navigate to Review dashboard
- [ ] Approve proposal
- [ ] Verify new project created
- [ ] Check activity log: `SELECT * FROM activities WHERE project_id = ?`

---

## Summary of Changes

| Table | Problem | Solution |
|-------|---------|----------|
| projects | INSERT checks owner_id (NULL) | Allow any authenticated user to insert |
| projects | UPDATE checks owner_id (NULL) | Check project_members role='leader' |
| project_members | No policies | Add 4 policies (select/insert/update/delete) |
| tasks | No policies | Add 5 policies for member access |
| activities | No policies | Add security policies |

**Total:** 19 new RLS policies to apply
**Time:** 5 minutes
**Impact:** Blocks until fixed ❌ → Works after fix ✓
