# Project Schema Migration Guide

## Current Status

The application currently works without the `owner_id` column in the `projects` table. Project ownership is tracked through the `project_members` table with the `leader` role.

## Required Columns (Minimum)

The `projects` table MUST have these columns:

```sql
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES public.proposals (id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  created_at timestamptz DEFAULT now() NOT NULL
);
```

## Optional: owner_id Column

To add explicit owner tracking, run this migration:

```sql
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES public.profiles (id) ON DELETE CASCADE;
```

## Application Workaround

Since the application does not currently require `owner_id`:

1. **Project Creation**: Users are automatically added as `leader` in `project_members` table
2. **Ownership**: Determine owner by querying `project_members` where `role = 'leader'`
3. **RLS Policies**: Can be updated later when `owner_id` is added

## Minimal Setup for Production

1. Ensure `project_members` table exists with:
   - `project_id` (FK to projects)
   - `user_id` (FK to auth.users or profiles)
   - `role` (text, e.g., 'leader', 'member')

2. Run workspace page - it will query:
   - `projects (id, title, description, status, created_at)`
   - `tasks (count)` - filtered by project_id
   - `project_members (count)` - filtered by project_id

3. Optional: Add `owner_id` column later via migration `0001_add_owner_id_to_projects.sql`

## Testing Checklist

- [ ] Create a new project via `/dashboard/workspace/new`
- [ ] Verify project appears in workspace list
- [ ] Check that user is added as `leader` in `project_members`
- [ ] Navigate to project detail page
- [ ] Create tasks within the project
- [ ] Archive a completed project

## Future: Full Schema with owner_id

If you decide to add `owner_id`:

1. Run: `supabase/0001_add_owner_id_to_projects.sql`
2. Backfill existing projects from `project_members` leader role
3. Update RLS policies to use `owner_id` instead of lookup
4. Update code to insert `owner_id` on project creation
