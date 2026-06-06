# RLS Fix Quick Reference

## Problem in One Sentence
Your RLS policy checks `auth.uid() = owner_id`, but `owner_id` doesn't exist in your database, so all project inserts are blocked.

---

## The Fix (5 minutes)

### 1. Copy SQL
Open: `supabase/RLS_POLICIES.sql` (in this repo)

### 2. Apply SQL
- Go to [Supabase Dashboard](https://supabase.com/dashboard)
- Select your project
- Click **SQL Editor** → **New Query**
- Paste entire file
- Click **Run**

### 3. Done ✓
All RLS policies now correctly configured

---

## What Was Wrong

| Item | Expected | Actual | Result |
|------|----------|--------|--------|
| Policy | `auth.uid() = owner_id` | `owner_id = NULL` | ❌ INSERT blocked |
| Ownership | owner_id column | project_members table | Schema mismatch |
| Member policies | Should exist | Don't exist | ⚠️ Missing security |
| Tasks policies | Should exist | Don't exist | ⚠️ Missing security |
| Activities policies | Should exist | Don't exist | ⚠️ Security risk |

---

## What Gets Fixed

### Projects Table
- ✅ INSERT - Allow any authenticated user
- ✅ UPDATE - Require project_members leader role
- ✅ DELETE - Require project_members leader role

### Project_Members Table
- ✅ SELECT - All authenticated users
- ✅ INSERT - Self or project leader
- ✅ UPDATE - Self or project leader  
- ✅ DELETE - Self or project leader

### Tasks Table (if exists)
- ✅ SELECT - Project members only
- ✅ INSERT - Project members only
- ✅ UPDATE - Assignee or leader
- ✅ DELETE - Leader only

### Activities Table (if exists)
- ✅ SELECT - Project members only
- ✅ INSERT - Service role only (secure)

---

## What Doesn't Need Changing

✓ No code changes needed in app
✓ No database migrations needed
✓ No ENV vars to update
✓ No server restart needed

---

## Test After Fix

```
1. /dashboard/workspace/new
2. Create "Test Project"
3. Should redirect to /dashboard/workspace/[id]
4. Should appear in workspace list
```

---

## Affected Operations

### Before Fix ❌
- Project creation: **BLOCKED**
- Proposal approval: **BLOCKED**
- Team management: **BLOCKED**

### After Fix ✓
- Project creation: **WORKS**
- Proposal approval: **WORKS**
- Team management: **SECURE**

---

## Files Generated

| File | Purpose |
|------|---------|
| `supabase/RLS_POLICIES.sql` | ← **RUN THIS** |
| `RLS_ISSUE_SUMMARY.md` | Executive summary |
| `RLS_AUDIT_REPORT.md` | Detailed audit |
| `RLS_INVESTIGATION_REPORT.md` | Full investigation |
| `RLS_IMPLEMENTATION_GUIDE.md` | Step-by-step guide |

---

## Verification SQL (Optional)

After running the fix, verify policies exist:

```sql
-- Should return 4 policies for projects
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename = 'projects' 
ORDER BY policyname;

-- Should return 4 policies for project_members  
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename = 'project_members' 
ORDER BY policyname;
```

---

## Error Message Before Fix

```
new row violates row-level security policy for table "projects"
```

## Error Message After Fix

```
✓ Success - Project created
```

---

## Emergency Contact

**Still blocked after fix?**

1. Check SQL Editor for error messages
2. Verify `ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;` ran
3. Verify `project_members` table exists
4. Check browser console for auth.uid() value
5. Ensure you're authenticated before testing

---

**Status:** ✅ Ready to implement  
**Time Required:** 5 minutes  
**Risk Level:** Low (RLS policies, no data changes)
