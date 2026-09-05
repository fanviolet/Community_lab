-- Migration: Add RPC for creating group with leader
-- This ensures proper auth context and atomic leader assignment

CREATE OR REPLACE FUNCTION public.create_group_with_leader(
  p_name text,
  p_slug text,
  p_description text DEFAULT NULL,
  p_is_public boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Create the group with created_by set to authenticated user
  INSERT INTO public.groups (name, slug, description, is_public, created_by)
  VALUES (p_name, p_slug, p_description, p_is_public, auth.uid())
  RETURNING id INTO v_group_id;

  -- The trigger handle_new_group() will automatically add the creator as leader
  -- But we verify it here to ensure atomicity
  IF NOT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = v_group_id
      AND user_id = auth.uid()
      AND role = 'leader'
  ) THEN
    -- If trigger failed, add manually
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (v_group_id, auth.uid(), 'leader');
  END IF;

  RETURN v_group_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_group_with_leader(text, text, text, boolean) TO authenticated;
