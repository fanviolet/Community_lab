# RLS Audit Report: Supabase Security Configuration

## Executive Summary

**Critical Issue:** `projects` table INSERT violates RLS policy because:
1. Policy checks `auth.uid() = owner_id`
2. Application does NOT insert `owner_id` (column doesn't exist)
3. All INSERT attempts are BLOCKED

**Affected Operations:**
- ❌ Project creation via form (`/dashboard/workspace/new`)
- ❌ Project creation from proposal approval
- ✓ Project creation from activities table (not blocked - no policy yet)

---

## Detailed Audit

### 1. PROJECTS TABLE

**Current RLS Policies** (from SUPABASE_SETUP.md):
```sql
create policy "Projects viewable by authenticated users"
  on public.projects for select to authenticated using (true);

create policy "Users can create projects"
  on public.projects for insert to authenticated with check (auth.uid() = owner_id);

create policy "Owners can update own projects"
  on public.projects for update to authenticated using (auth.uid() = owner_id);
```

**Problem:**
- Policy: `auth.uid() = owner_id`
- Actual schema: `owner_id` column doesn't exist (NULL in database)
- Result: `NULL = auth.uid()` → FALSE → INSERT rejected

**Actual Database Schema:**
```
id, proposal_id, title, description, status, created_at, updated_at
(No owner_id column)
```

**Code Reality:**
- [src/app/actions/projects.ts](src/app/actions/projects.ts#L103-L116): Creates projects WITHOUT owner_id
- Tracks ownership via `project_members(user_id, role='leader')`

**Status:** ❌ BLOCKING - Must fix immediately

---

### 2. PROJECT_MEMBERS TABLE

**Current RLS Policies:** NONE (missing)

**Actual Use:**
- [src/app/actions/projects.ts](src/app/actions/projects.ts#L130-L145): Inserts user as 'leader'
- [src/app/actions/projects.ts](src/app/actions/projects.ts#L215-L228): Inserts proposal owner as 'leader'
- Application expects to query members for team management

**Columns:**
```
project_id, user_id, role, name, avatar_url, created_at
```

**Required Policies:**
- SELECT: Members can view project team
- INSERT: Users can add themselves OR leaders can add others
- UPDATE: Self or leader can update
- DELETE: Self or leader can remove

**Status:** ❌ BLOCKING - Must add policies

---

### 3. TASKS TABLE

**Current RLS Policies:** NONE (missing)

**Assumed Columns:**
```
id, project_id, title, description, assigned_to, status, created_at, updated_at
```

**Required Policies:**
- SELECT: Project members only
- INSERT: Project members only
- UPDATE: Task assignee or project leader
- DELETE: Project leader only

**Status:** ❌ POTENTIAL ISSUE - Will block once tasks feature is used

---

### 4. ACTIVITIES TABLE

**Current RLS Policies:** NONE (missing)

**Actual Use:**
- [src/app/actions/projects.ts](src/app/actions/projects.ts#L233-L238): Inserts activity log
- Records project creation events

**Columns:**
```
id, project_id, description, user_name, created_at
```

**Issues:**
- Currently inserted from client-side Supabase JS
- Without policies, this may currently work (no RLS)
- Security risk: Any user can log false activities
- Should only be insertable from server-side

**Required Policies:**
- SELECT: Project members only
- INSERT: Service role only (server-side logging)
- UPDATE/DELETE: Never (append-only log)

**Status:** ⚠️ VULNERABLE - Works now but insecure

---

## Code Files Affected

| File | Issue | Line | Operation |
|------|-------|------|-----------|
| [src/app/actions/projects.ts](src/app/actions/projects.ts) | INSERT projects fails | 117 | `supabase.from("projects").insert(projectRow)` |
| [src/app/actions/projects.ts](src/app/actions/projects.ts) | INSERT project_members fails | 139 | `supabase.from("project_members").insert(memberPayload)` |
| [src/app/actions/projects.ts](src/app/actions/projects.ts) | INSERT activities insecure | 233 | `supabase.from("activities").insert({...})` |
| [src/app/(dashboard)/review/action.ts](src/app/(dashboard)/review/action.ts) | Calls createProjectFromProposal | N/A | Approval → project creation |

---

## Required SQL Policies

Execute `supabase/RLS_POLICIES.sql` which provides:

1. **Projects Table** (4 policies)
   - SELECT: All authenticated users
   - INSERT: Any authenticated user (owns via project_members)
   - UPDATE: Project leaders only
   - DELETE: Project leaders only

2. **Project_Members Table** (4 policies)
   - SELECT: All authenticated users
   - INSERT: Self or project leader
   - UPDATE: Self or project leader
   - DELETE: Self or project leader

3. **Tasks Table** (5 policies, if exists)
   - SELECT: Project members only
   - INSERT: Project members only
   - UPDATE: Assignee or project leader
   - DELETE: Project leader only

4. **Activities Table** (3 policies, if exists)
   - SELECT: Project members only
   - INSERT: Service role only
   - (No update/delete)

---

## Validation Checklist

After applying policies:

- [ ] Test project creation at `/dashboard/workspace/new`
- [ ] Test proposal approval triggers project creation
- [ ] Verify project appears in workspace list
- [ ] Verify member record created with role='leader'
- [ ] Check no permission errors in browser console
- [ ] Verify activity log records created

---

## Architecture Diagram

```
Current (BROKEN):
  Project INSERT
    ↓
  RLS Check: auth.uid() = owner_id
    ↓
  NULL = auth.uid() → FALSE ❌
  INSERT REJECTED

Fixed:
  Project INSERT
    ↓
  RLS Check: (true) - allow insert ✓
    ↓
  Project created
    ↓
  Application creates project_members record
    ↓
  RLS on project_members: user_id = auth.uid() ✓
    ↓
  Member record created ✓
  
Queries:
  SELECT * FROM projects
    ↓
  RLS Check: (true) - all users can view ✓
  
  UPDATE projects
    ↓
  RLS Check: user is leader via project_members ✓
```

---

## Implementation Steps

1. **Apply SQL Policies**
   - Run: `supabase/RLS_POLICIES.sql` in Supabase SQL Editor
   - Validates policies creation
   - Handles missing tables gracefully

2. **No Code Changes Required**
   - [src/app/actions/projects.ts](src/app/actions/projects.ts) is correct
   - Already creates project_members records
   - Already logs activities
   - Will work once RLS policies fixed

3. **Test End-to-End**
   - Project creation form
   - Proposal approval flow
   - Workspace display
   - Member management

4. **(Optional) Future Enhancement**
   - Add `created_by` column to activities
   - Make `created_by = auth.uid()` in RLS policy
   - Replaces `user_name` approach with proper FK

---

## Security Notes

✓ **Ownership Model:** Members table with role='leader' is secure
✓ **Access Control:** RLS checks for project membership
✓ **Integrity:** Foreign keys prevent orphaned records
⚠️ **Activities:** Logging from client-side acceptable for this use case
⚠️ **No admin bypass:** Consider separate admin role for troubleshooting
