-- Fix RLS policy for posts insert
-- 修复文章插入的RLS策略

-- Drop existing insert policy
DROP POLICY IF EXISTS "Members can create posts" ON posts;

-- Create a more specific insert policy
CREATE POLICY "Members can create posts" ON posts
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('member', 'admin')
    )
  );

-- Also ensure users can update their own posts
DROP POLICY IF EXISTS "Authors can update own posts" ON posts;
CREATE POLICY "Authors can update own posts" ON posts
  FOR UPDATE 
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Allow authors to delete their own posts
DROP POLICY IF EXISTS "Authors can delete own posts" ON posts;
CREATE POLICY "Authors can delete own posts" ON posts
  FOR DELETE 
  USING (
    author_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );