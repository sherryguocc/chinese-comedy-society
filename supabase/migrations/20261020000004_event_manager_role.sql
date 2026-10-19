-- =====================================================================
-- 新角色：活动管理员 event_manager  (20/10/2026)
--
-- 层级：guest < member < event_manager < admin < super_admin
--   event_manager = 会员权限 + 发布活动 + 编辑/删除【自己发布】的活动
--   admin / super_admin 可以编辑/删除所有活动
--
-- 用法：在 Supabase SQL Editor 中整段执行（单个事务，出错整体回滚）。
-- =====================================================================

BEGIN;

-- 1. 角色约束加入 event_manager
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('guest', 'member', 'event_manager', 'admin', 'super_admin'));

-- 2. 会员判断包含 event_manager
CREATE OR REPLACE FUNCTION public.is_member()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(public.current_user_role() IN ('member', 'event_manager', 'admin', 'super_admin'), false)
$$;

-- 3. 能否发布活动
CREATE OR REPLACE FUNCTION public.can_manage_events()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(public.current_user_role() IN ('event_manager', 'admin', 'super_admin'), false)
$$;

GRANT EXECUTE ON FUNCTION public.can_manage_events() TO anon, authenticated;

-- 4. events 写权限：替换原来的 events_admin_write
DROP POLICY IF EXISTS events_admin_write ON public.events;
DROP POLICY IF EXISTS events_insert ON public.events;
DROP POLICY IF EXISTS events_update ON public.events;
DROP POLICY IF EXISTS events_delete ON public.events;

-- 新增：必须以自己的身份发布
CREATE POLICY events_insert ON public.events FOR INSERT
  WITH CHECK (public.can_manage_events() AND create_by = auth.uid());

-- 修改：admin 改全部；event_manager 只能改自己的，且不能把活动转给别人
CREATE POLICY events_update ON public.events FOR UPDATE
  USING      (public.is_admin() OR (public.can_manage_events() AND create_by = auth.uid()))
  WITH CHECK (public.is_admin() OR (public.can_manage_events() AND create_by = auth.uid()));

-- 删除：同上
CREATE POLICY events_delete ON public.events FOR DELETE
  USING (public.is_admin() OR (public.can_manage_events() AND create_by = auth.uid()));

COMMIT;

-- 执行后检查：
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'events' ORDER BY 1;
