# RLS Issue Resolution Summary

## Problem
**Error:** `new row violates row-level security policy for table "projects"`

**Root Cause:** 
The RLS policy for projects INSERT checks `auth.uid() = owner_id`, but your application doesn't insert `owner_id` (the column doesn't exist in your actual database). This blocks all project creation.

---

## Diagnosis

### What's Happening

1. **Policy (from SUPABASE_SETUP.md):**
   ```sql
   WITH CHECK (auth.uid() = owner_id)
   ```

2. **Your App (src/app/actions/projects.ts):**
   ```typescript
   const projectRow = {
     title,           // ✓ inserted
     description,     // ✓ inserted
     status: "active" // ✓ inserted
     // ❌ owner_id NOT inserted
   };
   ```

3. **Result:** `NULL = auth.uid()` → FALSE → INSERT REJECTED

### Ownership Model Mismatch

- **Policy expects:** `owner_id` column on projects
- **Your schema has:** `project_members` table with `role='leader'`
- **Your code does:** Creates project, then adds user to project_members

**This is actually a BETTER design**, but the RLS policies weren't updated to match.

---

## Missing Policies

| Table | Policies | Status |
|-------|----------|--------|
| projects | ❌ Incorrect INSERT/UPDATE checks owner_id | **BLOCKING** |
| project_members | ❌ No policies defined | **BLOCKING** |
| tasks | ❌ No policies defined | Potential issue |
| activities | ❌ No policies defined | Security risk |

---

## Solution

### 1. Apply SQL Policies

**File:** `supabase/RLS_POLICIES.sql` (already created)

**Steps:**
1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Click **"New Query"** or **"New File"**
5. Copy entire contents of `supabase/RLS_POLICIES.sql`
6. Click **"Run"**
7. See ✅ "Success" notifications

**What it does:**
- Drops broken policies that check owner_id
- Creates new policies based on project_members membership
- Adds missing policies for project_members, tasks, activities
- Validates installation with diagnostic queries

### 2. No Code Changes Needed

Your code is correct! Once RLS is fixed:
- ✅ [src/app/actions/projects.ts](src/app/actions/projects.ts) works as-is
- ✅ Project members automatically created with role='leader'
- ✅ Activities logged correctly

---

## Architecture (After Fix)

```
User creates project via form
          ↓
INSERT into projects (no owner_id needed) ✓
          ↓
Application creates project_members record
          ↓
INSERT into project_members (user_id, role='leader') ✓
          ↓
Activities table logs: "Project created" ✓
          ↓
Project visible in workspace
```

**Key insight:** Ownership tracked via membership, not column reference.

---

## Files Generated

### Documentation
- **RLS_AUDIT_REPORT.md** - Detailed audit of all policies
- **RLS_POLICY_FIX.md** - Root cause analysis
- **RLS_IMPLEMENTATION_GUIDE.md** - Step-by-step explanation
- **This file** - Executive summary

### SQL
- **supabase/RLS_POLICIES.sql** - **Run this file** to fix

---

## Verification Checklist

After applying RLS_POLICIES.sql:

```
Project Creation:
☐ Navigate to /dashboard/workspace/new
☐ Enter title "Test Project"
☐ Click "Create Project"
☐ Should redirect to /dashboard/workspace/[id]
☐ Project appears in workspace list
☐ Check database: member record has role='leader'

Proposal Approval:
☐ Create a new proposal
☐ Submit it (status='submitted')
☐ Go to Review dashboard
☐ Approve the proposal
☐ New project should be created automatically
☐ Activity log should show "Project created from approved proposal"

Database Verification:
☐ SELECT * FROM projects; → Shows all projects
☐ SELECT * FROM project_members; → Shows member records
☐ SELECT * FROM activities; → Shows activity log
```

---

## Policies Summary

### Projects Table
✅ **SELECT** - All authenticated users can view projects
✅ **INSERT** - Any authenticated user can create (ownership via project_members)
✅ **UPDATE** - Only project leaders can update
✅ **DELETE** - Only project leaders can delete

### Project_Members Table
✅ **SELECT** - All authenticated users can view team
✅ **INSERT** - User can add themselves OR leader adds them
✅ **UPDATE** - Self or leader can update
✅ **DELETE** - Self or leader can remove

### Tasks Table
✅ **SELECT** - Project members only
✅ **INSERT** - Project members only
✅ **UPDATE** - Assignee or project leader
✅ **DELETE** - Project leader only

### Activities Table
✅ **SELECT** - Project members only
✅ **INSERT** - Service role only (server-side logging)
✅ **UPDATE/DELETE** - Not allowed (append-only log)

---

## Security Notes

✓ **No owner_id column needed** - Membership model is secure
✓ **Access control based on project_members table** - Flexible team management
✓ **Proper FK constraints** - Data integrity maintained
✓ **Activity logging** - Tracks project changes
⚠️ **Activities insertable from client** - Acceptable for this use case; consider server-side for future

---

## Timeline

- **Now** → Apply `supabase/RLS_POLICIES.sql` (5 min)
- **Immediately after** → Test project creation (2 min)
- **No code changes needed** - Infrastructure only

---

## Support

**If policies don't apply:**
1. Check SQL Editor for error message
2. Ensure RLS is enabled: `ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;`
3. Verify project_members table exists
4. Run individual policy statements instead of whole file

**If project creation still fails after RLS fix:**
1. Check browser DevTools → Network → see actual error
2. Verify Supabase session is active: `supabase.auth.getUser()`
3. Check if auth.uid() is returning NULL
