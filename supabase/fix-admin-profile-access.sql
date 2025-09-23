-- 修复管理员无法查看所有用户档案的问题
-- Fix admin unable to view all user profiles issue

-- 添加管理员可以查看所有档案的策略
-- Add policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 添加管理员可以更新所有档案的策略（用于角色管理）
-- Add policy for admins to update all profiles (for role management)
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );