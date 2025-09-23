-- 修复 profiles 表的 RLS 无限递归问题
-- Fix infinite recursion in profiles table RLS policies

-- 1. 首先删除所有现有的 profiles 策略
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow user registration" ON profiles;

-- 2. 重新创建简化的策略

-- 允许用户查看自己的 profile
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- 允许用户更新自己的 profile  
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE 
  USING (auth.uid() = id);

-- 允许插入 profile（用于新用户注册）
-- 这个策略允许任何认证用户为自己创建 profile
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 3. 确保触发器函数有正确的权限
-- 重新创建触发器函数，确保它有 SECURITY DEFINER 权限
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'guest'  -- 默认角色
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 重新创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 5. 手动为当前用户创建 profile（如果不存在）
-- 注意：需要替换为实际的用户 ID
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  'f48a7c5d-18a1-4ce6-af31-3ec1273d27e7'::uuid,
  'sherryguocc@gmail.com',
  '',
  'admin'
) ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  email = EXCLUDED.email;