-- 创建专门的角色用于用户角色查询
-- 这比使用完整的 service_role 更安全

-- 1. 创建专用角色
CREATE ROLE user_role_reader;

-- 2. 只授予必要的权限
GRANT USAGE ON SCHEMA public TO user_role_reader;
GRANT SELECT ON public.admins TO user_role_reader;
GRANT SELECT ON public.profiles TO user_role_reader;

-- 3. 绕过 RLS（仅对这些表）
ALTER TABLE public.admins FORCE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- 4. 为这个角色创建策略
CREATE POLICY "user_role_reader_admins" ON public.admins
  FOR SELECT TO user_role_reader
  USING (true);

CREATE POLICY "user_role_reader_profiles" ON public.profiles  
  FOR SELECT TO user_role_reader
  USING (true);

-- 5. 在 Supabase 中为这个角色创建 JWT
-- 然后在环境变量中使用这个限制权限的 key