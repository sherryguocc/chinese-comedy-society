-- 查看profiles表的当前RLS策略
-- View current RLS policies for profiles table

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 也可以查看所有策略
-- You can also view all policies
-- SELECT * FROM pg_policies WHERE schemaname = 'public';