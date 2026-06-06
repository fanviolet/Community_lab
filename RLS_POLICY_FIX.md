# Supabase RLS Policy Fix

## Problem Analysis

**Error:** `new row violates row-level security policy for table "projects"`

**Root Cause:**
The RLS policy in SUPABASE_SETUP.md checks:
```sql
create policy "Users can create projects"
  on public.projects for insert to authenticated with check (auth.uid() = owner_id);
```

However, the application does NOT insert `owner_id` (column doesn't exist in actual database). This means:
- `owner_id` is NULL
- `auth.uid() = NULL` evaluates to FALSE
- RLS policy blocks the INSERT

**Additional Issues:**
1. `project_members`, `tasks`, and `activities` tables have NO RLS policies defined
2. Ownership model uses `project_members` table with `role='leader'`, not `owner_id` column
3. Policies must be rewritten to support the actual schema

## Schema Being Used

### tables.projects
- id, proposal_id, title, description, status, created_at, updated_at
- **No** owner_id column (real database)

### tables.project_members
- project_id, user_id, role, name, avatar_url, created_at
- Tracks ownership via role='leader'

### tables.tasks (assumed to exist)
- id, project_id, title, description, assigned_to, status, created_at, updated_at
- Assumed to exist based on application context

### tables.activities
- id, project_id, user_id(?), description, activity_type(?), created_at
- Tracks project activity log

## Required RLS Policies

All policies follow secure pattern:
- **SELECT:** Authenticated users can view all projects (collaboration model)
- **INSERT:** Users can create projects (no owner check needed for insert)
- **UPDATE:** Only project members with appropriate role can update
- **DELETE:** Only project leaders can delete

### Implementation Strategy

1. **projects table** - Allow insert without owner check, verify membership for UPDATE
2. **project_members** - Users can only add themselves OR leaders can add team members
3. **tasks** - Members of project can create/update tasks  
4. **activities** - System inserts activities (one-time setup)

## SQL Policies to Apply

See `RLS_POLICIES.sql` for complete implementation.
