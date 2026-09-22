-- Migration: Add status column to groups table for archiving functionality
-- This allows groups to be archived similar to projects

-- Add status column to groups table
ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active'
  CHECK (status IN ('active', 'archived'));

-- Create index for faster queries on archived groups
CREATE INDEX IF NOT EXISTS idx_groups_status ON public.groups(status);

-- Update existing groups to have 'active' status
UPDATE public.groups
SET status = 'active'
WHERE status IS NULL;

-- Update RLS policies to handle archived groups
-- Archived groups should only be visible to admins and group members

DROP POLICY IF EXISTS "Groups discoverable by authenticated users" ON public.groups;

CREATE POLICY "Groups discoverable by authenticated users"
  ON public.groups
  FOR SELECT
  TO authenticated
  USING (
    public.can_discover_group(id)
    AND status = 'active'
  );

-- Add policy for admins to see archived groups
CREATE POLICY "Admins can view archived groups"
  ON public.groups
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    AND status = 'archived'
  );

-- Group members can still view their archived groups
CREATE POLICY "Group members can view archived groups"
  ON public.groups
  FOR SELECT
  TO authenticated
  USING (
    public.is_group_member(id)
    AND status = 'archived'
  );

-- Add RPC function to archive a group
CREATE OR REPLACE FUNCTION public.archive_group(p_group_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT (public.is_admin() OR public.is_group_leader(p_group_id)) THEN
    RAISE EXCEPTION 'Not authorized to archive this group';
  END IF;

  UPDATE public.groups
  SET status = 'archived',
      updated_at = now()
  WHERE id = p_group_id;
END;
$$;

-- Add RPC function to restore a group
CREATE OR REPLACE FUNCTION public.restore_group(p_group_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT (public.is_admin() OR public.is_group_leader(p_group_id)) THEN
    RAISE EXCEPTION 'Not authorized to restore this group';
  END IF;

  UPDATE public.groups
  SET status = 'active',
      updated_at = now()
  WHERE id = p_group_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.archive_group(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_group(uuid) TO authenticated;

-- Add comment to document the new functionality
COMMENT ON COLUMN public.groups.status IS 'Group status: active or archived. Archived groups are hidden from discovery but remain accessible to members.';
