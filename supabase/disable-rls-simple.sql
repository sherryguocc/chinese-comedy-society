-- 最简单的解决方案：临时禁用profiles表的RLS
-- Simplest solution: Temporarily disable RLS for profiles table

-- 删除所有现有策略
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin users can update all profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_select_safe" ON profiles;
DROP POLICY IF EXISTS "profiles_update_safe" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 方案1：完全禁用RLS（适用于管理员需要查看所有用户的场景）
-- Option 1: Completely disable RLS (suitable when admin needs to view all users)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 方案2：如果你想保持一些安全性，可以启用RLS但创建简单策略
-- Option 2: If you want to maintain some security, enable RLS with simple policies
/*
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 简单策略：已认证用户可以查看所有档案
CREATE POLICY "authenticated_can_view_profiles" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- 用户只能更新自己的档案
CREATE POLICY "users_can_update_own_profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
*/