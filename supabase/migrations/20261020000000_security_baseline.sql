-- =====================================================================
-- 安全基线 Security baseline  (20/10/2026)
--
-- 权限矩阵：
--   文章 / 活动 / 评论：所有人可读
--   评论：member 及以上可发，只能以自己身份发；本人或 admin 可删
--   文件 files 表 + files 存储桶：member 及以上可读 / 下载
--   文章、活动、文件、图片的写操作：admin 及以上
--   profiles：公开字段所有人可读；email / phone_number 只有本人（经 API）和服务端可读
--             用户只能改自己的昵称等字段，不能改 role
--   角色唯一来源：profiles.role（含 super_admin）
--
-- 用法：在 Supabase Dashboard → SQL Editor 中整段执行。
-- 整个脚本在一个事务里，任何一步出错都会整体回滚，不会留下半成品。
-- 注意：会删除 profiles/posts/events/files/comments 上所有现有的 RLS 策略后重建。
-- Storage 策略在下一个文件 20261020000001_storage_policies.sql。
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. 角色约束：加入 super_admin，并把超级管理员写进数据库
-- ---------------------------------------------------------------------
UPDATE public.profiles
SET role = 'guest'
WHERE role IS NULL OR role NOT IN ('guest', 'member', 'admin', 'super_admin');

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('guest', 'member', 'admin', 'super_admin'));
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'guest';
ALTER TABLE public.profiles ALTER COLUMN role SET NOT NULL;

UPDATE public.profiles
SET role = 'super_admin'
WHERE lower(email) = 'sherryguocc@gmail.com';

-- 防呆：如果上面没有匹配到任何账号，直接中止（避免执行后没有超级管理员）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'super_admin') THEN
    RAISE EXCEPTION 'No super_admin found - check the email above before running';
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 2. 角色判断函数（SECURITY DEFINER 绕过 RLS，避免 profiles 策略无限递归）
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_member()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(public.current_user_role() IN ('member', 'admin', 'super_admin'), false)
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(public.current_user_role() IN ('admin', 'super_admin'), false)
$$;

REVOKE ALL ON FUNCTION public.current_user_role() FROM public;
GRANT EXECUTE ON FUNCTION public.current_user_role(), public.is_member(), public.is_admin()
  TO anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. 清空旧策略（之前多次 fix / disable 留下的）
-- ---------------------------------------------------------------------
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE (schemaname = 'public'
           AND tablename IN ('profiles', 'posts', 'events', 'files', 'comments'))
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                   pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- 之前递归修复脚本创建过的辅助表，已不再需要
DROP TABLE IF EXISTS public.admin_cache CASCADE;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 4. profiles：行级 + 列级权限
-- ---------------------------------------------------------------------
CREATE POLICY profiles_select_all ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
-- 不建 INSERT / DELETE 策略：新档案由 handle_new_user 触发器创建，
-- 角色修改走服务端 API（service role，不受 RLS 限制）

-- 列级权限：前端（anon / authenticated）只能读公开字段，只能改资料字段，不能改 role
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.profiles FROM anon, authenticated;

DO $$
DECLARE
  read_cols  text;
  write_cols text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ')
    INTO read_cols
    FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'profiles'
     AND column_name IN ('id', 'full_name', 'username', 'role', 'created_at');

  SELECT string_agg(quote_ident(column_name), ', ')
    INTO write_cols
    FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'profiles'
     AND column_name IN ('full_name', 'username', 'phone_number');

  EXECUTE format('GRANT SELECT (%s) ON public.profiles TO anon, authenticated', read_cols);
  IF write_cols IS NOT NULL THEN
    EXECUTE format('GRANT UPDATE (%s) ON public.profiles TO authenticated', write_cols);
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 5. posts / events：所有人可读，admin 可写
-- ---------------------------------------------------------------------
CREATE POLICY posts_select_all  ON public.posts  FOR SELECT USING (true);
CREATE POLICY posts_admin_write ON public.posts  FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY events_select_all  ON public.events FOR SELECT USING (true);
CREATE POLICY events_admin_write ON public.events FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------
-- 6. files 表：member 可读，admin 可写
-- ---------------------------------------------------------------------
CREATE POLICY files_member_select ON public.files FOR SELECT USING (public.is_member());
CREATE POLICY files_admin_write   ON public.files FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------
-- 7. comments：所有人可读；member 以自己身份发；本人或 admin 可删
-- ---------------------------------------------------------------------
CREATE POLICY comments_select_all ON public.comments FOR SELECT USING (true);
CREATE POLICY comments_member_insert ON public.comments FOR INSERT
  WITH CHECK (public.is_member() AND author_id = auth.uid());
CREATE POLICY comments_delete_own_or_admin ON public.comments FOR DELETE
  USING (author_id = auth.uid() OR public.is_admin());

COMMIT;

-- 执行后检查：
-- SELECT tablename, policyname, cmd FROM pg_policies
--  WHERE schemaname IN ('public','storage') ORDER BY 1, 2;
-- SELECT id, email, role FROM public.profiles WHERE role IN ('admin','super_admin');
