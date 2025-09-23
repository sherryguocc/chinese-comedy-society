-- Comprehensive RLS diagnostic and fix
-- 全面的RLS诊断和修复

-- First, let's check what auth.uid() returns
SELECT auth.uid() as current_user_id;

-- Check if the profiles table is accessible
SELECT id, role, email FROM profiles WHERE id = auth.uid();

-- Temporarily create a very permissive policy to test
DROP POLICY IF EXISTS "Members can create posts" ON posts;

-- Create a temporary test policy that's very permissive
CREATE POLICY "Temp allow all authenticated users" ON posts
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- If the above works, then gradually make it more restrictive
-- Step 1: Check if we can access the author_id
-- CREATE POLICY "Members can create posts" ON posts
--   FOR INSERT 
--   WITH CHECK (
--     auth.uid() IS NOT NULL 
--     AND author_id = auth.uid()
--   );

-- Step 2: Add the profiles check back
-- CREATE POLICY "Members can create posts" ON posts
--   FOR INSERT 
--   WITH CHECK (
--     auth.uid() IS NOT NULL 
--     AND author_id = auth.uid()
--     AND EXISTS (
--       SELECT 1 FROM profiles 
--       WHERE profiles.id = auth.uid() 
--       AND profiles.role IN ('member', 'admin')
--     )
--   );