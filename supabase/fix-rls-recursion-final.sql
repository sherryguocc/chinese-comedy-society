-- 修复RLS策略无限递归问题 - 最终解决方案
-- Fix RLS policy infinite recursion issue - Final solution

-- 首先删除所有profiles表的策略
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin users can update all profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 方法1：临时禁用RLS来测试
-- Method 1: Temporarily disable RLS for testing
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 方法2：创建一个基于缓存的管理员检查函数
-- Method 2: Create a cached admin check function

-- 创建一个表来缓存管理员状态，避免递归
CREATE TABLE IF NOT EXISTS admin_cache (
  user_id UUID PRIMARY KEY,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建函数来检查管理员状态（不查询profiles表）
CREATE OR REPLACE FUNCTION check_admin_status()
RETURNS BOOLEAN AS $$
DECLARE
  cached_admin BOOLEAN;
BEGIN
  -- 检查缓存
  SELECT is_admin INTO cached_admin 
  FROM admin_cache 
  WHERE user_id = auth.uid() 
  AND updated_at > NOW() - INTERVAL '5 minutes';
  
  IF FOUND THEN
    RETURN cached_admin;
  END IF;
  
  -- 如果缓存不存在或过期，从auth.users的metadata检查
  -- 这避免了查询profiles表
  SELECT COALESCE(raw_user_meta_data ->> 'role' = 'admin', FALSE) 
  INTO cached_admin
  FROM auth.users 
  WHERE id = auth.uid();
  
  -- 更新缓存
  INSERT INTO admin_cache (user_id, is_admin)
  VALUES (auth.uid(), COALESCE(cached_admin, FALSE))
  ON CONFLICT (user_id) 
  DO UPDATE SET is_admin = EXCLUDED.is_admin, updated_at = NOW();
  
  RETURN COALESCE(cached_admin, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 使用新函数创建策略
CREATE POLICY "profiles_select_safe" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR check_admin_status()
  );

CREATE POLICY "profiles_update_safe" ON profiles
  FOR UPDATE USING (
    auth.uid() = id OR check_admin_status()
  );