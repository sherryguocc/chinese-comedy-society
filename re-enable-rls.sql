-- 重新启用RLS策略
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 确保RLS策略正确设置
-- 这个策略允许用户查看自己的管理员信息
DROP POLICY IF EXISTS "Admins can view own info" ON public.admins;
CREATE POLICY "Admins can view own info" ON public.admins
  FOR SELECT USING (auth.uid() = id);

-- 这个策略允许超级管理员查看所有管理员信息
DROP POLICY IF EXISTS "Super admins can view all admins" ON public.admins;
CREATE POLICY "Super admins can view all admins" ON public.admins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.admins 
      WHERE id = auth.uid() AND is_super_admin = TRUE
    )
  );

-- 查看当前的RLS策略状态
SELECT schemaname, tablename, rowsecurity
FROM pg_tables 
WHERE tablename = 'admins';

-- 查看admins表的策略
SELECT pol.polname, pol.polcmd, pol.polqual, pol.polwithcheck
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pn.nspname = 'public' AND pc.relname = 'admins';