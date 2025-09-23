-- Fix for profiles table RLS policies
-- 修复 profiles 表的 RLS 策略

-- Add INSERT policy for profiles table to allow user registration
-- 为 profiles 表添加 INSERT 策略以允许用户注册
CREATE POLICY "Allow user registration" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Optional: Add policy to allow viewing other profiles (if needed for admin features)
-- 可选：添加策略以允许查看其他用户档案（如果管理功能需要）
-- CREATE POLICY "Admins can view all profiles" ON profiles
--   FOR SELECT USING (
--     EXISTS (
--       SELECT 1 FROM profiles 
--       WHERE id = auth.uid() 
--       AND role = 'admin'
--     )
--   );

-- Check if the trigger function has proper SECURITY DEFINER
-- 检查触发器函数是否有正确的 SECURITY DEFINER
-- (This should already be set in the schema, but let's verify)

-- Optional: Create a function to manually create missing profiles
-- 可选：创建一个函数来手动创建缺失的档案
CREATE OR REPLACE FUNCTION create_missing_profile(user_id UUID, user_email TEXT, user_full_name TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (user_id, user_email, COALESCE(user_full_name, ''), 'guest')
  ON CONFLICT (id) DO NOTHING;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;