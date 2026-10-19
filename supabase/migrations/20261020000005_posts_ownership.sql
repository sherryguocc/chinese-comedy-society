-- =====================================================================
-- 文章权限：管理员只能改/删自己的文章，超级管理员可以改/删所有文章 (20/10/2026)
--
-- 用法：在 Supabase SQL Editor 中整段执行（单个事务，出错整体回滚）。
-- =====================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(public.current_user_role() = 'super_admin', false)
$$;

GRANT EXECUTE ON FUNCTION public.is_super_admin() TO anon, authenticated;

-- 替换原来的 posts_admin_write（admin 可写所有文章）
DROP POLICY IF EXISTS posts_admin_write ON public.posts;
DROP POLICY IF EXISTS posts_insert ON public.posts;
DROP POLICY IF EXISTS posts_update ON public.posts;
DROP POLICY IF EXISTS posts_delete ON public.posts;

-- 新增：admin 及以上，且必须以自己的身份发布
CREATE POLICY posts_insert ON public.posts FOR INSERT
  WITH CHECK (public.is_admin() AND author_id = auth.uid());

-- 修改：super_admin 改全部；admin 只能改自己的，且不能把文章转给别人
CREATE POLICY posts_update ON public.posts FOR UPDATE
  USING      (public.is_super_admin() OR (public.is_admin() AND author_id = auth.uid()))
  WITH CHECK (public.is_super_admin() OR (public.is_admin() AND author_id = auth.uid()));

-- 删除：同上（评论会随文章级联删除）
CREATE POLICY posts_delete ON public.posts FOR DELETE
  USING (public.is_super_admin() OR (public.is_admin() AND author_id = auth.uid()));

COMMIT;

-- 执行后检查：
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'posts' ORDER BY 1;
