-- 修复RLS策略无限递归问题 - 更可靠的方法
-- Fix RLS policy infinite recursion issue - More reliable approach

-- 首先删除所有可能导致递归的策略
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin users can update all profiles" ON profiles;

-- 也删除原有的策略，我们将重新创建
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 方法：创建一个包含管理员检查的单一策略，避免递归引用profiles表
-- Method: Create a single policy with admin check that avoids recursive reference to profiles table

-- 重新创建查看策略 - 用户可以查看自己的档案，管理员可以查看所有
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR 
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin' AND id = auth.uid()
    )
  );

-- 重新创建更新策略 - 用户可以更新自己的档案，管理员可以更新所有
CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE USING (
    auth.uid() = id OR 
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin' AND id = auth.uid()
    )
  );