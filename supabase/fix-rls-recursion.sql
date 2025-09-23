-- 修复RLS策略无限递归问题
-- Fix RLS policy infinite recursion issue

-- 首先删除可能导致递归的策略
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- 方法1: 使用安全定义者函数来避免递归
-- Method 1: Use security definer function to avoid recursion

-- 创建一个安全定义者函数来检查管理员权限
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- 直接查询auth.users的raw_user_meta_data或使用其他方法
  -- 避免查询profiles表造成递归
  RETURN auth.jwt() ->> 'role' = 'admin' OR 
         (SELECT raw_user_meta_data ->> 'role' FROM auth.users WHERE id = auth.uid()) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 或者方法2: 使用更简单的策略，允许管理员查看所有档案但避免递归
-- Method 2: Use simpler policy that allows admin to view all profiles but avoids recursion

-- 创建一个允许管理员查看所有档案的策略（使用auth metadata而不是profiles表）
CREATE POLICY "Admin users can view all profiles" ON profiles
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin' OR
    (SELECT raw_user_meta_data ->> 'role' FROM auth.users WHERE id = auth.uid()) = 'admin' OR
    auth.uid() = id  -- 保持原有的用户可以查看自己档案的功能
  );

-- 管理员可以更新所有档案（用于角色管理）
CREATE POLICY "Admin users can update all profiles" ON profiles
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'admin' OR
    (SELECT raw_user_meta_data ->> 'role' FROM auth.users WHERE id = auth.uid()) = 'admin' OR
    auth.uid() = id  -- 保持原有的用户可以更新自己档案的功能
  );