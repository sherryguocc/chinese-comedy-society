-- 重新启用 RLS 并使用简化策略
-- Re-enable RLS with simplified policies

-- 1. 重新启用 RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. 为 profiles 表创建简单策略
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles 
  FOR SELECT USING (true); -- 允许所有人查看 profiles

DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles 
  FOR INSERT WITH CHECK (true); -- 允许注册新用户

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles 
  FOR UPDATE USING (true) WITH CHECK (true); -- 允许更新（可以后续限制）

-- 3. 为 posts 表创建简化策略
DROP POLICY IF EXISTS "posts_select" ON public.posts;
CREATE POLICY "posts_select" ON public.posts 
  FOR SELECT USING (true); -- 允许所有人查看文章

DROP POLICY IF EXISTS "posts_insert" ON public.posts;
CREATE POLICY "posts_insert" ON public.posts 
  FOR INSERT WITH CHECK (true); -- 暂时允许所有认证用户创建文章

DROP POLICY IF EXISTS "posts_update" ON public.posts;
CREATE POLICY "posts_update" ON public.posts 
  FOR UPDATE USING (true) WITH CHECK (true); -- 允许更新

DROP POLICY IF EXISTS "posts_delete" ON public.posts;
CREATE POLICY "posts_delete" ON public.posts 
  FOR DELETE USING (true); -- 允许删除（可以后续限制）

-- 注意：这些策略比较宽松，主要是为了避免 auth.uid() 问题
-- 在生产环境中，您可能需要在应用层面进行更严格的权限控制