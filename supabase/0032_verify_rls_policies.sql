-- Verification queries for RLS policies on pitches table
-- Run these after applying migration 0031_fix_pitches_rls_policies.sql

-- 1. List ALL policies on the pitches table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'pitches'
ORDER BY cmd, policyname;

-- 2. Verify SELECT policies specifically
SELECT 
  policyname,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'pitches'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- 3. Verify UPDATE policies specifically
SELECT 
  policyname,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'pitches'
  AND cmd = 'UPDATE'
ORDER BY policyname;

-- 4. Check for duplicate UPDATE policies (should only have 2 after migration)
SELECT 
  cmd,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'pitches'
  AND cmd = 'UPDATE'
GROUP BY cmd;
