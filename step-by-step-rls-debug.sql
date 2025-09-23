-- Step-by-step RLS debugging
-- 逐步RLS调试

-- Step 1: Drop existing policy
DROP POLICY IF EXISTS "Members can create posts" ON posts;
DROP POLICY IF EXISTS "Temp allow all authenticated users" ON posts;

-- Step 2: Create the most basic policy (just check auth.uid() exists)
CREATE POLICY "Test basic auth" ON posts
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- If this works, run the test, then replace with Step 3:
-- DROP POLICY IF EXISTS "Test basic auth" ON posts;
-- CREATE POLICY "Test auth and author match" ON posts
--   FOR INSERT 
--   WITH CHECK (
--     auth.uid() IS NOT NULL 
--     AND author_id = auth.uid()
--   );

-- If that works, then run Step 4:
-- DROP POLICY IF EXISTS "Test auth and author match" ON posts;
-- CREATE POLICY "Test with profile check" ON posts
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